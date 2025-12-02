import { Clock, Check, X, User } from "lucide-react"
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router"

// components
import Modal from "~/components/ui/model"
import { Button } from "~/components/ui/button"

// utils and service
import { requireModelSession } from "~/services/model-auth.server"
import { getModelBookingDetail } from "~/services/booking.server"
import { calculateAgeFromDOB, formatCurrency, formatDate } from "~/utils"
import { capitalize } from "~/utils/functions/textFormat"

interface BookingDetail {
   id: string;
   price: number;
   location: string;
   preferredAttire: string;
   startDate: string;
   endDate: string;
   status: string;
   dayAmount: number;
   createdAt: string;
   customer: {
      id: string;
      firstName: string;
      lastName: string;
      profile: string;
      dob: string;
      whatsapp: number;
      gender: string;
   };
   modelService: {
      id: string;
      customRate: number;
      service: {
         id: string;
         name: string;
         description: string;
         baseRate: number;
      };
   };
}

export async function loader({ params, request }: LoaderFunctionArgs) {
   const modelId = await requireModelSession(request);
   const data = await getModelBookingDetail(params.id!, modelId);
   return data;
}

export default function DatingDetailModal() {
   const navigate = useNavigate();
   const data = useLoaderData<BookingDetail>();

   function closeHandler() {
      navigate("/model/dating");
   }

   return (
      <Modal onClose={closeHandler} className="h-screen sm:h-auto w-full p-2 sm:w-3/6 border rounded-sm">
         <div className="space-y-4 mt-10 sm:mt-0 p-2">
            <div className="mt-4 sm:mt-0 px-2">
               <h3 className="flex items-center text-black text-md font-bold">Booking Details</h3>
            </div>
            <div className="space-y-2 px-2">
               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Booking ID:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{data?.id}</p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Service:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{data?.modelService.service.name}</p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Date:</label>
                        <p className="mt-0 sm:mt-1 text-sm">
                           {formatDate(String(data?.startDate))} {data?.endDate ? "-" : ""} {data?.endDate && formatDate(String(data?.endDate))}
                        </p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Duration:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{data?.dayAmount} days</p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Price:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{formatCurrency(data?.price)}</p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Location:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{data?.location}</p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Preferred Attire:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{data?.preferredAttire || "Not specified"}</p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Status:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{capitalize(data?.status || "")}</p>
                     </div>
                  </div>
                  <hr />
                  <div className="space-y-4">
                     {data?.status === "confirmed" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-green-50 border border-green-300">
                              <Check className="h-4 w-4 text-green-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Booking Confirmed</p>
                              <p className="text-xs text-gray-500">
                                 You have accepted this booking request. Please prepare for the date.
                              </p>
                           </div>
                        </div>
                     )}

                     {data?.status === "completed" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-blue-50 border border-blue-300">
                              <Check className="h-4 w-4 text-blue-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Booking Completed</p>
                              <p className="text-xs text-gray-500">
                                 This booking has been completed successfully.
                              </p>
                           </div>
                        </div>
                     )}

                     {data?.status === "rejected" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-gray-50 border border-gray-300">
                              <X className="h-4 w-4 text-gray-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Booking Rejected</p>
                              <p className="text-xs text-gray-500">
                                 You have rejected this booking request.
                              </p>
                           </div>
                        </div>
                     )}

                     {data?.status === "pending" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-300">
                              <Clock className="h-4 w-4 text-yellow-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Pending Approval</p>
                              <p className="text-sm text-gray-500">
                                 This booking is waiting for your approval. Please accept or reject.
                              </p>
                           </div>
                        </div>
                     )}

                     {data?.status === "cancelled" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-red-50 border border-red-300">
                              <X className="h-4 w-4 text-red-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Booking Cancelled</p>
                              <p className="text-xs text-gray-500">
                                 This booking has been cancelled by the customer.
                              </p>
                           </div>
                        </div>
                     )}
                  </div>
                  <hr />
                  <div className="flex items-start justiy-start gap-4">
                     <div className="relative flex-shrink-0">
                        {data?.customer.profile ? (
                           <img
                              src={data?.customer.profile}
                              alt={`${data.customer.firstName}-${data.customer.lastName}`}
                              className="w-22 h-22 rounded-full object-cover border-2 border-rose-500"
                           />
                        ) : (
                           <div className="w-22 h-22 rounded-full bg-gray-200 flex items-center justify-center border-2 border-rose-500">
                              <User className="w-10 h-10 text-gray-400" />
                           </div>
                        )}
                     </div>
                     <div className="flex items-start justify-center flex-col text-sm">
                        <h2 className="text-md">Name: {`${data?.customer.firstName} ${data?.customer.lastName}`}</h2>
                        <p>Age: {calculateAgeFromDOB(String(data?.customer.dob))} years old</p>
                        <p>Gender: {capitalize(data?.customer.gender || "Not specified")}</p>
                        <Button
                           variant="outline"
                           onClick={() => navigate(`/model/customer-profile/${data?.customer.id}`)}
                           className="text-xs mt-4 bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
                        >
                           <User size={18} className="text-white" />
                           View Profile
                        </Button>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
               <Button variant="outline" onClick={closeHandler} className="bg-rose-500 text-white hover:bg-rose-600 hover:text-white">
                  Close
               </Button>
               {data?.status === "pending" && (
                  <>
                     <Button
                        variant="outline"
                        onClick={() => navigate(`/model/dating/reject/${data?.id}`)}
                        className="border border-gray-500 bg-white text-gray-500 hover:bg-gray-500 hover:text-white"
                     >
                        Reject
                     </Button>
                     <Button
                        variant="outline"
                        onClick={() => navigate(`/model/dating/accept/${data?.id}`)}
                        className="border border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                     >
                        Accept
                     </Button>
                  </>
               )}
            </div>
         </div>
      </Modal>
   )
}
