import { useState } from "react";
import { ArrowLeft, AlertCircle, Send } from "lucide-react";
import { Link } from "react-router";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Report an Issue - Model Settings" },
    { name: "description", content: "Report technical issues or problems" },
  ];
};

export default function ReportSettings() {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");

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
          <div className="p-2 bg-rose-100 rounded-lg">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              Report an Issue
            </h1>
            <p className="text-sm text-gray-600">Let us know about any problems</p>
          </div>
        </div>
      </div>

      {/* Report Form */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <form className="space-y-4">
          {/* Issue Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">Select an issue type</option>
              <option value="technical">Technical Problem</option>
              <option value="payment">Payment Issue</option>
              <option value="account">Account Problem</option>
              <option value="chat">Chat/Messaging Issue</option>
              <option value="profile">Profile Issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              placeholder="Brief description of the issue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              placeholder="Please provide detailed information about the issue you're experiencing..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-rose-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-rose-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Report
          </button>
        </form>
      </div>

      {/* Help Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium mb-1">Need immediate help?</p>
            <p className="text-xs text-blue-700">
              For urgent issues, please contact our support team directly at{" "}
              <a href="mailto:support@xaosao.com" className="underline font-medium">
                support@xaosao.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
