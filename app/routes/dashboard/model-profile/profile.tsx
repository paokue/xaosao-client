import React from 'react';
import type { Route } from './+types/profile';
import { Form, redirect, useNavigate, useNavigation, useSearchParams, type LoaderFunction } from 'react-router';
import { BadgeCheck, UserPlus, Forward, User, Calendar, MarsStroke, ToggleLeft, MapPin, Star, ChevronLeft, ChevronRight, X, MessageSquareText, PhoneForwarded, Video, LoaderCircle, Book, BriefcaseBusiness, Heart } from 'lucide-react';

// components
import {
    Card,
    CardTitle,
    CardFooter,
    CardHeader,
    CardContent,
    CardDescription,
} from "~/components/ui/card"
import Rating from '~/components/ui/rating';
import { Badge } from '~/components/ui/badge';
import EmptyPage from '~/components/ui/empty';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

// interface, services and utils
import { getModelProfile } from '~/services/model.server';
import { calculateAgeFromDOB, formatCurrency, formatNumber } from '~/utils';
import type { ISinglemodelProfileResponse } from '~/interfaces';
import { capitalize, getFirstWord } from '~/utils/functions/textFormat';
import { getUserTokenFromSession, requireUserSession } from '~/services/auths.server';

interface LoaderReturn {
    model: ISinglemodelProfileResponse
}

interface ProfilePageProps {
    loaderData: LoaderReturn
}

export const loader: LoaderFunction = async ({ params, request }) => {
    const customerId = await requireUserSession(request)
    const modelId = params.userId
    const model = await getModelProfile(modelId as string, customerId)

    return { model }
}

export async function action({
    request,
}: Route.ActionArgs) {
    const customerId = await requireUserSession(request)
    const formData = await request.formData()
    const modelId = formData.get("modelId") as string
    const isInteraction = formData.get("interaction")
    const addFriend = formData.get("isFriend") === "true";
    const token = await getUserTokenFromSession(request)
    const { createCustomerInteraction, customerAddFriend } = await import(
        "~/services/interaction.server"
    );

    if (request.method === "POST") {
        if (addFriend === true) {
            try {
                const res = await customerAddFriend(customerId, modelId, token);
                if (res?.success) {
                    return redirect(`/dashboard/user-profile/${modelId}?toastMessage=Add+friend+successfully!&toastType=success`);
                }
            } catch (error: any) {
                return redirect(`/dashboard/user-profile/${modelId}?toastMessage=${error.message}&toastType=error`);
            }
        } else {
            const actionType = "LIKE";
            try {
                if (isInteraction === "true") {
                    const res = await createCustomerInteraction(customerId, modelId, actionType);
                    if (res?.success) {
                        return redirect(`/dashboard/user-profile/${modelId}?toastMessage=Interaction+successfully!&toastType=success`);
                    }
                } else {
                    return redirect(`/dashboard/user-profile/${modelId}?toastMessage=Something+wrong.+Please+try+again+later!&toastType=error`);
                }
            } catch (error: any) {
                return { success: false, error: true, message: error.message || "Phone number or password incorrect!" };
            }
        }
    }
    return redirect(`/dashboard/user-profile/${modelId}?toastMessage=Invalid+request+method!&toastType=warning`);
}

export default function ModelProfilePage({ loaderData }: ProfilePageProps) {
    const navigate = useNavigate()
    const navigation = useNavigation()
    const [searchParams] = useSearchParams();
    const { model } = loaderData
    const images = model.Images
    const isSubmitting =
        navigation.state !== "idle" && navigation.formMethod === "POST"

    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null)
    const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
    const [touchEndX, setTouchEndX] = React.useState<number | null>(null);

    // For toast messages
    const toastMessage = searchParams.get("toastMessage");
    const toastType = searchParams.get("toastType");
    const showToast = (message: string, type: "success" | "error" | "warning" = "success", duration = 3000) => {
        searchParams.set("toastMessage", message);
        searchParams.set("toastType", type);
        searchParams.set("toastDuration", String(duration));
        navigate({ search: searchParams.toString() }, { replace: true });
    };

    React.useEffect(() => {
        if (toastMessage) {
            showToast(toastMessage, toastType as any);
        }
    }, [toastMessage, toastType]);

    const handlePrev = () => {
        if (selectedIndex === null) return;
        setSelectedIndex((prev) => (prev! - 1 + images.length) % images.length)
    };

    const handleNext = () => {
        if (selectedIndex === null) return;
        setSelectedIndex((prev) => (prev! + 1) % images.length)
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return;
        const distance = touchStartX - touchEndX;

        if (distance > 50) {
            handleNext();
        } else if (distance < -50) {
            handlePrev();
        }

        setTouchStartX(null);
        setTouchEndX(null);
    };

    if (isSubmitting) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
                <div className="flex items-center justify-center gap-2">
                    {isSubmitting ? <LoaderCircle className="w-4 h-4 text-rose-500 animate-spin" /> : ""}
                    <p className="text-rose-600">Processing....</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-auto sm:h-screen flex items-center justify-center">
            <div className="w-11/12 sm:w-4/5 h-full">
                <div className="px-2 sm:px-6 py-2 sm:py-8 space-y-2">
                    <div className="flex sm:hidden items-start justify-between sm:justify-end px-0 sm:px-4">
                        <div className="flex sm:hidden items-center gap-2">
                            <Form method="post" >
                                <input type="hidden" name="modelId" value={model.id} />
                                <input type="hidden" name="interaction" value="true" />
                                <Button
                                    size="sm"
                                    type="submit"
                                    className={`cursor-pointer block sm:hidden text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md ${model.customer_interactions?.some(interaction => interaction.action === "LIKE") ? "bg-rose-500 hover:bg-rose-600" : "border border-rose-500 bg-white text-rose-500 hover:bg-rose-500 hover:text-white"}`}
                                >
                                    {model.customer_interactions?.some(interaction => interaction.action === "LIKE")
                                        ? <Heart />
                                        : <Heart />}
                                </Button>
                            </Form>
                            <Form method="post">
                                <input type="hidden" name="modelId" value={model.id} />
                                {model?.isContact ?
                                    <Button
                                        size="sm"
                                        type="button"
                                        className="cursor-pointer block sm:hidden bg-gray-700 sm:block text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                        onClick={() => navigate(`/dashboard/chat?id=${model.firstName}`)}
                                    >
                                        <MessageSquareText className="w-5 h-5 text-white cursor-pointer" />
                                    </Button>
                                    :
                                    <Button
                                        size="sm"
                                        type="submit"
                                        name="isFriend"
                                        value="true"
                                        className="cursor-pointer bg-white border border-gray-700 hover:bg-gray-700 text-gray-700 sm:block hover:text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                    >
                                        <UserPlus className="w-5 h-5 text-gray-500 cursor-pointer" />
                                    </Button>
                                }
                            </Form>
                        </div>
                        <div className="flex items-start gap-4">
                            <Forward className="w-6 h-6 text-gray-500 cursor-pointer" onClick={() => navigate(`/dashboard/user-profile-share/${model.id}`)} />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <div className="flex-shrink-0">
                            <img
                                src={model?.profile || ""}
                                alt={`${model.firstName}-${model.lastName}`}
                                className="w-32 h-32 rounded-full object-cover border-2 border-rose-500"
                            />
                        </div>
                        <div className="flex sm:hidden items-center justify-center gap-2 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1 px-4 py-0.5 rounded-full bg-gray-100">
                                <h2 className="text-lg text-gray-800">{`${model.firstName} ${model.lastName}`}</h2>
                                <BadgeCheck className="w-5 h-5 text-rose-500" />
                            </div>
                        </div>

                        <div className="hidden sm:block flex-1">
                            <div className="mb-4">
                                <h1 className="text-2xl font-bold mb-1">
                                    {model.firstName}&nbsp;{model.lastName}
                                </h1>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <Form method="post" >
                                    <input type="hidden" name="modelId" value={model.id} />
                                    <input type="hidden" name="interaction" value="true" />
                                    <Button
                                        size="sm"
                                        type="submit"
                                        className={`cursor-pointer hidden sm:block text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md ${model.customer_interactions?.some(interaction => interaction.action === "LIKE") ? "bg-rose-500 hover:bg-rose-600" : "border border-rose-500 bg-white text-rose-500 hover:bg-rose-500 hover:text-white"}`}
                                    >
                                        {model.customer_interactions?.some(interaction => interaction.action === "LIKE")
                                            ? "Liked"
                                            : "Like"}
                                    </Button>
                                </Form>
                                <Form method="post">
                                    <input type="hidden" name="modelId" value={model.id} />
                                    {model?.isContact ?
                                        <Button
                                            size="sm"
                                            type="button"
                                            className="cursor-pointer hidden bg-gray-700 sm:block text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                            onClick={() => navigate(`/dashboard/chat?id=${model.firstName}`)}
                                        >
                                            Message
                                        </Button>
                                        :
                                        <Button
                                            size="sm"
                                            type="submit"
                                            name="isFriend"
                                            value="true"
                                            className="cursor-pointer hidden bg-white border border-gray-700 hover:bg-gray-700 text-gray-700 sm:block hover:text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                        >
                                            Add friend
                                        </Button>
                                    }
                                </Form>
                                <Button
                                    size="sm"
                                    type="button"
                                    className="cursor-pointer hidden bg-gray-600 sm:block text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                    onClick={() => navigate(`/dashboard/user-profile-share/${model.id}`)}
                                >
                                    Share
                                </Button>
                            </div>

                            <div className="flex items-center gap-6 mb-4">
                                <div className='flex items-center gap-1'>
                                    <span className="text-lg text-black font-bold">{formatNumber(model.totalLikes)}</span>
                                    <span className="text-md text-gray-500 ml-1">Like</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <span className="text-lg text-black font-bold">{formatNumber(model.totalFriends)}</span>
                                    <span className="text-md text-gray-500 ml-1">Friends</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex sm:hidden items-center justify-around w-full mb-4">
                        <div className="w-1/2 text-center flex items-center justify-center gap-3 border-r">
                            <div className="text-lg text-black font-bold">{formatNumber(model.totalLikes)}</div>
                            <div className="text-md text-gray-500">Likes</div>
                        </div>
                        <div className="w-1/2 text-center flex items-center justify-center gap-3">
                            <div className="text-lg text-black font-bold">{formatNumber(model.totalFriends)}</div>
                            <div className="text-md text-gray-500">Friends</div>
                        </div>
                    </div>
                </div>

                <div className="pb-4">
                    <Tabs defaultValue="account" className="w-full">
                        <TabsList className='w-full mb-2'>
                            <TabsTrigger value="account">Account Info</TabsTrigger>
                            <TabsTrigger value="services">Service</TabsTrigger>
                            <TabsTrigger value="images">Images</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <div className="flex flex-col sm:flex-row items-start justify-between space-y-2">
                                <div className="w-full flex items-start justify-start flex-col space-y-3 text-sm p-2">
                                    <h3 className="text-gray-800 font-bold">Personal Information:</h3>
                                    <p className='flex items-center'><User size={14} />&nbsp;Fullname: {model.firstName}&nbsp;{model.lastName}</p>
                                    <p className="flex items-center"> <Calendar size={14} />&nbsp;Age: {calculateAgeFromDOB(model.dob)} years old</p>
                                    <div className="flex items-center"><MarsStroke size={14} />&nbsp;Gender:&nbsp;&nbsp;
                                        <Badge variant="outline" className={`${model.gender === "male" ? "bg-gray-700 text-gray-300" : "bg-rose-100 text-rose-500"} px-3 py-1`}>
                                            {capitalize(model.gender)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center"><ToggleLeft size={14} />&nbsp;Status:&nbsp;&nbsp;
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                            {capitalize(model.status)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center"><ToggleLeft size={14} />&nbsp;Available status for Chat and Call:&nbsp;&nbsp;
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                            {capitalize(model.available_status)}
                                        </Badge>
                                    </div>
                                    <p className="flex items-center"><MapPin size={14} />&nbsp;Address: {model.address}</p>
                                    <p className="flex items-center"><Calendar size={14} />&nbsp;Be member at: {model.createdAt.toDateString()}</p>
                                    {model.career && <p className="flex items-center"><BriefcaseBusiness size={14} />&nbsp;Career: {model.career}</p>}
                                    {model.education && <p className="flex items-center"><Book size={14} />&nbsp;Education: {model.education}</p>}
                                    {model.bio && <p className="flex items-center"><User size={14} />&nbsp;BIO: {model.bio}</p>}
                                </div>
                                <Separator className="block sm:hidden" />
                                <div className="w-full mb-8 space-y-4">
                                    {model.interests &&
                                        <div className='space-y-2'>
                                            <h3 className="text-sm text-gray-800 font-bold">Interests:</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.values(model.interests ?? {}).map((interest, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="outline"
                                                        className="bg-purple-100 text-purple-700 border-purple-200 px-3 py-1"
                                                    >
                                                        {interest}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    }
                                    <div className='space-y-2'>
                                        <h3 className="text-sm text-gray-800 font-bold">Total rating:</h3>
                                        <div className="flex items-center">
                                            <Star size={14} />&nbsp;Rating: &nbsp; {model.rating === 0 ?
                                                <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 px-3 py-1">
                                                    {capitalize("No Rating")}
                                                </Badge> : <Rating value={4} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="services" className="space-y-4">
                            {model.ModelService.length > 0 ?
                                <div className="w-full">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase">Service Rating:</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mx-auto ">
                                        {model.ModelService.map((service) => {
                                            const name = getFirstWord(service.service.name).toLowerCase();
                                            return (
                                                <Card key={service.id} className={`cursor-pointer w-full max-w-sm ${name === "sleep" ? "border-cyan-500" : name === "drinking" ? "border-green-500" : "border-rose-500"}`}>
                                                    <CardHeader>
                                                        <CardTitle className='text-sm'>{service.service.name}</CardTitle>
                                                        <CardDescription className='text-xs'>
                                                            {service.service.description}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <strong className="text-sm">{formatCurrency(Number(service.customRate ? service.customRate : service.service.baseRate))} / Time</strong>
                                                    </CardContent>
                                                    <CardFooter className="flex-col gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full hover:border hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500"
                                                            onClick={() => navigate(`/dashboard/book-service/${model.id}/${service.id}`)}
                                                        >
                                                            Book Now
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                                :
                                <div className="w-full">
                                    <EmptyPage
                                        title="No Services Available for This Model"
                                        description="It looks like this model does not have any active services at the moment."
                                    />
                                </div>
                            }
                        </TabsContent>
                        <TabsContent value="images" className='w-full'>
                            <div className="flex space-x-2 rounded-md h-full">
                                {model.Images.length > 0 ?
                                    <div className="w-full grid grid-cols-2 gap-2 h-fit">
                                        <div className="flex flex-col items-start justify-start space-y-2">
                                            {model.Images.slice(0, Math.ceil(model.Images.length / 2)).map((image, index) => (
                                                <div
                                                    key={image.id}
                                                    className="relative w-full group cursor-pointer overflow-hidden rounded-lg"
                                                    onClick={() => setSelectedIndex(index)}
                                                >
                                                    <img
                                                        src={image.name}
                                                        alt={`Profile ${index + 1}`}
                                                        className="w-full h-48 sm:h-72 object-cover shadow-sm transition-transform duration-300 ease-in-out group-hover:scale-105"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex flex-col items-start justify-start space-y-2 cursor-pointer">
                                            {model.Images.slice(Math.ceil(model.Images.length / 2)).map((image, index) => {
                                                const actualIndex = Math.ceil(model.Images.length / 2) + index;

                                                return (
                                                    <div
                                                        key={image.id}
                                                        className="relative w-full group cursor-pointer overflow-hidden rounded-lg"
                                                        onClick={() => setSelectedIndex(actualIndex)}
                                                    >
                                                        <img
                                                            src={image.name}
                                                            alt={`Profile ${index + 1}`}
                                                            className="w-full h-48 sm:h-72 object-cover shadow-sm transition-transform duration-300 ease-in-out group-hover:scale-105"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    :
                                    <div className="w-full">
                                        <EmptyPage
                                            title="No Photos Yet"
                                            description="This model has not shared any images so far. Come back soon to see their latest gallery!"
                                        />

                                    </div>
                                }
                            </div>

                            {selectedIndex !== null && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
                                    <button
                                        className="absolute top-4 right-4 text-white"
                                        onClick={() => setSelectedIndex(null)}
                                    >
                                        <X size={32} />
                                    </button>

                                    <button
                                        className="absolute left-4 text-white hidden sm:block"
                                        onClick={handlePrev}
                                    >
                                        <ChevronLeft size={40} />
                                    </button>

                                    <img
                                        src={images[selectedIndex].name}
                                        alt="Selected"
                                        className="h-full sm:max-h-[80vh] w-full sm:max-w-[90vw] object-contain rounded-lg shadow-lg"
                                        onTouchStart={handleTouchStart}
                                        onTouchMove={handleTouchMove}
                                        onTouchEnd={handleTouchEnd}
                                    />

                                    <button
                                        className="absolute right-4 text-white hidden sm:block"
                                        onClick={handleNext}
                                    >
                                        <ChevronRight size={40} />
                                    </button>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div >
    );
};