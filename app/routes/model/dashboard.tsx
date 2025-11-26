import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, Link } from "react-router";
import { requireModelSession } from "~/services/model-auth.server";
import {
  getModelDashboardStats,
  getModelBookingRequests,
  getCustomersWhoLikedModel,
} from "~/services/model.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Model Dashboard - XaoSao" },
    { name: "description", content: "Your model dashboard" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const modelId = await requireModelSession(request);

  if (!modelId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const [stats, pendingBookings, recentLikes] = await Promise.all([
    getModelDashboardStats(modelId),
    getModelBookingRequests(modelId, "pending"),
    getCustomersWhoLikedModel(modelId),
  ]);

  return {
    stats,
    pendingBookings: (pendingBookings || []).slice(0, 5), // Show only 5 most recent
    recentLikes: (recentLikes || []).slice(0, 10), // Show only 10 most recent
  };
}

export default function ModelDashboard() {
  const { stats, pendingBookings, recentLikes } = useLoaderData<typeof loader>();

  const statCards = [
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      icon: "📅",
      color: "bg-blue-500",
    },
    {
      title: "Pending Requests",
      value: stats.pendingBookings,
      icon: "⏳",
      color: "bg-yellow-500",
      link: "/model/requests",
    },
    {
      title: "Total Likes",
      value: stats.totalLikes,
      icon: "❤️",
      color: "bg-pink-500",
    },
    {
      title: "Rating",
      value: `${stats.rating.toFixed(1)} ⭐`,
      subtitle: `${stats.totalReviews} reviews`,
      icon: "⭐",
      color: "bg-purple-500",
    },
    {
      title: "This Month",
      value: `$${stats.monthlyEarnings.toFixed(2)}`,
      subtitle: "Earnings",
      icon: "💰",
      color: "bg-green-500",
      link: "/model/earnings",
    },
    {
      title: "Recent Sessions",
      value: stats.recentSessions,
      subtitle: "Last 7 days",
      icon: "📊",
      color: "bg-indigo-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold">Welcome Back!</h1>
        <p className="mt-2 text-pink-100">
          Here's what's happening with your account today
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="mt-1 text-sm text-gray-500">{stat.subtitle}</p>
                )}
                {stat.link && (
                  <Link
                    to={stat.link}
                    className="mt-2 inline-block text-sm font-medium text-pink-600 hover:text-pink-500"
                  >
                    View details →
                  </Link>
                )}
              </div>
              <div className={`${stat.color} rounded-full p-4 text-white text-3xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Bookings */}
      {pendingBookings && pendingBookings.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pending Booking Requests</h2>
            <Link
              to="/model/requests"
              className="text-sm font-medium text-pink-600 hover:text-pink-500"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {pendingBookings.map((booking: any) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <div className="flex items-center space-x-4">
                  {booking.customer?.profile ? (
                    <img
                      src={booking.customer.profile}
                      alt={booking.customer.firstName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium">
                      {booking.customer?.firstName?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {booking.customer?.firstName} {booking.customer?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.modelService?.service?.name} - {booking.dayAmount} day(s)
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(booking.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">${booking.price.toFixed(2)}</p>
                  <Link
                    to={`/model/requests?id=${booking.id}`}
                    className="mt-1 inline-block text-sm font-medium text-pink-600 hover:text-pink-500"
                  >
                    Respond →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customers Who Liked You */}
      {recentLikes && recentLikes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Customers Who Liked You
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recentLikes.map((like: any) => (
              <div
                key={like.id}
                className="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors"
              >
                {like.customer?.profile ? (
                  <img
                    src={like.customer.profile}
                    alt={like.customer.firstName}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-pink-300 flex items-center justify-center text-white font-bold text-xl">
                    {like.customer?.firstName?.charAt(0) || "?"}
                  </div>
                )}
                <p className="mt-2 text-sm font-medium text-gray-900 text-center">
                  {like.customer?.firstName}
                </p>
                <p className="text-xs text-gray-500">{like.customer?.gender}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!pendingBookings || pendingBookings.length === 0) && (!recentLikes || recentLikes.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            You're all caught up!
          </h3>
          <p className="text-gray-600">
            No pending bookings or new likes at the moment.
          </p>
          <Link
            to="/model/profile"
            className="mt-4 inline-block px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-medium rounded-lg hover:from-pink-600 hover:to-purple-700"
          >
            Update Your Profile
          </Link>
        </div>
      )}
    </div>
  );
}
