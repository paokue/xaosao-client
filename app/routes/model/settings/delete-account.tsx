import { useState } from "react";
import { ArrowLeft, Trash2, AlertCircle, ShieldAlert } from "lucide-react";
import { Link } from "react-router";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Delete Account - Model Settings" },
    { name: "description", content: "Permanently delete your account" },
  ];
};

export default function DeleteAccountSettings() {
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isConfirmed = confirmText === "DELETE";

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 p-4">
      {/* Mobile Header */}
      <div className="mb-6">
        <Link
          to="/model/settings"
          className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Settings</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">
              Delete Account
            </h1>
            <p className="text-sm text-gray-600">Permanently remove your account</p>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900 mb-2 text-lg">
              ⚠️ Warning: This Action Cannot Be Undone
            </h3>
            <p className="text-red-800 text-sm mb-3">
              Deleting your account will permanently remove ALL of your data from our system. This includes:
            </p>
            <ul className="space-y-2 text-red-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Your profile information, photos, and personal details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>All service history, bookings, and reviews</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Your wallet balance and transaction history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>All messages and conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Friend connections and contacts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 font-bold">•</span>
                <span>Any pending payments or withdrawals</span>
              </li>
            </ul>
            <p className="text-red-900 text-sm font-bold mt-3 bg-red-100 p-2 rounded">
              This action is IRREVERSIBLE and IMMEDIATE. Your account cannot be recovered once deleted.
            </p>
          </div>
        </div>
      </div>

      {/* Deletion Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Confirm Account Deletion
        </h2>

        <form className="space-y-4">
          {/* Confirmation Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Type DELETE"
            />
            {confirmText && !isConfirmed && (
              <p className="text-xs text-red-600 mt-1">
                Please type "DELETE" exactly as shown
              </p>
            )}
          </div>

          {/* Password Confirmation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your password to confirm{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-800"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Reason (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you deleting your account? (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="Help us improve by telling us why you're leaving..."
            />
          </div>

          {/* Delete Button */}
          <button
            type="submit"
            disabled={!isConfirmed || !password}
            className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isConfirmed && password
                ? "bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Permanently Delete Account
          </button>
        </form>
      </div>

      {/* Alternative Options */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">
              Looking for alternatives?
            </p>
            <p className="text-xs text-blue-700">
              Instead of deleting, you can temporarily deactivate your account or adjust your privacy settings. Contact{" "}
              <a href="mailto:support@xaosao.com" className="underline font-medium">
                support@xaosao.com
              </a>{" "}
              for assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
