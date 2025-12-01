import { useState, useEffect } from "react";
import { Trash2, ShieldAlert, Eye, EyeOff, Loader } from "lucide-react";
import { Form, useNavigation, useSearchParams, redirect } from "react-router";
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from "react-router";

// components:
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";

// services:
import { deleteModelAccount } from "~/services/model.server";
import { requireModelSession } from "~/services/model-auth.server";
import { destroyModelSession } from "~/services/model-auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Delete Account - Model Settings" },
    { name: "description", content: "Permanently delete your account" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requireModelSession(request);
  return null;
}

export async function action({ request }: ActionFunctionArgs) {
  const modelId = await requireModelSession(request);
  const formData = await request.formData();

  const reason = formData.get("reason") as string;
  const password = formData.get("password") as string;
  const confirmText = formData.get("confirmText") as string;

  // Validation
  if (!confirmText || !password) {
    return redirect(
      `/model/settings/delete-account?error=${encodeURIComponent("All required fields must be filled!")}`
    );
  }

  if (confirmText !== "DELETE") {
    return redirect(
      `/model/settings/delete-account?error=${encodeURIComponent("You must type DELETE exactly as shown to confirm!")}`
    );
  }

  try {
    const result = await deleteModelAccount(modelId, password, reason || undefined);

    if (result?.success) {
      await destroyModelSession(request);

      return redirect(
        `/model/login?message=${encodeURIComponent("Your account has been permanently deleted.")}`
      );
    } else {
      return redirect(
        `/model/settings/delete-account?error=${encodeURIComponent("Failed to delete account!")}`
      );
    }
  } catch (error: any) {
    return redirect(
      `/model/settings/delete-account?error=${encodeURIComponent(error.message || "Failed to delete account!")}`
    );
  }
}

export default function DeleteAccountSettings() {
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isSubmitting = navigation.state === "submitting";

  const errorMessage = searchParams.get("error");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (errorMessage) {
      const timeout = setTimeout(() => {
        searchParams.delete("error");
        setSearchParams(searchParams, { replace: true });
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [errorMessage, searchParams, setSearchParams]);

  return (
    <div className="p-2 sm:p-4 lg:p-0 space-y-4">
      <div className="mb-6 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Trash2 className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <h1 className="text-md">
              Delete Account
            </h1>
            <p className="text-sm text-gray-600">Permanently remove your account</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-sm p-3 sm:p-6 border">
        <Form method="post" className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="confirmText">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm{" "}
              <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="confirmText"
              name="confirmText"
              type="text"
              placeholder="Type DELETE"
              required
              disabled={isSubmitting}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Enter your password to confirm{" "}
              <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                disabled={isSubmitting}
                className="text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <Eye className="w-4 h-4 cursor-pointer" />
                ) : (
                  <EyeOff className="w-4 h-4 cursor-pointer" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Why are you deleting your account? (Optional)
            </Label>
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="Help us improve by telling us why you're leaving..."
              disabled={isSubmitting}
              className="resize-none text-sm"
            />
          </div>

          <div className="w-full flex justify-end sm:justify-start">
            <Button
              type="submit"
              className="w-auto bg-red-600 text-white hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader size={18} className="animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isSubmitting ? "Deleting Account..." : "Permanently Delete Account"}
            </Button>
          </div>
        </Form>
      </div>

      <div className="bg-red-50 border border-red-300 rounded-sm p-4 mb-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-red-700 mb-2 text-md">
              Warning: This Action Cannot Be Undone
            </h3>
            <p className="text-red-700 text-sm mb-3">
              Deleting your account will permanently remove ALL of your data from our system. This includes:
            </p>
            <ul className="space-y-1 text-red-700 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Your profile information, photos, and personal details</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>All service history, bookings, and reviews</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Your wallet balance and transaction history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>All messages and conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Friend connections and contacts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">•</span>
                <span>Any pending payments or withdrawals</span>
              </li>
            </ul>
            <p className="text-red-700 text-sm font-bold mt-3 bg-red-100 p-2 rounded">
              This action is IRREVERSIBLE and IMMEDIATE. Your account cannot be recovered once deleted.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
