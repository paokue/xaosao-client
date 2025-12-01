import {
  Lock,
  Trash2,
  Wallet,
  Settings,
  Briefcase,
  AlertCircle,
  ChevronRight
} from "lucide-react";
import { useNavigate, useLocation, Outlet } from "react-router";
import type { MetaFunction } from "react-router";
import { useEffect } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Settings - Model Dashboard" },
    { name: "description", content: "Manage your model account settings" },
  ];
};

export default function ModelSettings() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: "services", label: "Services Apply", icon: Briefcase, path: "/model/settings/services", description: "Manage your service offerings" },
    { id: "wallet", label: "My Wallet", icon: Wallet, path: "/model/settings/wallet", description: "View balance and transactions" },
    { id: "password", label: "Password Change", icon: Lock, path: "/model/settings/password", description: "Update your password" },
    { id: "report", label: "Report an Issue", icon: AlertCircle, path: "/model/settings/report", description: "Report technical issues" },
    { id: "delete", label: "Delete Account", icon: Trash2, path: "/model/settings/delete-account", description: "Permanently delete account" },
  ];

  // Redirect to first tab if on settings index
  useEffect(() => {
    if (location.pathname === "/model/settings") {
      navigate("/model/settings/services", { replace: true });
    }
  }, [location.pathname, navigate]);

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen py-4 sm:py-6 px-4 sm:px-8">
      <div className="mb-6 px-0 sm:px-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-rose-100 rounded-lg">
            <Settings className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <h1 className="text-md">
              Settings
            </h1>
            <p className="text-gray-600 text-sm">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <div className="block lg:hidden px-0 sm:px-8">
        <div className="bg-white rounded-xl overflow-hidden border border-green-500">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`w-full flex items-center justify-between p-4 hover:bg-rose-50 transition-colors ${index !== tabs.length - 1 ? "border-b border-gray-100" : ""
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${tab.id === "delete" ? "bg-red-100" : "bg-rose-100"
                    }`}>
                    <Icon className={`w-4 h-4 ${tab.id === "delete" ? "text-red-600" : "text-rose-600"
                      }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{tab.label}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tab.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="hidden lg:block px-0 sm:px-8">
        <div className="bg-white rounded-xl overflow-hidden px-6">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentPath === tab.path;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(tab.path)}
                  className={`cursor-pointer flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-colors ${isActive
                    ? tab.id === "delete"
                      ? "border-b-2 border-red-500 text-red-600 bg-red-50"
                      : "border-b-2 border-rose-500 text-rose-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm hidden xl:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="py-6 min-h-[500px]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}