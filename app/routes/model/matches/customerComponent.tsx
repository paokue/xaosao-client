import { Form, useNavigate } from "react-router";
import { MapPin, MessageSquareText, Heart, X, UserPlus, User } from "lucide-react";
import { useTranslation } from "react-i18next";

// swiper imports
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// utils
import { calculateAgeFromDOB, calculateDistance } from "~/utils";

interface CustomerCardProps {
    customer: any;
    modelLatitude?: number;
    modelLongitude?: number;
}

export default function CustomerCard({ customer, modelLatitude, modelLongitude }: CustomerCardProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div
            key={customer.id}
            className="cursor-pointer relative bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
        >
            <div className="relative overflow-hidden h-64 sm:h-56 md:h-60 lg:h-64">
                <Swiper
                    modules={[Pagination]}
                    pagination={{ clickable: true }}
                    className="w-full h-full custom-swiper z-999999"
                >
                    {customer.Images?.length ? (
                        customer.Images.map((img: any, index: number) => (
                            <SwiperSlide key={index}>
                                <img
                                    src={img.name}
                                    alt={`${customer.firstName} ${index}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    onClick={() => navigate(`/model/customer-profile/${customer.id}`)}
                                />
                            </SwiperSlide>
                        ))
                    ) : (
                        <SwiperSlide>
                            {customer.profile ? (
                                <img
                                    src={customer.profile}
                                    alt={customer.firstName}
                                    className="w-full h-full object-cover"
                                    onClick={() => navigate(`/model/customer-profile/${customer.id}`)}
                                />
                            ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-16 h-16 text-gray-400" />
                                </div>
                            )}
                        </SwiperSlide>
                    )}
                </Swiper>

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                    <Form method="post">
                        <input type="hidden" name="customerId" value={customer.id} />
                        {customer?.isContact ?
                            <button
                                type="button"
                                className="cursor-pointer bg-pink-100 text-pink-500 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm p-1.5 rounded-full hover:bg-pink-500 hover:text-white"
                                onClick={() => navigate(`/model/chat?id=${customer.firstName}`)}
                            >
                                <MessageSquareText className="w-4 h-4" />
                            </button>
                            :
                            <button
                                type="submit"
                                name="isFriend"
                                value="true"
                                className="cursor-pointer bg-white/20 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm p-1.5 rounded-full hover:bg-pink-500 hover:text-white"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        }
                    </Form>

                    <Form method="post">
                        <input type="hidden" name="pass" value="PASS" id="passInput" />
                        <input type="hidden" name="customerId" value={customer.id} />
                        {customer.model_interactions?.some((interaction: any) => interaction.action === "LIKE") ? "" :
                            <button
                                type="submit"
                                className={`${customer.model_interactions?.some((interaction: any) => interaction.action === "PASS") ? "bg-gray-600 text-white" : "sm:opacity-0 group-hover:opacity-100 hover:bg-gray-500 hover:text-white"} cursor-pointer bg-white/20 transition-opacity duration-300 backdrop-blur-sm p-1.5 rounded-full`}
                            >
                                <X size={14} />
                            </button>
                        }
                    </Form>

                    <Form method="post">
                        <input type="hidden" name="like" value="LIKE" id="likeInput" />
                        <input type="hidden" name="customerId" value={customer.id} />
                        {customer.model_interactions?.some((interaction: any) => interaction.action === "PASS") ? "" :
                            <button
                                type="submit"
                                className={`cursor-pointer backdrop-blur-sm p-1.5 rounded-full hover:bg-pink-500 hover:text-white ${customer.model_interactions?.some((interaction: any) => interaction.action === "LIKE") ? 'bg-pink-500 text-white' : "sm:opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/20"}`}
                            >
                                <Heart size={14} />
                            </button>
                        }
                    </Form>
                </div>
            </div>

            <div className="absolute bottom-4 left-0 right-0 p-4 text-white z-10">
                <h3 className="text-lg">
                    {customer.firstName} {customer.lastName},{" "}
                    <span className="text-sm">{calculateAgeFromDOB(customer.dob)} {t('matches.yearsOld')}</span>
                </h3>
                <p className="text-sm text-white/90 leading-tight">{customer.bio}</p>
                <div className="flex items-center gap-1 mt-1">
                    <MapPin size={14} className="text-pink-500" />
                    <span className="text-sm font-medium">
                        {modelLatitude && modelLongitude && customer?.latitude && customer?.longitude
                            ? `${calculateDistance(
                                Number(customer.latitude),
                                Number(customer.longitude),
                                Number(modelLatitude),
                                Number(modelLongitude)
                              ).toFixed(1)} ${t('matches.km')}`
                            : `-- ${t('matches.km')}`
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}
