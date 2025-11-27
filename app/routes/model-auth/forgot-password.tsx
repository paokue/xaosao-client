import { modelForgotPassword } from "~/services/model-auth.server";
import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";
import { validateModelForgotPasswordInputs } from "~/services/model-validation.server";
import { Loader } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Forgot Password - Companion | XaoSao" },
    { name: "description", content: "Reset your model account password" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== "POST") {
    return {
      error: "Invalid request method",
    };
  }

  const formData = await request.formData();
  const whatsappRaw = formData.get("whatsapp");

  if (!whatsappRaw) {
    return {
      error: "Please provide your phone number",
    };
  }

  try {
    // Parse and validate phone number
    const whatsapp = Number(whatsappRaw);

    // Check if phone number is valid number
    if (isNaN(whatsapp) || whatsapp <= 0) {
      return {
        error: "Invalid phone number format. Please enter digits only.",
      };
    }

    // Validate against injection and business rules
    validateModelForgotPasswordInputs({ whatsapp });

    const result = await modelForgotPassword(whatsapp);

    if (result.success) {
      return redirect(`/model-auth/verify-otp?whatsapp=${whatsapp}`);
    }

    return {
      error: result.message || "Failed to send OTP",
    };
  } catch (error: any) {
    // Handle validation errors
    if (error && typeof error === "object" && !error.message) {
      const validationError = Object.values(error)[0];
      return {
        error: String(validationError),
      };
    }

    return {
      error: error.message || "Something went wrong. Please try again.",
    };
  }
}

export default function ModelForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-4 sm:p-8 rounded-lg shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/images/logo-pink.png" className="w-30 h-10" />
          </div>
          <h2 className="mt-6 text-xl text-gray-900">Forgot password?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your phone number and we'll send OTP to reset your password!
          </p>
        </div>

        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {actionData.error}
          </div>
        )}

        {/* Forgot Password Form */}
        <Form method="post" className="mt-6 space-y-6">
          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              Phone number <span className="text-rose-500">*</span>
            </label>
            <input
              id="whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10}"
              required
              minLength={10}
              maxLength={10}
              placeholder="2012345678"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer group relative w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/model-auth/login"
              className="font-medium text-rose-600 hover:text-rose-500 text-sm"
            >
              ← Back to login
            </Link>
          </div>
        </Form>

        <div className="mt-6 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            You will receive a 6-digit OTP code via SMS. The code will be valid for 60 seconds!
          </p>
        </div>
      </div>
    </div>
  );
}
