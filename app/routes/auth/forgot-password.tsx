import { useState, useEffect, useRef } from "react";
import type { Route } from "./+types/forgot-password";
import { AlertCircle, ArrowLeft, Heart, LoaderCircle } from "lucide-react";
import { Form, Link, redirect, useActionData, useNavigate, useNavigation } from "react-router";

// components
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { validateForgotInputs, validateVerifyOTPInputs } from "~/services";
import { FieldValidationError } from "~/services/base.server";
import Countdown from "~/lib/count-down";

const backgroundImages = [
    "https://images.pexels.com/photos/8272148/pexels-photo-8272148.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.pexels.com/photos/15597164/pexels-photo-15597164.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.pexels.com/photos/7265057/pexels-photo-7265057.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
];

export async function action({ request }: Route.ActionArgs) {
    const { forgotPassword, resendResetToken, verifyResetToken } = await import("~/services");
    const formData = await request.formData();
    const otp = formData.get("otp") as string;
    const phone = formData.get("whatsapp") as string;
    const isVerify = formData.get("verify") as string;
    const isResend = formData.get("isResend") === "true";
    const phoneNumber = formData.get("phoneNumber") as string;

    if (isVerify === "verify") {
        try {
            await validateVerifyOTPInputs({ otp });
            const res = await verifyResetToken(otp);
            if (res.isValid) {
                return redirect("/reset-password?otp=" + otp);
            }
            return { success: false, error: true, message: "Invalid OTP. Please request new one!" };
        } catch (error) {
            console.error("Reset password error:", error);
            return { success: false, error: true, message: "Something went wrong. Please try again later." };
        }
    }

    try {
        if (isResend) {
            if (!phoneNumber) {
                return { success: false, error: true, message: "Phone number is required!" };
            }
            await validateForgotInputs({ whatsapp: Number(phone) });
            const resendRes = await resendResetToken(Number(phoneNumber));
            return { ...resendRes, phone, isResend };
        }
        if (!phone) {
            return { success: false, error: true, message: "Phone number is required!" };
        }
        await validateForgotInputs({ whatsapp: Number(phone) });
        const forgotRes = await forgotPassword(Number(phone));
        if (forgotRes.success) {
            return { phone: Number(phone), success: true, error: false, message: "OTP sent successfully to your phone number!" };
        }

        return { success: false, error: true, message: forgotRes.message ?? "Failed to send OTP" };
    } catch (error: any) {
        console.error("Forgot password error:", error);
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

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const isSubmitting = navigation.state !== 'idle' && navigation.formMethod === "POST";

    const [timeLeft, setTimeLeft] = useState(60000);
    const actionData = useActionData<typeof action>();
    const showOtpForm = actionData?.success;
    const phoneNumber = actionData?.phone;

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleChange = (index: number, value: string) => {

        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1000);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [backgroundImages.length]);

    useEffect(() => {
        if (actionData?.success) {
            setTimeLeft(60000);
            setOtp(["", "", "", "", "", ""]);
        }
    }, [actionData?.success]);

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
                            lg:top-0 lg:right-0 lg:left-auto lg:translate-x-0 lg:translate-y-0 lg:w-2/5 lg:h-full lg:rounded-none"
            >
                <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-6 cursor-pointer"
                    onClick={() => navigate("/")}
                >
                    <ArrowLeft className="text-xl text-gray-300" />
                </div>
                {!showOtpForm ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-xl font-bold text-rose-500 uppercase">
                                Forgot Password?
                            </h1>
                            <p className="text-gray-400">
                                No worries, let's get you back on track!
                            </p>
                        </div>

                        <Form method="post" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp" className="text-gray-300">
                                    Phone number
                                </Label>
                                <Input
                                    id="whatsapp"
                                    type="number"
                                    name="whatsapp"
                                    placeholder="2078856194"
                                    className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
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
                                className="w-full border border-rose-500 hover:bg-rose-600 text-white py-3 font-medium shadow-lg transition-all duration-300"
                            >
                                {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-1 animate-spin" /> : ""}
                                {isSubmitting ? "Processing..." : " Get OTP Code"}
                            </Button>
                        </Form>

                        <div className="text-center">
                            <p className="text-sm text-gray-400">
                                Remember your password?{" "}
                                <Link
                                    to="/login"
                                    className="text-rose-500 hover:text-rose-600 font-medium hover:underline ml-2 uppercase hover:underline"
                                >
                                    Log In
                                </Link>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-rose-500 mb-2">
                                Verify OTP!
                            </h1>
                            <p className="text-gray-400">
                                Enter the 6-digit code sent to your phone number to process next
                                step.
                            </p>
                        </div>

                        <Form method="post" className="space-y-6">
                            <div className="flex justify-center space-x-3">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => {
                                            inputRefs.current[index] = el;
                                        }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="w-12 h-12 text-center text-lg font-semibold bg-gray-800/50 border-2 border-gray-600 text-white rounded-lg focus:border-rose-500 focus:ring-2 focus:ring-pink-500/20 focus:outline-none transition-colors"
                                    />
                                ))}
                            </div>

                            <input
                                type="hidden"
                                name="otp"
                                value={otp.join("")}
                            />

                            <input type="hidden" name="verify" value="verify" />
                            <Button
                                type="submit"
                                className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 font-medium shadow-lg transition-all duration-300 uppercase"
                                disabled={otp.some((digit) => !digit)}
                            >
                                {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-1 animate-spin" /> : ""}
                                {isSubmitting ? "Verifying..." : "Verify"}
                            </Button>
                        </Form>

                        <div className="text-center">
                            <input
                                type="text"
                                name="isResend"
                                value={"true"}
                                className="hidden"
                            />
                            {timeLeft > 0 ? (
                                <div className="text-sm text-gray-400">
                                    <Countdown initialMs={timeLeft} />
                                </div>
                            ) : (
                                <Form method="post" className="space-y-6">
                                    <input type="hidden" name="isResend" value="true" />
                                    <input type="hidden" name="phoneNumber" value={phoneNumber} />
                                    {actionData?.error && (
                                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center space-x-2 backdrop-blur-sm">
                                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                            <span className="text-red-200 text-sm">
                                                {actionData?.message}
                                            </span>
                                        </div>
                                    )}

                                    <div className="w-full flex items-center justify-center gap-2">
                                        <p className="text-sm text-gray-400">Don't Receive OTP Code?</p>
                                        <Button
                                            type="submit"
                                            className="cursor-pointer text-sm text-rose-500 hover:text-rose-600 font-medium"
                                        >
                                            {isSubmitting ? "Resending..." : "Resend Code"}
                                        </Button>
                                    </div>
                                </Form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
