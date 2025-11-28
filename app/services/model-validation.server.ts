import { z } from "zod";
import type {
  IModelSigninCredentials,
  IModelSignupCredentials,
} from "~/services/model-auth.server";

/**
 * Enhanced SQL injection and XSS protection
 * Blocks only dangerous patterns while allowing common special characters
 * Allowed: $, !, @, #, %, *, (, ), -, +, and other common punctuation
 * Blocked:
 * - Path traversal: ../, ..\, //
 * - Script tags: <script>, <, >
 * - SQL injection keywords and patterns
 * - JavaScript protocols
 */
const blockInjection = (value: string): boolean => {
  // Path traversal patterns - DANGEROUS
  const pathTraversalPatterns = [
    /\.\.\//g, // Directory traversal ../
    /\.\.\\/g, // Windows directory traversal ..\
    /%2e%2e\//gi, // URL-encoded traversal %2e%2e/
    /\/\//g, // Double slashes //
  ];

  // HTML/Script tags - DANGEROUS
  const htmlTagPatterns = [
    /<script[\s\S]*?>/gi, // <script> opening tag
    /<\/script>/gi, // </script> closing tag
    /<iframe[\s\S]*?>/gi, // <iframe> tags
    /<object[\s\S]*?>/gi, // <object> tags
    /<embed[\s\S]*?>/gi, // <embed> tags
    /<.*?>/g, // Any HTML tag with < and >
  ];

  // JavaScript protocols - DANGEROUS
  const scriptProtocolPatterns = [
    /javascript:/gi, // javascript: protocol
    /vbscript:/gi, // VBScript protocol
    /data:text\/html/gi, // Data URI for HTML
  ];

  // SQL Injection - DANGEROUS
  const sqlPatterns = [
    /\b(select|insert|update|delete|drop|alter|create|exec|execute|union|grant|revoke|truncate|xp_cmdshell|call|declare|merge)\b\s+(from|into|table|database|user)/gi, // SQL keywords with common follow-up words
    /(union\s+all\s+select|union\s+select)/gi, // UNION-based attacks
    /\b(or|and)\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/gi, // OR '1'='1', AND 1=1
    /;.*?(drop|delete|update|insert)/gi, // SQL terminator followed by dangerous keywords
  ];

  // Event handlers - DANGEROUS
  const eventHandlerPatterns = [
    /on\w+\s*=\s*["'].*?["']/gi, // Event handlers: onclick=, onerror=, etc.
    /eval\s*\(/gi, // eval() function
    /expression\s*\(/gi, // CSS expression()
  ];

  // Test all dangerous patterns
  const dangerousPatterns = [
    ...pathTraversalPatterns,
    ...htmlTagPatterns,
    ...scriptProtocolPatterns,
    ...sqlPatterns,
    ...eventHandlerPatterns,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(value));
};

/**
 * Creates a refined string schema with:
 * 1. Trimming whitespace
 * 2. Empty value check
 * 3. SQL injection & XSS protection
 */
const refineSafe = (schema: z.ZodString) =>
  schema
    .trim()
    .refine((val) => val.length > 0, {
      message: "This field cannot be empty.",
    })
    .refine(blockInjection, {
      message:
        "Invalid input detected. Please remove special characters or scripts.",
    });

/**
 * Sanitizes phone number input
 * - Removes all non-digit characters
 * - Validates length
 */
const sanitizePhoneNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") throw new Error("Invalid phone number type");

  // Remove all non-digit characters
  const digitsOnly = value.replace(/\D/g, "");

  // Convert to number
  const phoneNumber = parseInt(digitsOnly, 10);

  if (isNaN(phoneNumber)) {
    throw new Error("Phone number must contain only digits");
  }

  return phoneNumber;
};

/**
 * Phone number validation schema
 * - Must be exactly 10 digits
 * - Only numeric characters allowed
 * - Common Lao phone prefixes: 20, 30, etc.
 */
const phoneNumberSchema = z
  .union([z.string(), z.number()])
  .transform(sanitizePhoneNumber)
  .refine((val) => val >= 1000000000 && val <= 9999999999, {
    message: "Phone number must be exactly 10 digits.",
  })
  .refine((val) => {
    const str = val.toString();
    // Validate Lao phone number format (starts with 20, 30, etc.)
    return /^[2-9]\d{9}$/.test(str);
  }, {
    message: "Please enter a valid Lao phone number.",
  });

// ====================== Model Sign In Validation ======================

const modelSignInSchema = z.object({
  whatsapp: phoneNumberSchema,
  password: refineSafe(
    z
      .string()
      .min(8, "Password must be at least 8 characters long.")
      .max(128, "Password is too long.")
  ),
  rememberMe: z.boolean(),
});

export function validateModelSignInInputs(input: IModelSigninCredentials) {
  const result = modelSignInSchema.safeParse(input);

  if (!result.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      errors[key] = issue.message;
    }
    throw errors;
  }

  return result.data;
}

// ====================== Model Sign Up Validation ======================

const modelSignUpSchema = z
  .object({
    firstName: refineSafe(
      z
        .string()
        .min(2, "First name must be at least 2 characters long.")
        .max(50, "First name must be at most 50 characters long.")
        .regex(/^[a-zA-Z\s\u0E80-\u0EFF]+$/, {
          message:
            "First name can only contain letters and spaces (English or Lao).",
        })
    ),
    lastName: z
      .string()
      .trim()
      .max(50, "Last name must be at most 50 characters long.")
      .regex(/^[a-zA-Z\s\u0E80-\u0EFF]*$/, {
        message:
          "Last name can only contain letters and spaces (English or Lao).",
      })
      .optional()
      .or(z.literal("")),
    username: refineSafe(
      z
        .string()
        .min(3, "Username must be at least 3 characters long.")
        .max(30, "Username must be at most 30 characters long.")
        .regex(/^[a-zA-Z0-9_.-]+$/, {
          message:
            "Username can only contain letters, numbers, dots, hyphens, and underscores.",
        })
    ),
    password: refineSafe(
      z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .max(128, "Password is too long.")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        })
    ),
    dob: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, {
        message: "Date of birth must be in YYYY-MM-DD format.",
      })
      .refine(
        (date) => {
          const birthDate = new Date(date);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          return age >= 18 && age <= 100;
        },
        {
          message: "You must be at least 18 years old and under 100 years old.",
        }
      ),
    gender: z.enum(["male", "female", "other"], {
      message: "Gender must be one of: male, female, or other.",
    }),
    whatsapp: phoneNumberSchema,
    bio: refineSafe(
      z
        .string()
        .min(10, "Bio must be at least 10 characters long.")
        .max(500, "Bio must be at most 500 characters long.")
    ),
    profile: z.string().url("Invalid profile image URL."),
    address: refineSafe(
      z
        .string()
        .min(5, "Address must be at least 5 characters long.")
        .max(200, "Address must be at most 200 characters long.")
    ),
    career: z
      .string()
      .trim()
      .max(100, "Career must be at most 100 characters long.")
      .refine(blockInjection, {
        message: "Invalid input detected in career field.",
      })
      .optional()
      .or(z.literal("")),
    education: z
      .string()
      .trim()
      .max(100, "Education must be at most 100 characters long.")
      .refine(blockInjection, {
        message: "Invalid input detected in education field.",
      })
      .optional()
      .or(z.literal("")),
    interests: z
      .array(
        z
          .string()
          .trim()
          .min(1, "Interest cannot be empty.")
          .max(50, "Each interest must be at most 50 characters long.")
          .refine(blockInjection, {
            message: "Invalid input detected in interests.",
          })
      )
      .max(10, "You can add up to 10 interests only.")
      .optional(),
  })
  .strict(); // Reject any extra fields not defined in schema

export function validateModelSignUpInputs(input: IModelSignupCredentials) {
  const result = modelSignUpSchema.safeParse(input);

  if (!result.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      errors[key] = issue.message;
    }
    throw errors;
  }

  return result.data;
}

// ====================== Model Forgot Password Validation ======================
const modelForgotPasswordSchema = z.object({
  whatsapp: phoneNumberSchema,
});

export function validateModelForgotPasswordInputs(input: { whatsapp: number }) {
  const result = modelForgotPasswordSchema.safeParse(input);

  if (!result.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      errors[key] = issue.message;
    }
    throw errors;
  }

  return result.data;
}

// ====================== Model Reset Password Validation ======================
const modelResetPasswordSchema = z
  .object({
    token: z
      .string()
      .trim()
      .length(6, "Reset token must be exactly 6 characters.")
      .regex(/^[A-F0-9]{6}$/, {
        message: "Invalid token format. Must be 6 uppercase hexadecimal characters.",
      }),
    password: refineSafe(
      z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .max(128, "Password is too long.")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
          message:
            "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
        })
    ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export function validateModelResetPasswordInputs(input: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  const result = modelResetPasswordSchema.safeParse(input);

  if (!result.success) {
    const errors: Partial<Record<string, string>> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string;
      errors[key] = issue.message;
    }
    throw errors;
  }

  return result.data;
}
