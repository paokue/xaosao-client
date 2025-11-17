import { useNavigate, useNavigation, type LoaderFunction } from "react-router"
import { Calendar, MapPin, DollarSign, Clock, Shirt, MoreVertical, UserRoundCheck, Headset, Loader, Search } from "lucide-react"
import { useTranslation } from "react-i18next"

// components:
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader } from "~/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu"

// interface and service
import { requireUserSession } from "~/services/auths.server";
import { capitalize } from "~/utils/functions/textFormat"
import type { IServiceBooking } from "~/interfaces/service"
import { getAllMyServiceBookings } from "~/services/booking.server"
import { calculateAgeFromDOB, formatCurrency, formatDate } from "~/utils"

const statusConfig = {
   completed: {
      label: "Confirmed",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
   },
   pending: {
      label: "Pending",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
   },
   confirmed: {
      label: "Completed",
      className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
   },
   cancelled: {
      label: "Cancelled",
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
   },
   rejected: {
      label: "Rejected",
      className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
   },
}

interface LoaderReturn {
   bookInfos: IServiceBooking[];
}

interface DiscoverPageProps {
   loaderData: LoaderReturn;
}

export const loader: LoaderFunction = async ({ request }) => {
   const customerId = await requireUserSession(request)
   const bookInfos = await getAllMyServiceBookings(customerId)

   return { bookInfos };
}

export default function BookingsList({ loaderData }: DiscoverPageProps) {
   const { t } = useTranslation()
   const navigate = useNavigate()
   const navigation = useNavigation()
   const { bookInfos } = loaderData
   const isLoading = navigation.state === "loading";

   if (isLoading) {
      return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2">
               <Loader className="w-4 h-4 text-rose-500 animate-spin" />
               <p className="text-rose-600">{t('booking.loading')}</p>
            </div>
         </div>
      );
   }

   return (
      <div className="container space-y-2 pt-2 sm:pt-8 px-4 sm:px-10">
         <div className="flex items-start justify-between bg-rose-100 sm:bg-white w-full p-3 sm:px-0 rounded-md">
            <div className="space-y-1">
               <h1 className="text-sm sm:text-md sm:font-bold text-gray-800 uppercase text-shadow-md">{t('booking.title')}</h1>
               <p className="text-sm font-normal text-gray-600">
                  {t('booking.subtitle')}
               </p>
            </div>
         </div>

         {bookInfos && bookInfos.length > 0 ? (
            <div className="w-full grid gap-3 md:grid-cols-3 lg:grid-cols-4">
               {bookInfos.map((booking) => (
                  <Card
                     key={booking.id}
                     className="border border-rose-100 hover:shadow-md transition-shadow rounded-sm"
                  >
                     <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                           <div className="space-y-2 flex-1">
                              <h3 className="text-md leading-tight text-balance">
                                 {booking.modelService.service.name}
                              </h3>
                              <Badge
                                 variant="outline"
                                 className={statusConfig[booking.status].className}
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
                                    onClick={() =>
                                       navigate(`/dashboard/book-service/detail/${booking.id}`)
                                    }
                                    className="cursor-pointer"
                                 >
                                    {t('booking.viewDetails')}
                                 </DropdownMenuItem>

                                 {booking.isContact && (
                                    <DropdownMenuItem
                                       onClick={() =>
                                          navigate(`/dashboard/chat?id=${booking.model.firstName}`)
                                       }
                                       className="cursor-pointer"
                                    >
                                       {t('booking.startChatting')}
                                    </DropdownMenuItem>
                                 )}

                                 <DropdownMenuItem
                                    onClick={() =>
                                       navigate(`/dashboard/book-service/edit/${booking.id}`)
                                    }
                                    className="cursor-pointer"
                                 >
                                    {t('booking.editBooking')}
                                 </DropdownMenuItem>

                                 {booking.status === "pending" && (
                                    <DropdownMenuItem
                                       className="text-destructive cursor-pointer"
                                       onClick={() =>
                                          navigate(`/dashboard/book-service/cancel/${booking.id}`)
                                       }
                                    >
                                       {t('booking.cancelBooking')}
                                    </DropdownMenuItem>
                                 )}

                                 {["cancelled", "rejected", "completed"].includes(
                                    booking.status
                                 ) && (
                                       <DropdownMenuItem
                                          className="text-destructive cursor-pointer"
                                          onClick={() =>
                                             navigate(`/dashboard/book-service/delete/${booking.id}`)
                                          }
                                       >
                                          {t('booking.deleteBooking')}
                                       </DropdownMenuItem>
                                    )}
                              </DropdownMenuContent>
                           </DropdownMenu>
                        </div>
                     </CardHeader>

                     <CardContent className="space-y-2 -mt-3">
                        <div className="flex items-start gap-3">
                           <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                           <p className="text-sm text-muted-foreground">
                              {formatDate(String(booking.startDate))}
                              {booking.endDate && (
                                 <>
                                    <span className="text-rose-600"> {t('booking.to')} </span>
                                    {formatDate(String(booking.endDate))}
                                 </>
                              )}
                           </p>
                        </div>

                        <div className="flex items-start gap-3">
                           <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                           <div className="flex gap-2">
                              <p className="text-sm font-medium text-muted-foreground">
                                 {t('booking.duration')}:
                              </p>
                              <p className="text-sm text-muted-foreground">
                                 {booking.dayAmount} {booking.dayAmount !== 1 ? t('booking.days') : t('booking.day')}
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
                              {t('booking.price')}:
                           </span>
                           <span className="text-sm text-muted-foreground">
                              {formatCurrency(booking.price)}
                           </span>
                        </div>

                        <div className="flex items-center gap-2">
                           <UserRoundCheck className="h-4 w-4 text-muted-foreground" />
                           <span className="text-sm text-muted-foreground">
                              {booking.model.firstName + " " + booking.model.lastName} (
                              {calculateAgeFromDOB(String(booking.model.dob))} {t('booking.years')})
                           </span>
                        </div>
                     </CardContent>
                  </Card>
               ))}
            </div>
         ) : (
            <div className="w-full p-8 text-center">
               <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
               </div>
               <h4 className="text-gray-900 font-medium mb-2">{t('booking.emptyTitle')}</h4>
               <p className="text-gray-600 text-sm">
                  {t('booking.emptyMessage')}
               </p>
            </div>
         )}

         <button
            onClick={() => window.open("https://wa.me/8562078856194", "_blank")}
            className="flex gap-2 cursor-pointer fixed bottom-16 right-4 sm:bottom-6 sm:right-4 z-50 p-3 rounded-lg bg-rose-500 text-white shadow-lg hover:bg-rose-600 transition"
         >
            <Headset size={18} className="animate-bounce" />
            <span className="hidden sm:block">{t('booking.support')}</span>
         </button>
      </div>
   )
}
