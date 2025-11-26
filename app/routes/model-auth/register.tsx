import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { useState } from "react";
import { modelRegister } from "~/services/model-auth.server";
import type { IModelSignupCredentials } from "~/services/model-auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Model Registration - XaoSao" },
    { name: "description", content: "Register as a model" },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();

  const firstName = formData.get("firstName");
  const lastName = formData.get("lastName");
  const username = formData.get("username");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const dob = formData.get("dob");
  const gender = formData.get("gender");
  const whatsapp = formData.get("whatsapp");
  const bio = formData.get("bio");
  const hourly_rate_talking = formData.get("hourly_rate_talking");
  const hourly_rate_video = formData.get("hourly_rate_video");

  // Validation
  if (!firstName || !username || !password || !dob || !gender || !whatsapp || !bio) {
    return {
      error: "Please fill in all required fields",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match",
    };
  }

  if (String(password).length < 8) {
    return {
      error: "Password must be at least 8 characters",
    };
  }

  try {
    // Get client IP
    const ip = request.headers.get("x-forwarded-for") ||
               request.headers.get("x-real-ip") ||
               "127.0.0.1";

    const accessKey = process.env.APIIP_API_KEY || "";

    const modelData: IModelSignupCredentials = {
      firstName: String(firstName),
      lastName: lastName ? String(lastName) : undefined,
      username: String(username),
      password: String(password),
      dob: String(dob),
      gender: String(gender) as "male" | "female" | "other",
      whatsapp: Number(whatsapp),
      bio: String(bio),
      hourly_rate_talking: hourly_rate_talking ? Number(hourly_rate_talking) : undefined,
      hourly_rate_video: hourly_rate_video ? Number(hourly_rate_video) : undefined,
    };

    const result = await modelRegister(modelData, ip.split(",")[0], accessKey);

    if (result.success) {
      return {
        success: true,
        message: result.message,
      };
    }

    return { error: result.message };
  } catch (error: any) {
    return {
      error: error.message || "Registration failed. Please try again.",
    };
  }
}

export default function ModelRegister() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 px-4 py-12">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Become a Model</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our platform and start earning
          </p>
        </div>

        {/* Success Message */}
        {actionData?.success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            <p className="font-medium">{actionData.message}</p>
            <p className="text-sm mt-1">Your account is pending approval. You will be notified once approved.</p>
            <Link
              to="/model-auth/login"
              className="inline-block mt-3 text-sm font-medium text-green-600 hover:text-green-500"
            >
              Go to Login →
            </Link>
          </div>
        )}

        {/* Error Message */}
        {actionData?.error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {actionData.error}
          </div>
        )}

        {/* Registration Form */}
        {!actionData?.success && (
          <Form method="post" className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  required
                  placeholder="8562012345678"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Hourly Rate Talking */}
              <div>
                <label htmlFor="hourly_rate_talking" className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (Voice Call)
                </label>
                <input
                  id="hourly_rate_talking"
                  name="hourly_rate_talking"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              {/* Hourly Rate Video */}
              <div>
                <label htmlFor="hourly_rate_video" className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate (Video Call)
                </label>
                <input
                  id="hourly_rate_video"
                  name="hourly_rate_video"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Bio *
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                required
                placeholder="Tell us about yourself..."
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password * (minimum 8 characters)
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating Account..." : "Register as Model"}
              </button>
            </div>

            {/* Links */}
            <div className="text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/model-auth/login" className="font-medium text-pink-600 hover:text-pink-500">
                  Sign in
                </Link>
              </p>
            </div>

            {/* Customer Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Looking for dates?{" "}
                <Link to="/auth/register" className="font-medium text-purple-600 hover:text-purple-500">
                  Register as Customer
                </Link>
              </p>
            </div>
          </Form>
        )}
      </div>
    </div>
  );
}
