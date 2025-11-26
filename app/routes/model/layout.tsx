import type { LoaderFunctionArgs } from "react-router";
import { Outlet, Link, useLoaderData, Form, useLocation } from "react-router";
import { requireModelSession, destroyModelSession } from "~/services/model-auth.server";
import { getModelDashboardData } from "~/services/model.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const modelId = await requireModelSession(request);

  if (!modelId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const model = await getModelDashboardData(modelId);

  if (!model) {
    throw new Response("Model not found", { status: 404 });
  }

  return { model };
}

export async function action({ request }: LoaderFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "logout") {
    return await destroyModelSession(request);
  }

  return null;
}

export default function ModelLayout() {
  const { model } = useLoaderData<typeof loader>();
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/model/dashboard", icon: "📊" },
    { name: "Matches", href: "/model/matches", icon: "💕" },
    { name: "Booking Requests", href: "/model/requests", icon: "📅" },
    { name: "Services", href: "/model/services", icon: "🎯" },
    { name: "My Profile", href: "/model/profile", icon: "👤" },
    { name: "Earnings", href: "/model/earnings", icon: "💰" },
    { name: "Messages", href: "/model/messages", icon: "💬" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/model/dashboard" className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                XaoSao Model
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {/* Availability Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  model.available_status === "available"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {model.available_status}
                </span>
              </div>

              {/* Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {model.firstName} {model.lastName}
                  </p>
                  <p className="text-xs text-gray-500">Model</p>
                </div>
                {model.profile ? (
                  <img
                    src={model.profile}
                    alt="Profile"
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-medium">
                    {model.firstName.charAt(0)}
                  </div>
                )}
              </div>

              {/* Logout */}
              <Form method="post">
                <input type="hidden" name="intent" value="logout" />
                <button
                  type="submit"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </Form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] sticky top-16">
          <nav className="px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Stats in Sidebar */}
          <div className="px-4 py-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Quick Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Rating</span>
                <span className="font-medium">⭐ {model.rating.toFixed(1)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Reviews</span>
                <span className="font-medium">{model.total_review}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Balance</span>
                <span className="font-medium text-green-600">
                  ${model.Wallet[0]?.totalBalance.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
