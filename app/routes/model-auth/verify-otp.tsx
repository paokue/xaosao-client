import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { modelVerifyResetToken, modelForgotPassword } from "~/services/model-auth.server";
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Verify OTP - Model | XaoSao" },
    { name: "description", content: "Verify your OTP code" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const whatsapp = url.searchParams.get("whatsapp");

  if (!whatsapp) {
    return redirect("/model-auth/forgot-password");
  }

  return { whatsapp };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const whatsapp = formData.get("whatsapp");
  const otp = formData.get("otp");

  if (intent === "resend") {
    if (!whatsapp) {
      return {
        error: "WhatsApp number is required",
      };
    }

    try {
      await modelForgotPassword(Number(whatsapp));
      return {
        success: true,
        message: "OTP has been resent to your WhatsApp number",
      };
    } catch (error: any) {
      return {
        error: error.message || "Failed to resend OTP",
      };
    }
  }

  if (!otp || !whatsapp) {
    return {
      error: "Please enter the OTP code",
    };
  }

  try {
    const result = await modelVerifyResetToken(String(otp));

    if (result.isValid) {
      return redirect(`/model-auth/reset-password?token=${otp}`);
    }

    return {
      error: "Invalid or expired OTP code",
    };
  } catch (error: any) {
    return {
      error: error.message || "Failed to verify OTP",
    };
  }
}

export default function ModelVerifyOTP() {
  const { whatsapp } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for resend
  useState(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const otpValue = otp.join("");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-2 sm:p-8 rounded-lg shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/images/logo-pink.png" className="w-30 h-10" />
          </div>
          <h2 className="mt-6 text-xl text-gray-900">Verify OTP</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to &nbsp;
            <span className="font-medium text-gray-900">{whatsapp}</span>
          </p>
        </div>

        {actionData?.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {actionData.message}
          </div>
        )}

        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="whatsapp" value={whatsapp} />
          <input type="hidden" name="otp" value={otpValue} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-start">
              Enter OTP Code <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 justify-between">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || otpValue.length !== 6}
              className="cursor-pointer group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-rose-500"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </Form>

        <div className="flex items-center justify-between">
          <div className="text-center">
            <Link
              to="/model-auth/forgot-password"
              className="font-medium text-gray-600 hover:text-gray-500 text-sm"
            >
              ← Use a different number
            </Link>
          </div>
          <Form method="post">
            <input type="hidden" name="intent" value="resend" />
            <input type="hidden" name="whatsapp" value={whatsapp} />
            {canResend ? (
              <button
                type="submit"
                className="font-medium text-rose-600 hover:text-rose-500 text-sm cursor-pointer"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                Resend OTP in <span className="font-medium text-rose-600">{countdown}s</span>
              </p>
            )}
          </Form>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            The OTP is valid for 60 seconds. If you don't receive it, please check your phone
            number and try again!
          </p>
        </div>
      </div>
    </div>
  );
}
