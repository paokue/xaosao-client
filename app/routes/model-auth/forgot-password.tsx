import { modelForgotPassword } from "~/services/model-auth.server";
import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, redirect, useActionData, useNavigation } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Forgot Password - Companion | XaoSao" },
    { name: "description", content: "Reset your model account password" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const whatsapp = formData.get("whatsapp");

  if (!whatsapp) {
    return {
      error: "Please provide your WhatsApp number",
    };
  }

  try {
    const result = await modelForgotPassword(Number(whatsapp));

    if (result.success) {
      return redirect(`/model-auth/verify-otp?whatsapp=${whatsapp}`);
    }

    return {
      error: result.message || "Failed to send OTP",
    };
  } catch (error: any) {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-xl">
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
              type="tel"
              required
              id="whatsapp"
              name="whatsapp"
              maxLength={10}
              placeholder="2012345678"
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-sm text-white bg-rose-500"
            >
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/model-auth/login"
              className="font-medium text-pink-600 hover:text-pink-500 text-sm"
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
