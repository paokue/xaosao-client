import { AlertCircle, ArrowLeft, Heart, LoaderCircle } from "lucide-react"
import { Form, Link, redirect, useActionData, useNavigate, useNavigation } from "react-router"
import { useState, useEffect } from "react"
import type { Route } from "./+types/reset-password"
import { useTranslation } from "react-i18next"

// components
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { validateResetPasswordInputs } from "~/services"
import { FieldValidationError } from "~/services/base.server"

const backgroundImages = [
    "https://images.pexels.com/photos/8272148/pexels-photo-8272148.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.pexels.com/photos/15597164/pexels-photo-15597164.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.pexels.com/photos/7265057/pexels-photo-7265057.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
]

export async function action({ request }: Route.ActionArgs) {
    const { resetPassword } = await import("~/services");
    const url = new URL(request.url);
    const otp = url.searchParams.get("otp");

    const formData = await request.formData();
    const password = formData.get("password") as string;
    if (!otp || !password) {
        return { success: false, error: true, message: "Invalid OTP or password!" }
    }

    try {
        await validateResetPasswordInputs({ password })
        const res = await resetPassword(otp as string, password)
        if (res.success) {
            return redirect("/login")
        }
        return { success: res.success, error: res.error, message: res.message }
    } catch (error: any) {
        console.log("Error::", error)
        // return { success: false, error: true, message: "" }
        // console.error("Forgot password error:", error);
        if (error instanceof FieldValidationError) {
            return {
                success: error.payload.message === "Please wait 60 seconds before resending OTP!" ? true : error.payload.success,
                error: error.payload.error,
                message: error.payload.message || "Something went wrong. Try again later!",
            };
        }
        const value = Object.values(error)[0];
        return { success: false, error: true, message: value };
    }
}

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const actionData = useActionData<typeof action>();
    const isSubmitting = navigation.state !== 'idle' && navigation.formMethod === "POST";

    console.log("Final DATA from Backend:::", actionData);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [backgroundImages.length])

    return (
        <div className="fullscreen safe-area relative overflow-hidden">
            <div className="absolute inset-0">
                {backgroundImages.map((image, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? "opacity-100" : "opacity-0"
                            }`}
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                        }}
                    />
                ))}
                <div className="absolute inset-0 bg-black/10" />
            </div>

            <div className="hidden sm:block absolute bottom-8 left-8 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold text-white">XaoSao</span>
                </div>
            </div>

            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 h-auto
                            bg-black/50 backdrop-blur-md shadow-2xl py-8 px-4 sm:p-8 flex flex-col justify-center rounded-lg z-20
                            lg:top-0 lg:right-0 lg:left-auto lg:translate-x-0 lg:translate-y-0 lg:w-2/5 lg:h-full lg:rounded-none">

                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-6 cursor-pointer"
                    onClick={() => navigate("/login")}
                >
                    <ArrowLeft className="text-xl text-gray-300" />
                </div>

                <div className="space-y-6">
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-rose-500 uppercase">
                            {t('resetPassword.title')}
                        </h1>
                        <p className="text-gray-400">{t('resetPassword.subtitle')}</p>
                    </div>

                    <Form method="post" className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">
                                {t('resetPassword.newPassword')}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                className="mt-1 border-rose-500 text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                                required
                            />
                        </div>
                        {actionData?.error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center space-x-2 backdrop-blur-sm">
                                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span className="text-red-200 text-sm">
                                    {actionData?.message}
                                </span>
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 font-medium shadow-lg transition-all duration-300 uppercase"
                        >
                            {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-1 animate-spin" /> : ""}
                            {isSubmitting ? t('resetPassword.reseting') : t('resetPassword.reset')}
                        </Button>
                    </Form>

                    <div className="text-center pt-4">
                        <p className="text-sm text-gray-400">
                            {t('resetPassword.rememberPassword')}{" "}&nbsp;&nbsp;
                            <Link to="/login" className="text-rose-500 hover:text-rose-600 font-medium hover:underline uppercase hover:underline">
                                {t('login.loginButton')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
