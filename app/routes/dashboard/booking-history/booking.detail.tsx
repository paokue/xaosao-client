import { Clock, Check, X, BadgeCheck, User } from "lucide-react"
import { useLoaderData, useNavigate, type LoaderFunctionArgs } from "react-router"

// components
import Modal from "~/components/ui/model"
import { Button } from "~/components/ui/button"

// utils and service
import type { IServiceBooking } from "~/interfaces/service"
import { getMyServiceBookingDetail } from "~/services/booking.server"
import { calculateAgeFromDOB, formatCurrency, formatDate } from "~/utils"

export async function loader({ params }: LoaderFunctionArgs) {
   const data = await getMyServiceBookingDetail(params.id!);
   return data;
}

export default function BookingServiceDetails() {
   const navigate = useNavigate();
   const data = useLoaderData<IServiceBooking>();

   function closeHandler() {
      navigate("/dashboard/dates-history");
   }

   return (
      <Modal onClose={closeHandler} className="h-screen sm:h-auto w-full py-8 sm:py-4 px-4 sm:w-3/6 p-4 border rounded-xl">
         <div className="space-y-4">
            <div className="mt-4 sm:mt-0 px-2">
               <h3 className="flex items-center text-black text-md font-bold">Date booking service:</h3>
            </div>
            <div className="space-y-2 px-2">
               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <p className="mt-0 sm:mt-1 text-sm">{formatDate(String(data?.startDate))} {data?.startDate ? "-" : ""} {data?.startDate && formatDate(String(data?.endDate))}</p>
                     </div>
                     <div className="flex flow-row sm:flex-col items-start justify-start space-x-3 sm:space-x-0">
                        <label className="text-sm font-medium text-gray-500">Day amount:</label>
                        <p className="mt-0 sm:mt-1 text-sm">{data?.dayAmount} Days</p>
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
                        <p className="mt-0 sm:mt-1 text-sm">{data?.preferredAttire}</p>
                     </div>
                  </div>
                  <hr />
                  <div className="space-y-4">
                     {data?.status === "completed" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-green-50 border border-green-300">
                              <Check className="h-4 w-4 text-green-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Booking Approved</p>
                              <p className="text-xs text-gray-500">
                                 Your dates is completed, Please give us any feedbacks. Thank you.
                              </p>
                           </div>
                        </div>
                     )}

                     {data?.status === "confirmed" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-blue-50 border border-blue-300">
                              <Check className="h-4 w-4 text-blue-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Approved</p>
                              <p className="text-xs text-gray-500">
                                 Your booking is confirmed already, Make sure to meet your partner on time.
                              </p>
                           </div>
                        </div>
                     )}

                     {data?.status === "rejected" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-red-50">
                              <X className="h-4 w-4 text-red-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Rejected</p>
                              <p className="text-xs text-gray-500">
                                 Your booking service is rejected by {data.model.firstName} {data.model.lastName}
                              </p>
                           </div>
                        </div>
                     )}

                     {data?.status === "pending" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-yellow-50">
                              <Clock className="h-4 w-4 text-yellow-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Awaiting Review</p>
                              <p className="text-sm text-gray-500">Your booking is pending your date partner to confirm!</p>
                           </div>
                        </div>
                     )}

                     {data?.status === "cancelled" && (
                        <div className="flex items-start space-x-3">
                           <div className="p-2 rounded-lg bg-red-50">
                              <Clock className="h-4 w-4 text-red-600" />
                           </div>
                           <div>
                              <p className="font-medium text-sm">Cancelled</p>
                              <p className="text-xs text-gray-500">You have cancelled your booking</p>
                           </div>
                        </div>
                     )}
                  </div>
                  <hr />
                  <div className="flex items-start justiy-start gap-4">
                     <div className="relative flex-shrink-0">
                        <img
                           src={data?.model.profile || ""}
                           alt={`${data.model.firstName}-${data.model.lastName}`}
                           className="w-22 h-22 rounded-full object-cover border-2 border-rose-500"
                        />
                        <BadgeCheck className="w-6 h-6 text-rose-500 absolute bottom-0 right-0 bg-white rounded-full p-[2px]" />
                     </div>
                     <div className="flex items-start justify-center flex-col text-sm">
                        <p>ID: {data.model.id}</p>
                        <h2 className="text-md">Name: {`${data.model.firstName} ${data.model.lastName}`}</h2>
                        <p>Age: {calculateAgeFromDOB(String(data.model.dob))} years old.</p>
                        <Button variant="outline" onClick={closeHandler} className="mt-4 bg-rose-500 text-white hover:bg-rose-600 hover:text-white">
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
            </div>
         </div >
      </Modal >
   )
}