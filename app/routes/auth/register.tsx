import { useState, useEffect } from "react"
import type { Route } from "./+types/register"
import { Form, Link, redirect, useActionData, useNavigate, useNavigation } from "react-router"
import { AlertCircle, ArrowLeft, Eye, EyeOff, Heart, LoaderCircle, User, UserPlus } from "lucide-react"

// components
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"

// interfaces and services
import { isAdult } from "~/lib/validation"
import type { Gender } from "~/interfaces/base"
import { validateCustomerSignupInputs } from "~/services"
import type { ICustomerSignupCredentials } from "~/interfaces"
import { FieldValidationError, getCurrentIP } from "~/services/base.server"

const backgroundImages = [
    "https://images.pexels.com/photos/8272148/pexels-photo-8272148.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.pexels.com/photos/15597164/pexels-photo-15597164.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.pexels.com/photos/7265057/pexels-photo-7265057.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
]

export async function action({ request }: Route.ActionArgs) {
    const { customerRegister } = await import("~/services")
    const formData = await request.formData()
    const ip = await getCurrentIP();
    const accessKey = process.env.APIIP_API_KEY || "";

    const confirmPassword = formData.get("confirmPassword") as string
    const genderValue = formData.get("gender") as string

    let gender: Gender
    if (genderValue === "male" || genderValue === "female" || genderValue === "other") {
        gender = genderValue as Gender
    } else {
        return { error: "Please select a valid gender!" }
    }

    const signUpData: ICustomerSignupCredentials = {
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        username: formData.get("username") as string,
        whatsapp: Number(formData.get("whatsapp")),
        gender: gender,
        dob: formData.get("dob") as string,
        password: formData.get("password") as string,
    };

    if (!signUpData.firstName) {
        return { success: false, error: true, message: "First name is required!" }
    }

    if (!signUpData.username) {
        return { success: false, error: true, message: "Username is required!" }
    }

    if (!signUpData.whatsapp) {
        return { success: false, error: true, message: "Invalid or incorrect phone number format!" }
    }

    if (!signUpData.password) {
        return { success: false, error: true, message: "Invalid password!" }
    }

    if (!signUpData.dob) {
        return { success: false, error: true, message: "Date of birth is required!" }
    }

    if (signUpData.dob) {
        const isChild = isAdult(signUpData.dob);
        if (!isChild) {
            return { success: false, error: true, message: "We're not allow under 18 year old!" }
        }
    }

    if (signUpData.password !== confirmPassword) {
        return { success: false, error: true, message: "Password missed match. Please try again!" }
    }

    if (request.method === "POST") {
        try {
            await validateCustomerSignupInputs(signUpData);
            const res = await customerRegister(signUpData, ip, accessKey);
            console.log("RES::", res);
            if (res.success) {

                return redirect("/dashboard")
            }
        } catch (error: any) {
            console.log("Failed:", error)
            if (error instanceof FieldValidationError) {
                return { success: error.payload.success, error: error.payload.error, message: error.payload.message }
            }
            const value = Object.values(error)[0];
            return { success: false, error: true, message: value };
        }
    }
    return { success: false, error: true, message: "Invalid request method." };
}

export default function SignUpPage() {
    const navigate = useNavigate()
    const navigation = useNavigation()
    const [showPassword, setShowPassword] = useState(false)
    const [isAcceptTerms, setIsAcceptTerms] = useState(false)
    const [showConPassword, setShowConPassword] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    const actionData = useActionData<typeof action>()
    const isSubmitting = navigation.state !== 'idle' && navigation.formMethod === "POST";

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
        }, 5000)
        return () => clearInterval(interval)
    }, []);

    return (
        <div className="fullscreen safe-area relative overflow-hidden">
            {backgroundImages.map((image, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? "opacity-100" : "opacity-0"
                        }`}
                    style={{
                        backgroundImage: `url(${image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
            ))}

            <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />

            <div className="hidden sm:block absolute bottom-8 left-8 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white fill-white" />
                    </div>
                    <span className="text-4xl font-bold text-white drop-shadow-lg">XaoSao</span>
                </div>
            </div>

            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 h-auto
                            bg-black/50 backdrop-blur-md shadow-2xl py-8 px-4 sm:p-8 flex flex-col justify-start rounded-lg z-20
                            lg:top-0 lg:right-0 lg:left-auto lg:translate-x-0 lg:translate-y-0 lg:w-2/5 lg:h-full lg:rounded-none">

                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-6 cursor-pointer" onClick={() => navigate("..")}>
                    <ArrowLeft className="text-xl text-gray-300" />
                </div>

                <div className="space-y-2 mb-6">
                    <h1 className="flex items-center justify-start text-md sm:text-lg font-bold text-white uppercase">
                        <UserPlus className="text-rose-500" />&nbsp;&nbsp;Create an Account!
                    </h1>
                    <p className="text-white text-xs sm:text-sm">It will display on your profile and you can change it later.</p>
                </div>
                <Form method="post" className="space-y-2 sm:space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="firstName" className="text-gray-300 text-sm">
                                First Name<span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                required
                                type="text"
                                id="firstName"
                                name="firstName"
                                className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                            />
                        </div>
                        <div>
                            <Label htmlFor="lastName" className="text-gray-300 text-sm">
                                Last Name<span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                required
                                type="text"
                                id="lastName"
                                name="lastName"
                                className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="username" className="text-gray-300 text-sm">
                            Username<span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                required
                                type="text"
                                id="username"
                                name="username"
                                className="pl-9 mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="mobile" className="text-gray-300 text-sm">
                            Mobile Number<span className="text-rose-500">*</span>
                        </Label>
                        <div className="flex mt-1 space-x-2">
                            <Select name="telCode" defaultValue="+856">
                                <SelectTrigger className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm">
                                    <SelectValue placeholder="🇱🇦" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="+856">🇱🇦 Laos +856</SelectItem>
                                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                                    <SelectItem value="+66">🇹🇭 Thailand +66</SelectItem>
                                    <SelectItem value="+84">🇻🇳 Vietnam +84</SelectItem>
                                    <SelectItem value="+95">🇲🇲 Myanmar +95</SelectItem>
                                    <SelectItem value="+65">🇸🇬 Singapore +65</SelectItem>
                                    <SelectItem value="+60">🇲🇾 Malaysia +60</SelectItem>
                                    <SelectItem value="+62">🇮🇩 Indonesia +62</SelectItem>
                                    <SelectItem value="+855">🇰🇭 Cambodia +855</SelectItem>
                                    <SelectItem value="+63">🇵🇭 Philippines +63</SelectItem>
                                    <SelectItem value="+673">🇧🇳 Brunei +673</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input
                                required
                                id="tel"
                                type="tel"
                                name="whatsapp"
                                placeholder="2078856194"
                                className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="gender" className="text-gray-300 text-sm">
                                Gender<span className="text-rose-500">*</span>
                            </Label>
                            <Select name="gender">
                                <SelectTrigger className="w-full mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="dateOfBirth" className="text-gray-300 text-sm">
                                Date of Birth<span className="text-rose-500">*</span>
                            </Label>
                            <Input
                                required
                                name="dob"
                                type="date"
                                id="dateOfBirth"
                                className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="password" className="text-gray-300 text-sm">
                                Password<span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative mt-1">
                                <Input
                                    required
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    className="border-white text-white placeholder-gray-400 focus:border-rose-500 pr-10 backdrop-blur-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword" className="text-gray-300 text-sm">
                                Confirm Password<span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative mt-1">
                                <Input
                                    required
                                    type={showConPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConPassword(!showConPassword)}
                                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                                >
                                    {showConPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {actionData?.error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center space-x-2 backdrop-blur-sm">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-red-200 text-sm">
                                {actionData.message}
                            </span>
                        </div>
                    )}
                    {actionData?.success && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-green-500 rounded-lg flex items-center space-x-2 backdrop-blur-sm">
                            <AlertCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-green-200 text-sm">
                                {actionData.message}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-start space-x-2 text-sm">
                        <input
                            id="terms"
                            type="checkbox"
                            name="acceptTerms"
                            checked={isAcceptTerms}
                            onChange={(e) => setIsAcceptTerms(e.target.checked)}
                            className="w-4 h-4 text-rose-500 bg-gray-800 border-gray-600 rounded focus:ring-rose-500"
                        />
                        <Label htmlFor="terms" className="flex items-center justify-start text-gray-300 leading-tight">
                            I accept <span className="hidden sm:block">all</span>
                            <Link to="#" className="text-white hover:text-rose-600 underline">
                                Terms & conditions
                            </Link>
                            <Link to="#" className="text-white hover:text-rose-600 underline">
                                Privacy & policy
                            </Link>
                            <span className="text-rose-500">*</span>
                        </Label>
                    </div>

                    <Button
                        type="submit"
                        disabled={isAcceptTerms === false || isSubmitting}
                        className={`w-full border border-rose-500 hover:bg-rose-600 text-white py-3 font-medium my-4 uppercase ${isAcceptTerms === false ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                        {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-1 animate-spin" /> : ""}
                        {isSubmitting ? "Registering...." : "Register"}
                    </Button>

                    <div className="text-center space-x-4">
                        <span className="text-white">Already have an account? </span>
                        <Link to="/login" className="text-rose-500 hover:text-rose-600 font-xs hover:underline uppercase">
                            Back Login
                        </Link>
                    </div>
                </Form>
            </div>
        </div>
    )
}
