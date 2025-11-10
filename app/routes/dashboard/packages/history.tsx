import React from "react";
import { Clock, Filter, Calendar, X } from "lucide-react";
import { useNavigate, useSearchParams, type LoaderFunction } from "react-router";

// Services and Utils
import { formatCurrency } from "~/utils";
import { capitalize } from "~/utils/functions/textFormat";
import { getSubscriptionHistory } from "~/services/package.server";
import { requireUserSession } from "~/services";

// Components
import { Button } from "~/components/ui/button";
import Pagination from "~/components/ui/pagination";

interface SubscriptionHistory {
   id: string;
   subscriptionId: string;
   customerId: string;
   planName: string;
   planPrice: number;
   durationDays: number;
   startDate: Date;
   endDate: Date;
   paymentMethod: string;
   transactionId: string | null;
   status: string;
   createdAt: Date;
}

interface LoaderReturn {
   history: SubscriptionHistory[];
   pagination: {
      page: number;
      take: number;
      total: number;
      totalPages: number;
   };
   filters: {
      status: string;
      startDate: string;
      endDate: string;
   };
}

interface HistoryProps {
   loaderData: LoaderReturn;
}

export const loader: LoaderFunction = async ({ request }) => {
   const customerId = await requireUserSession(request);
   const url = new URL(request.url);
   const page = Number(url.searchParams.get("page") || 1);
   const take = 10;
   const status = url.searchParams.get("status") || "all";
   const startDate = url.searchParams.get("startDate") || "";
   const endDate = url.searchParams.get("endDate") || "";

   const { history, pagination } = await getSubscriptionHistory(
      customerId,
      page,
      take,
      status,
      startDate,
      endDate
   );

   return {
      history,
      pagination,
      filters: { status, startDate, endDate },
   };
};

export default function SubscriptionHistoryPage({ loaderData }: HistoryProps) {
   const navigate = useNavigate();
   const [searchParams, setSearchParams] = useSearchParams();
   const { history, pagination, filters } = loaderData;

   // Map pagination data to component props
   const paginationProps = {
      currentPage: pagination.page,
      totalPages: pagination.totalPages,
      totalCount: pagination.total,
      limit: pagination.take,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPreviousPage: pagination.page > 1,
      baseUrl: "/dashboard/subscription-history",
      searchParams: searchParams,
   };

   const [showFilters, setShowFilters] = React.useState(false);
   const [localStatus, setLocalStatus] = React.useState(filters.status);
   const [localStartDate, setLocalStartDate] = React.useState(filters.startDate);
   const [localEndDate, setLocalEndDate] = React.useState(filters.endDate);

   const statusOptions = [
      { value: "all", label: "All Status" },
      { value: "active", label: "Active" },
      { value: "upgraded", label: "Upgraded" },
      { value: "canceled", label: "Canceled" },
      { value: "expired", label: "Expired" },
      { value: "pending", label: "Pending" },
   ];

   const applyFilters = () => {
      const params = new URLSearchParams();
      if (localStatus !== "all") params.set("status", localStatus);
      if (localStartDate) params.set("startDate", localStartDate);
      if (localEndDate) params.set("endDate", localEndDate);
      params.set("page", "1"); // Reset to first page when filtering
      setSearchParams(params);
      setShowFilters(false);
   };

   const clearFilters = () => {
      setLocalStatus("all");
      setLocalStartDate("");
      setLocalEndDate("");
      setSearchParams(new URLSearchParams());
      setShowFilters(false);
   };

   const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
         case "active":
            return "bg-green-100 text-green-700 border-green-200";
         case "upgraded":
            return "bg-blue-100 text-blue-700 border-blue-200";
         case "canceled":
            return "bg-red-100 text-red-700 border-red-200";
         case "expired":
            return "bg-gray-100 text-gray-700 border-gray-200";
         case "pending":
            return "bg-yellow-100 text-yellow-700 border-yellow-200";
         default:
            return "bg-gray-100 text-gray-700 border-gray-200";
      }
   };

   const formatDate = (date: Date) => {
      return new Date(date).toLocaleDateString("en-US", {
         year: "numeric",
         month: "short",
         day: "numeric",
      });
   };

   return (
      <div className="min-h-screen p-2 sm:p-6 mt-8">
         <div className="mx-auto space-y-4">
            <div className="flex items-center justify-between">
               <div>
                  <h1 className="text-lg text-gray-900">Subscription History:</h1>
                  <p className="text-sm text-gray-600 mt-1">
                     Track all your subscription activities
                  </p>
               </div>
               <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="cursor-pointer flex items-center gap-2"
               >
                  <Filter className="h-4 w-4" />
                  Filters
               </Button>
            </div>

            {showFilters && (
               <div className="bg-white py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Status</label>
                        <select
                           value={localStatus}
                           onChange={(e) => setLocalStatus(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        >
                           {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                 {option.label}
                              </option>
                           ))}
                        </select>
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <input
                           type="date"
                           value={localStartDate}
                           onChange={(e) => setLocalStartDate(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <input
                           type="date"
                           value={localEndDate}
                           onChange={(e) => setLocalEndDate(e.target.value)}
                           className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                        />
                     </div>

                     <div className="flex items-center gap-2 justify-end mt-4">
                        <Button onClick={clearFilters} variant="outline">
                           Clear Filters
                        </Button>
                        <Button onClick={applyFilters} className="bg-rose-500 hover:bg-rose-600">
                           Apply Filters
                        </Button>
                     </div>
                  </div>
               </div>
            )}

            {(filters.status !== "all" || filters.startDate || filters.endDate) && (
               <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-gray-600">Active filters:</span>
                  {filters.status !== "all" && (
                     <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">
                        Status: {capitalize(filters.status)}
                     </span>
                  )}
                  {filters.startDate && (
                     <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">
                        From: {formatDate(new Date(filters.startDate))}
                     </span>
                  )}
                  {filters.endDate && (
                     <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm">
                        To: {formatDate(new Date(filters.endDate))}
                     </span>
                  )}
               </div>
            )}

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
               {history.length === 0 ? (
                  <div className="p-12 text-center">
                     <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                     <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No subscription history
                     </h3>
                     <p className="text-gray-600 mb-4">
                        You don't have any subscription history yet.
                     </p>
                     <Button
                        onClick={() => navigate("/dashboard/packages")}
                        className="bg-rose-500 hover:bg-rose-600"
                     >
                        Browse Packages
                     </Button>
                  </div>
               ) : (
                  <div className="overflow-x-auto">
                     <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                           <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                 Plan
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                 Price
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                 Duration
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                 Period
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                 Payment
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                 Status
                              </th>
                           </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {history.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                       {item.planName}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                       {formatCurrency(item.planPrice)}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 flex items-center gap-1">
                                       <Clock className="h-4 w-4 text-gray-400" />
                                       {item.durationDays} days
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-600">
                                       <div>{formatDate(item.startDate)}</div>
                                       <div className="text-xs text-gray-500">
                                          to {formatDate(item.endDate)}
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                       {capitalize(item.paymentMethod)}
                                    </div>
                                 </td>
                                 <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                       className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(
                                          item.status
                                       )}`}
                                    >
                                       {capitalize(item.status)}
                                    </span>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
               <div className="flex justify-center mt-6">
                  <Pagination {...paginationProps} />
               </div>
            )}
         </div>
      </div>
   );
}