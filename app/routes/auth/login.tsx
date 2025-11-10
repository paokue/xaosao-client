import type { Route } from "./+types/login"
import { useState, useEffect } from "react"
import { Form, Link, useActionData, useNavigate, useNavigation } from "react-router"
import { ArrowLeft, Eye, EyeOff, LoaderCircle, User, AlertCircle } from "lucide-react"

// components
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"

// interface and services
import { validateSignInInputs } from "~/services"
import type { ICustomerSigninCredentials } from "~/interfaces"

const backgroundImages = [
    "https://images.pexels.com/photos/9883888/pexels-photo-9883888.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    "https://images.pexels.com/photos/14541930/pexels-photo-14541930.jpeg?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
]

export async function action({ request }: Route.ActionArgs) {
    const { customerLogin } = await import("~/services")
    const formData = await request.formData()

    const signInData: ICustomerSigninCredentials = {
        rememberMe: formData.get("rememberMe") === "on" ? true : false,
        whatsapp: Number(formData.get("whatsapp")),
        password: formData.get("password") as string,
    };

    if (!signInData.whatsapp || !signInData.password) {
        return { error: "Invalid phone number or password!" }
    }

    if (request.method === "POST") {
        try {
            validateSignInInputs(signInData);
            return await customerLogin(signInData);
        } catch (error: any) {
            if (error.status === 401) {
                return { success: false, error: true, message: error.message || "Phone number or password incorrect!" };
            }
            const value = Object.values(error)[0];
            return { success: false, error: true, message: value };
        }
    }
    return { success: false, error: true, message: "Invalid request method!" };
}

export default function SignInPage() {
    const navigate = useNavigate()
    const navigation = useNavigation()
    const [showPassword, setShowPassword] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const isSubmitting = navigation.state !== 'idle' && navigation.formMethod === "POST";
    const actionData = useActionData<typeof action>()

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768

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

            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />

            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 h-auto
                            bg-black/50 backdrop-blur-md shadow-2xl py-8 px-4 sm:p-8 flex flex-col justify-start rounded-sm z-20
                            lg:top-0 lg:right-0 lg:left-auto lg:translate-x-0 lg:translate-y-0 lg:w-2/5 lg:h-full lg:rounded-none">

                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-6 cursor-pointer" onClick={() => navigate("/")}>
                    <ArrowLeft className="text-xl text-gray-300" />
                </div>

                <div className="space-y-2 mb-6">
                    <h1 className="flex items-center justify-start text-md sm:text-lg font-bold text-white uppercase">
                        <User className="text-rose-500" />&nbsp;Login To Your Account
                    </h1>
                    <p className="text-white text-sm">Welcome back! Please enter your details.</p>
                </div>

                <Form method="post" className="space-y-4 sm:space-y-6">
                    <div>
                        <Label htmlFor="whatsapp" className="text-gray-300 text-sm">
                            Phone number<span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            required
                            minLength={10}
                            maxLength={10}
                            id="whatsapp"
                            type="number"
                            name="whatsapp"
                            placeholder="2078856194"
                            className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                        />
                    </div>

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
                                placeholder="************"
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

                    {actionData?.error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg flex items-center space-x-2 backdrop-blur-sm">
                            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            <span className="text-red-200 text-sm">
                                {actionData.message}
                            </span>
                        </div>
                    )}

                    <div className="w-full flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember"
                                type="checkbox"
                                name="rememberMe"
                                className="w-4 h-4 text-pink-500 bg-gray-900 border-gray-600 rounded focus:ring-pink-500"
                            />
                            <Label htmlFor="remember" className="ml-2 text-sm text-gray-300">
                                Remember Me
                            </Label>
                        </div>

                        <Link to="/forgot-password" className="text-white hover:text-rose-600 text-sm underline">
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white py-3 font-medium uppercase"
                    >
                        {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-1 animate-spin" /> : ""}
                        {isSubmitting ? "Logging in..." : "Log in"}
                    </Button>

                    <div className="flex flex-col sm:flex-row text-center justify-center space-y-2">
                        <div className="space-x-4">
                            <span className="text-white">I don't have an account yet? </span>
                            <Link to="/register" className="text-rose-500 hover:text-rose-600 text-md font-medium hover:underline uppercase">
                                {isMobile ? "Create  new" : "Create one its Free!"}
                            </Link>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    )
}