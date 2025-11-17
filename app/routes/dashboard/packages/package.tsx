import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import { Check, ArrowLeft, History } from "lucide-react"
import { Link, useNavigate, type LoaderFunction } from "react-router"
import { useTranslation } from "react-i18next";

// components:
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"

import { requireUserSession } from "~/services/auths.server";
import { getPackages } from "~/services/package.server"
import { calculateDiscountPercent, formatCurrency } from "~/utils"
import type { ISubscriptionPlanWithCurrentResponse } from "~/interfaces/packages"

interface LoaderReturn {
   plans: ISubscriptionPlanWithCurrentResponse[];
}

interface TransactionProps {
   loaderData: LoaderReturn;
}

export const loader: LoaderFunction = async ({ request }) => {
   const customerId = await requireUserSession(request)
   const plans = await getPackages(customerId)
   return { plans }
}


export default function PricingPage({ loaderData }: TransactionProps) {
   const { plans } = loaderData
   // console.log("Plans:::", plans);
   const { t } = useTranslation();

   const navigate = useNavigate()

   return (
      <div className="sm:min-h-screen relative overflow-hidden px-3 sm:px-0">
         <nav className="relative z-10 p-6">
            <div className="container mx-auto flex items-center justify-between">
               <Link to="/dashboard/packages" className="flex items-center space-x-2 group">
                  <ArrowLeft className="h-5 w-5 text-rose-500 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-sm font-light text-gray-600 group-hover:text-rose-500 transition-colors">
                     {t('packages.list.back')}
                  </span>
               </Link>
               <Link
                  to="/dashboard/subscription-history"
                  className="flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
               >
                  <History className="h-4 w-4" />
                  <span className="text-sm font-medium">{t('packages.list.viewHistory')}</span>
               </Link>
            </div>
         </nav>

         <div className="hidden sm:block container mx-auto px-8 relative z-10">
            <div className="text-center mb-4 sm:mb-12">
               <div className="inline-flex items-center justify-center p-1 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full mb-3">
                  <span className="text-sm font-light text-rose-600 px-4 py-1 bg-white rounded-full shadow-sm">
                     {t('packages.list.chooseYourPlan')}
                  </span>
               </div>
               <p className="hidden sm:block text-md font-light text-gray-600 max-w-3xl mx-auto mb-8">
                  {t('packages.list.subtitle')}
               </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-16">
               {plans.map((plan) => (
                  <Card
                     key={plan.name}
                     className={`py-2 cursor-pointer relative bg-white/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 
                        ${plan.current ? "ring-1 ring-rose-500" : !plans.some((p) => p.current) && plan.isPopular ? "ring-1 ring-rose-500" : ""}`}
                  >
                     {plan.current ? (
                        <div className="absolute -top-3 right-1/2 -translate-x-1/2">
                           <span className="bg-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                              {t('packages.list.currentPlan')}
                           </span>
                        </div>
                     ) : !plans.some((p) => p.current) && plan.isPopular ? (
                        <div className="absolute -top-3 right-1/2 -translate-x-1/2">
                           <span className="bg-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                              {t('packages.list.mostPopular')}
                           </span>
                        </div>
                     ) : null}

                     <CardContent className="p-4">
                        <div className="text-center mb-4 space-y-2">
                           <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                           <p className="text-gray-600 font-light">{plan.description}</p>
                           <div className="mb-6">
                              <p className="text-xl font-light text-gray-900">
                                 {formatCurrency(plan.price)}
                                 <span className="text-sm ml-2 text-rose-500">({t('packages.list.save')} {calculateDiscountPercent(30000, 7, plan.price, plan.durationDays)}%)</span>
                              </p>
                           </div>
                        </div>

                        <div className="space-y-4 mb-8">
                           {plan.features && Object.values(plan.features).map((feature, featureIndex) => (
                              <div key={featureIndex} className="flex items-center space-x-3 text-sm">
                                 <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                                 <span className="text-gray-700 font-light">{feature}</span>
                              </div>
                           ))}
                        </div>

                        <Button
                           className={`w-full font-light py-3 rounded-md transition-all duration-300 ${plan.current
                              ? "bg-rose-500 text-white cursor-not-allowed opacity-75"
                              : !plans.some((p) => p.current) && plan.isPopular ? "bg-rose-500 text-white hover:shadow-lg hover:bg-rose-600 hover:text-white"
                                 : "bg-white text-black border hover:border-rose-500 hover:bg-rose-500 hover:text-white"
                              }`}
                           variant={plan.isPopular ? "default" : "outline"}
                           onClick={() => !plan.current && navigate(`/dashboard/payment/${plan.id}`)}
                           disabled={plan.current}
                        >
                           {plan.current ? t('packages.list.currentPlan') : t('packages.list.selectPlan')}
                        </Button>
                     </CardContent>
                  </Card>
               ))}
            </div>
         </div>

         <div className="sm:hidden p-2 rounded-md space-y-0">
            <div className="text-center">
               <div className="inline-flex items-center justify-center p-1 bg-gradient-to-r from-rose-100 to-pink-100 rounded-full mb-3">
                  <span className="text-sm font-light text-rose-600 px-4 py-1 bg-white rounded-full shadow-sm">
                     {t('packages.list.chooseYourPlan')}
                  </span>
               </div>
               <p className="text-sm font-light text-gray-600 max-w-3xl mx-auto mb-4">
                  {t('packages.list.subtitle')}
               </p>
            </div>
            <div className="flex items-start justify-start w-full">
               <Swiper
                  modules={[Navigation, Pagination]}
                  navigation={{
                     prevEl: ".custom-prev",
                     nextEl: ".custom-next",
                  }}
                  pagination={{ clickable: true }}
                  spaceBetween={5}
                  slidesPerView={2}
                  className="flex items-center custom-swiper2"
               >
                  {plans.map((plan) => (
                     <SwiperSlide key={plan.name}>
                        <Card
                           key={plan.name}
                           className={`py-2 cursor-pointer relative bg-white/80 backdrop-blur-xl transition-all duration-300
                        ${plan.current ? "bg-rose-500 text-white" : !plans.some((p) => p.current) && plan.isPopular ? "bg-rose-500 text-white" : ""}`}
                        >
                           <CardContent className="p-1">
                              <div className="text-center mb-4 space-y-2">
                                 <h3 className="text-lg font-bold">{plan.name}</h3>

                                 <p className="text-md font-light">
                                    {formatCurrency(plan.price)}
                                 </p>
                                 <span className="text-sm ml-2 text-rose-500">({t('packages.list.save')} {calculateDiscountPercent(30000, 7, plan.price, plan.durationDays)}%)</span>
                              </div>
                           </CardContent>
                        </Card>
                     </SwiperSlide>
                  ))}
               </Swiper>
            </div>
            <div className="space-y-4 mb-8 w-full px-3 py-4 border rounded-md">
               {plans[0].features && Object.values(plans[0].features).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 text-sm">
                     <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                     <span className="text-gray-700 font-light">{feature}</span>
                  </div>
               ))}
            </div>

            <div className="fixed bottom-0 z-9999999 bg-white w-full h-[8vh] left-0">
               <Button
                  size="lg"
                  className={`w-full py-3 rounded-md transition-all duration-300 bg-rose-500 text-white hover:shadow-lg hover:bg-rose-600 hover:text-white`}
                  variant={"outline"}
               >
                  {t('packages.list.continue')}
               </Button>
            </div>
         </div>
      </div >
   )
}
