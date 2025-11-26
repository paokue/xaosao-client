import { useState } from "react";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";

// services
import { modelLogin } from "~/services/model-auth.server";
import type { IModelSigninCredentials } from "~/services/model-auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Companion Login - XaoSao" },
    { name: "description", content: "Login to your companion account" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const reset = url.searchParams.get("reset");

  return {
    showResetSuccess: reset === "success"
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const whatsapp = formData.get("whatsapp");
  const password = formData.get("password");
  const rememberMe = formData.get("rememberMe") === "on";

  if (!whatsapp || !password) {
    return {
      error: "Please provide both WhatsApp number and password",
    };
  }

  try {
    const credentials: IModelSigninCredentials = {
      whatsapp: Number(whatsapp),
      password: String(password),
      rememberMe,
    };

    return await modelLogin(credentials);
  } catch (error: any) {
    return {
      error: error.message || "Login failed. Please check your credentials.",
    };
  }
}

export default function ModelLogin() {
  const { showResetSuccess } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-md shadow-xl">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/images/logo-pink.png" className="w-30 h-10" />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your dashboard
          </p>
        </div>

        {showResetSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Password reset successful!</p>
            <p className="text-sm mt-1">You can now login with your new password.</p>
          </div>
        )}

        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        <Form method="post" className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                Phone number <span className="text-rose-500">*</span>
              </label>
              <input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                required
                maxLength={10}
                placeholder="2012345678"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <Link
                to="/model-auth/forgot-password"
                className="text-sm font-medium text-rose-600 hover:text-rose-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 bg-rose-500 text-sm font-medium rounded-sm text-white"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="flex items-center justify-center text-sm">
            Don't have an account yet?&nbsp;&nbsp;
            <Link
              to="/model-auth/register"
              className="font-medium text-rose-600 hover:text-rose-500"
            >
              Create new account.
            </Link>
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Are you a customer?{" "}
              <Link to="/login" className="font-medium text-black hover:text-rose-500 uppercase text-xs ml-2">
                Login here
              </Link>
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}
