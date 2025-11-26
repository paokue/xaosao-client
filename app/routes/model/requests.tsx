import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, Form, useNavigation } from "react-router";
import { requireModelSession } from "~/services/model-auth.server";
import { getModelBookingRequests, updateBookingStatus } from "~/services/model.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Booking Requests - XaoSao Model" },
    { name: "description", content: "Manage your booking requests" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const modelId = await requireModelSession(request);
  const bookings = await getModelBookingRequests(modelId);

  // Separate by status
  const pending = bookings.filter(b => b.status === "pending");
  const confirmed = bookings.filter(b => b.status === "confirmed");
  const completed = bookings.filter(b => b.status === "completed");
  const cancelled = bookings.filter(b => b.status === "cancelled" || b.status === "rejected");

  return { pending, confirmed, completed, cancelled };
}

export async function action({ request }: ActionFunctionArgs) {
  const modelId = await requireModelSession(request);
  const formData = await request.formData();

  const bookingId = formData.get("bookingId");
  const action = formData.get("action");

  if (!bookingId || !action) {
    return { error: "Missing required fields" };
  }

  const status = action === "accept" ? "confirmed" : "rejected";

  try {
    await updateBookingStatus(String(bookingId), status, modelId);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export default function ModelRequests() {
  const { pending, confirmed, completed, cancelled } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const tabs = [
    { name: "Pending", count: pending.length, bookings: pending },
    { name: "Confirmed", count: confirmed.length, bookings: confirmed },
    { name: "Completed", count: completed.length, bookings: completed },
    { name: "Cancelled", count: cancelled.length, bookings: cancelled },
  ];

  const [activeTab, setActiveTab] = React.useState(0);
  const activeBookings = tabs[activeTab].bookings;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking Requests</h1>
        <p className="mt-2 text-gray-600">Manage customer booking requests</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, idx) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(idx)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === idx
                  ? "border-pink-500 text-pink-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.name}
              {tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                  activeTab === idx
                    ? "bg-pink-100 text-pink-600"
                    : "bg-gray-100 text-gray-900"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {activeBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No {tabs[activeTab].name.toLowerCase()} bookings
            </h3>
            <p className="text-gray-600">
              {activeTab === 0 ? "You're all caught up!" : "No bookings in this category yet."}
            </p>
          </div>
        ) : (
          activeBookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                {/* Customer Info */}
                <div className="flex items-start space-x-4 flex-1">
                  {booking.customer.profile ? (
                    <img
                      src={booking.customer.profile}
                      alt={booking.customer.firstName}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold text-xl">
                      {booking.customer.firstName.charAt(0)}
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-gray-900">
                        {booking.customer.firstName} {booking.customer.lastName}
                      </h3>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {booking.customer.gender}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      Customer #{booking.customer.number}
                    </p>

                    {booking.customer.bio && (
                      <p className="mt-2 text-sm text-gray-700">{booking.customer.bio}</p>
                    )}

                    <div className="mt-3 space-y-1">
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 w-24">Service:</span>
                        <span className="text-gray-900">{booking.modelService.service.name}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 w-24">Duration:</span>
                        <span className="text-gray-900">{booking.dayAmount} day(s)</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 w-24">Start Date:</span>
                        <span className="text-gray-900">
                          {new Date(booking.startDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-gray-700 w-24">Location:</span>
                        <span className="text-gray-900">{booking.location}</span>
                      </div>
                      {booking.preferredAttire && (
                        <div className="flex items-center text-sm">
                          <span className="font-medium text-gray-700 w-24">Attire:</span>
                          <span className="text-gray-900">{booking.preferredAttire}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="ml-4 text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ${booking.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </p>

                  {booking.status === "pending" && (
                    <div className="mt-4 space-y-2">
                      <Form method="post" className="inline">
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="action" value="accept" />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                        >
                          Accept
                        </button>
                      </Form>
                      <Form method="post" className="inline">
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <input type="hidden" name="action" value="reject" />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                        >
                          Decline
                        </button>
                      </Form>
                    </div>
                  )}

                  {booking.status === "confirmed" && (
                    <span className="inline-block mt-4 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Confirmed
                    </span>
                  )}

                  {booking.status === "completed" && (
                    <span className="inline-block mt-4 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Completed
                    </span>
                  )}

                  {(booking.status === "cancelled" || booking.status === "rejected") && (
                    <span className="inline-block mt-4 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {booking.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Need to import React for useState
import * as React from "react";
