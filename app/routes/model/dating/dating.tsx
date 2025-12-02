import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useNavigation, Outlet, type LoaderFunction } from "react-router"
import { Calendar, MapPin, DollarSign, Clock, Shirt, MoreVertical, UserRoundCheck, Headset, Loader, Search, Trash2, MessageSquareText, Eye, Check, X, Info, Shield, Wallet, ChevronDown, ChevronUp } from "lucide-react"

// components:
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"

// interface and service
import { requireModelSession } from "~/services/model-auth.server"
import { capitalize } from "~/utils/functions/textFormat"
import { getAllModelBookings } from "~/services/booking.server"
import { calculateAgeFromDOB, formatCurrency, formatDate } from "~/utils"

const statusConfig: Record<string, { label: string; className: string }> = {
   confirmed: {
      label: "Confirmed",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
   },
   pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
   },
   in_progress: {
      label: "In Progress",
      className: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
   },
   awaiting_confirmation: {
      label: "Awaiting Confirmation",
      className: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20",
   },
   completed: {
      label: "Completed",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
   },
   cancelled: {
      label: "Cancelled",
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
   },
   rejected: {
      label: "Rejected",
      className: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
   },
   disputed: {
      label: "Disputed",
      className: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
   },
}

interface BookingData {
   id: string;
   price: number;
   location: string;
   preferredAttire: string;
   startDate: string;
   endDate: string;
   status: string;
   dayAmount: number;
   createdAt: string;
   isContact: boolean;
   customer: {
      id: string;
      firstName: string;
      lastName: string;
      profile: string;
      dob: string;
      whatsapp: number;
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

interface LoaderReturn {
   bookings: BookingData[];
}

interface DatingPageProps {
   loaderData: LoaderReturn;
}

export const loader: LoaderFunction = async ({ request }) => {
   const modelId = await requireModelSession(request)
   const bookings = await getAllModelBookings(modelId)

   return { bookings };
}

export default function ModelDatingPage({ loaderData }: DatingPageProps) {
   const { t } = useTranslation()
   const navigate = useNavigate()
   const navigation = useNavigation()
   const { bookings } = loaderData
   const isLoading = navigation.state === "loading";
   const [isPolicyOpen, setIsPolicyOpen] = useState(false);

   if (isLoading) {
      return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
               <Loader className="w-4 h-4 text-rose-500 animate-spin" />
               <p className="text-rose-600">Loading...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="container space-y-2 pt-2 sm:pt-8 px-4 sm:px-10">
         <div className="flex items-start justify-between bg-rose-100 sm:bg-white w-full p-3 sm:px-0 rounded-md">
            <div className="space-y-1">
               <h1 className="text-sm sm:text-md sm:font-bold text-rose-600 sm:text-gray-800 uppercase text-shadow-md">
                  My Dating Requests
               </h1>
               <p className="text-sm sm:text-md font-normal text-rose-600 sm:text-gray-600">
                  Manage your dating and service booking requests from customers
               </p>
            </div>
         </div>

         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <button
               type="button"
               onClick={() => setIsPolicyOpen(!isPolicyOpen)}
               className="flex items-center justify-between w-full sm:cursor-default"
            >
               <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-blue-600 shrink-0" />
                  <h3 className="text-sm font-semibold text-blue-900">Secure Payment Policy</h3>
               </div>
               <div className="sm:hidden">
                  {isPolicyOpen ? (
                     <ChevronUp className="h-4 w-4 text-blue-600" />
                  ) : (
                     <ChevronDown className="h-4 w-4 text-blue-600" />
                  )}
               </div>
            </button>
            <div className={`mt-3 pl-8 ${isPolicyOpen ? 'block' : 'hidden'} sm:block`}>
               <ul className="text-xs text-blue-800 space-y-1">
                  <li className="flex items-center gap-2">
                     <Wallet className="h-3 w-3" />
                     <span>Payment is held securely when customer books your service</span>
                  </li>
                  <li className="flex items-center gap-2">
                     <MapPin className="h-3 w-3" />
                     <span>Both parties must GPS check-in at the location to verify attendance</span>
                  </li>
                  <li className="flex items-center gap-2">
                     <Check className="h-3 w-3" />
                     <span>After completing, customer has 48 hours to confirm (auto-releases if no response)</span>
                  </li>
                  <li className="flex items-center gap-2">
                     <Info className="h-3 w-3" />
                     <span>If you reject a booking, customer will be automatically refunded</span>
                  </li>
               </ul>
            </div>
         </div>

         {bookings && bookings.length > 0 ? (
            <>
               {/* <div className="hidden lg:block">
                  <div className="border border-gray-200 rounded-sm overflow-hidden">
                     <Table>
                        <TableHeader>
                           <TableRow className="bg-gray-50/80">
                              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</TableHead>
                              <TableHead className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {bookings.map((booking) => (
                              <TableRow key={booking.id} className="hover:bg-rose-50/30">
                                 <TableCell>
                                    <div className="flex items-center gap-3">
                                       {booking.customer.profile ? (
                                          <img
                                             src={booking.customer.profile}
                                             alt={booking.customer.firstName}
                                             className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                          />
                                       ) : (
                                          <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                                             <UserRoundCheck className="w-4 h-4 text-rose-500" />
                                          </div>
                                       )}
                                       <div>
                                          <p className="text-sm font-medium text-gray-900">
                                             {booking.customer.firstName} {booking.customer.lastName}
                                          </p>
                                          <p className="text-xs text-gray-500">
                                             {calculateAgeFromDOB(String(booking.customer.dob))} years old
                                          </p>
                                       </div>
                                    </div>
                                 </TableCell>
                                 <TableCell>
                                    <p className="text-sm text-gray-900">{booking.modelService.service.name}</p>
                                    <p className="text-xs text-gray-500">{booking.dayAmount} {booking.dayAmount !== 1 ? "days" : "day"}</p>
                                 </TableCell>
                                 <TableCell>
                                    <p className="text-sm text-gray-900">{formatDate(String(booking.startDate))}</p>
                                    {booking.endDate && (
                                       <p className="text-xs text-gray-500">to {formatDate(String(booking.endDate))}</p>
                                    )}
                                 </TableCell>
                                 <TableCell>
                                    <p className="text-sm text-gray-700 max-w-[150px] truncate" title={booking.location}>
                                       {booking.location}
                                    </p>
                                 </TableCell>
                                 <TableCell>
                                    <p className="text-sm font-medium text-gray-900">{formatCurrency(booking.price)}</p>
                                 </TableCell>
                                 <TableCell>
                                    <Badge
                                       variant="outline"
                                       className={`text-xs ${statusConfig[booking.status]?.className || statusConfig.pending.className}`}
                                    >
                                       {capitalize(booking.status)}
                                    </Badge>
                                 </TableCell>
                                 <TableCell className="text-right">
                                    <DropdownMenu>
                                       <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-gray-100">
                                             <MoreVertical className="h-4 w-4 text-gray-600" />
                                             <span className="sr-only">Open menu</span>
                                          </Button>
                                       </DropdownMenuTrigger>
                                       <DropdownMenuContent align="end" className="w-40">
                                          <DropdownMenuItem
                                             onClick={() => navigate(`/model/dating/detail/${booking.id}`)}
                                             className="cursor-pointer"
                                          >
                                             View Details
                                          </DropdownMenuItem>

                                          {booking.status === "pending" && (
                                             <>
                                                <DropdownMenuItem
                                                   onClick={() => navigate(`/model/dating/accept/${booking.id}`)}
                                                   className="cursor-pointer text-emerald-600"
                                                >
                                                   <Check className="h-4 w-4 mr-2" />
                                                   Accept
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                   onClick={() => navigate(`/model/dating/reject/${booking.id}`)}
                                                   className="cursor-pointer text-red-600"
                                                >
                                                   <X className="h-4 w-4 mr-2" />
                                                   Reject
                                                </DropdownMenuItem>
                                             </>
                                          )}

                                          {booking.status === "confirmed" && (
                                             <DropdownMenuItem
                                                onClick={() => navigate(`/model/dating/checkin/${booking.id}`)}
                                                className="cursor-pointer text-purple-600"
                                             >
                                                <MapPin className="h-4 w-4 mr-2" />
                                                Check In
                                             </DropdownMenuItem>
                                          )}

                                          {booking.status === "in_progress" && (
                                             <DropdownMenuItem
                                                onClick={() => navigate(`/model/dating/complete/${booking.id}`)}
                                                className="cursor-pointer"
                                             >
                                                Complete & Get paid
                                             </DropdownMenuItem>
                                          )}

                                          {booking.isContact && (
                                             <DropdownMenuItem
                                                onClick={() => navigate(`/model/chat?id=${booking.customer.firstName}`)}
                                                className="cursor-pointer text-blue-600"
                                             >
                                                <MessageSquareText className="h-4 w-4 mr-2" />
                                                Message
                                             </DropdownMenuItem>
                                          )}

                                          {["cancelled", "rejected", "completed"].includes(booking.status) && (
                                             <DropdownMenuItem
                                                onClick={() => navigate(`/model/dating/delete/${booking.id}`)}
                                                className="cursor-pointer text-red-600"
                                             >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                             </DropdownMenuItem>
                                          )}
                                       </DropdownMenuContent>
                                    </DropdownMenu>
                                 </TableCell>
                              </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </div>
               </div> */}

               <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
                  {bookings.map((booking) => (
                     <Card
                        key={booking.id}
                        className="border border-rose-100 hover:shadow-md transition-shadow rounded-sm py-8"
                     >
                        <CardHeader>
                           <div className="flex items-start justify-between gap-4">
                              <div className="space-y-2 flex-1">
                                 <h3 className="text-md leading-tight text-balance">
                                    {booking.modelService.service.name}
                                 </h3>
                                 <Badge
                                    variant="outline"
                                    className={statusConfig[booking.status]?.className || statusConfig.pending.className}
                                 >
                                    {capitalize(booking.status)}
                                 </Badge>
                              </div>

                              <DropdownMenu>
                                 <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6">
                                       <MoreVertical className="h-4 w-4" />
                                       <span className="sr-only">Open menu</span>
                                    </Button>
                                 </DropdownMenuTrigger>

                                 <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                       onClick={() => navigate(`/model/dating/detail/${booking.id}`)}
                                       className="cursor-pointer"
                                    >
                                       View Details
                                    </DropdownMenuItem>

                                    {booking.status === "pending" && (
                                       <>
                                          <DropdownMenuItem
                                             onClick={() => navigate(`/model/dating/accept/${booking.id}`)}
                                             className="cursor-pointer text-emerald-600"
                                          >
                                             <Check className="h-4 w-4 mr-2" />
                                             Accept
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                             onClick={() => navigate(`/model/dating/reject/${booking.id}`)}
                                             className="cursor-pointer text-red-600"
                                          >
                                             <X className="h-4 w-4 mr-2" />
                                             Reject
                                          </DropdownMenuItem>
                                       </>
                                    )}

                                    {booking.status === "confirmed" && (
                                       <DropdownMenuItem
                                          onClick={() => navigate(`/model/dating/checkin/${booking.id}`)}
                                          className="cursor-pointer"
                                       >
                                          Check In
                                       </DropdownMenuItem>
                                    )}

                                    {booking.status === "in_progress" && (
                                       <DropdownMenuItem
                                          onClick={() => navigate(`/model/dating/complete/${booking.id}`)}
                                          className="cursor-pointer text-blue-600"
                                       >
                                          <Check className="h-4 w-4 mr-2" />
                                          Complete & Get Paid
                                       </DropdownMenuItem>
                                    )}

                                    {booking.isContact && (
                                       <DropdownMenuItem
                                          onClick={() => navigate(`/model/chat?id=${booking.customer.firstName}`)}
                                          className="cursor-pointer"
                                       >
                                          Message Customer
                                       </DropdownMenuItem>
                                    )}

                                    {["cancelled", "rejected", "completed"].includes(booking.status) && (
                                       <DropdownMenuItem
                                          className="text-destructive cursor-pointer"
                                          onClick={() => navigate(`/model/dating/delete/${booking.id}`)}
                                       >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                       </DropdownMenuItem>
                                    )}
                                 </DropdownMenuContent>
                              </DropdownMenu>
                           </div>
                        </CardHeader>

                        <CardContent className="space-y-2">
                           <div className="flex items-start gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground">
                                 {formatDate(String(booking.startDate))}
                                 {booking.endDate && (
                                    <>
                                       <span className="text-rose-600"> to </span>
                                       {formatDate(String(booking.endDate))}
                                    </>
                                 )}
                              </p>
                           </div>

                           <div className="flex items-start gap-3">
                              <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div className="flex gap-2">
                                 <p className="text-sm font-medium text-muted-foreground">
                                    Duration:
                                 </p>
                                 <p className="text-sm text-muted-foreground">
                                    {booking.dayAmount} {booking.dayAmount !== 1 ? "days" : "day"}
                                 </p>
                              </div>
                           </div>

                           <div className="flex items-start gap-3">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground text-pretty">
                                 {booking.location}
                              </p>
                           </div>

                           {booking.preferredAttire && (
                              <div className="flex items-start gap-3">
                                 <Shirt className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                 <p className="text-sm text-muted-foreground">
                                    {booking.preferredAttire}
                                 </p>
                              </div>
                           )}

                           <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium text-muted-foreground">
                                 Price:
                              </span>
                              <span className="text-sm text-muted-foreground">
                                 {formatCurrency(booking.price)}
                              </span>
                           </div>

                           <div className="flex items-center gap-2">
                              <UserRoundCheck className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                 {booking.customer.firstName + " " + booking.customer.lastName} (
                                 {calculateAgeFromDOB(String(booking.customer.dob))} years)
                              </span>
                           </div>
                        </CardContent>
                     </Card>
                  ))}
               </div>
            </>
         ) : (
            <div className="w-full p-8 text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
               </div>
               <h4 className="text-gray-900 font-medium mb-2">No Dating Requests Yet</h4>
               <p className="text-gray-600 text-sm">
                  You don't have any dating or service booking requests yet. They will appear here when customers book your services.
               </p>
            </div>
         )}

         <button
            onClick={() => window.open("https://wa.me/8562078856194", "_blank")}
            className="flex gap-2 cursor-pointer fixed bottom-16 right-4 sm:bottom-6 sm:right-4 z-50 p-3 rounded-lg bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition"
         >
            <Headset size={18} className="animate-bounce" />
            <span className="hidden sm:block">Support</span>
         </button>

         <Outlet />
      </div>
   )
}
