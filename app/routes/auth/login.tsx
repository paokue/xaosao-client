import type { Route } from "./+types/login"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Form, Link, useActionData, useNavigate, useNavigation } from "react-router"
import { ArrowLeft, Eye, EyeOff, LoaderCircle, User, AlertCircle } from "lucide-react"

// components
import { Label } from "~/components/ui/label"
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"

// interface and services
import { validateSignInInputs } from "~/services"
import type { ICustomerSigninCredentials } from "~/interfaces"

const mobileBackgroundImages = [
    "https://images.pexels.com/photos/17441715/pexels-photo-17441715.jpeg",
    "https://images.pexels.com/photos/5910995/pexels-photo-5910995.jpeg",
    "https://images.pexels.com/photos/2055224/pexels-photo-2055224.jpeg",
    "https://images.pexels.com/photos/3089876/pexels-photo-3089876.jpeg",
    "https://images.pexels.com/photos/5910832/pexels-photo-5910832.jpeg"
];

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
    const { t } = useTranslation()
    const navigate = useNavigate()
    const navigation = useNavigation()
    const [showPassword, setShowPassword] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const isSubmitting = navigation.state !== 'idle' && navigation.formMethod === "POST";
    const actionData = useActionData<typeof action>()

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % mobileBackgroundImages.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768

    return (
        <div className="fullscreen safe-area relative overflow-hidden">
            {mobileBackgroundImages.map((image, index) => (
                <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-3000 ${index === currentImageIndex ? "opacity-100" : "opacity-0"
                        }`}
                    style={{
                        backgroundImage: `url(${image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />

            ))}

            <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 h-auto
                            bg-black/50 backdrop-blur-md shadow-2xl py-8 px-4 sm:p-8 flex flex-col justify-start rounded-sm z-20
                            lg:top-0 lg:right-0 lg:left-auto lg:translate-x-0 lg:translate-y-0 lg:w-2/5 lg:h-full lg:rounded-none">

                <div className="rounded-full flex items-center justify-center sm:justify-start mb-8 cursor-pointer" onClick={() => navigate("/")}>
                    <p className="flex items-center space-x-2">
                        <ArrowLeft className="text-xl text-gray-300" />
                        <span className="text-white text-xl">XAOSAO</span>
                    </p>
                </div>

                <div className="space-y-2 mb-6">
                    <h1 className="flex items-center justify-start text-md sm:text-lg font-bold text-white uppercase">
                        <User className="text-rose-500" />&nbsp;{t('login.title')}
                    </h1>
                    <p className="text-white text-sm">{t('login.subtitle')}</p>
                </div>

                <Form method="post" className="space-y-4 sm:space-y-6">
                    <div>
                        <Label htmlFor="whatsapp" className="text-gray-300 text-sm">
                            {t('login.phoneNumber')}<span className="text-rose-500">*</span>
                        </Label>
                        <Input
                            required
                            minLength={10}
                            maxLength={10}
                            id="whatsapp"
                            type="number"
                            name="whatsapp"
                            placeholder={t('login.phonePlaceholder')}
                            className="mt-1 border-white text-white placeholder-gray-400 focus:border-pink-500 backdrop-blur-sm"
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-gray-300 text-sm">
                            {t('login.password')}<span className="text-rose-500">*</span>
                        </Label>
                        <div className="relative mt-1">
                            <Input
                                required
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder={t('login.passwordPlaceholder')}
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
                                {t('login.rememberMe')}
                            </Label>
                        </div>

                        <Link to="/forgot-password" className="text-white hover:text-rose-600 text-sm underline">
                            {t('login.forgotPassword')}
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-rose-500/50 text-white py-3 font-medium uppercase"
                    >
                        {isSubmitting ? <LoaderCircle className="w-4 h-4 mr-1 animate-spin" /> : ""}
                        {isSubmitting ? t('login.loggingIn') : t('login.loginButton')}
                    </Button>

                    <div className="flex flex-col sm:flex-row text-center justify-center space-y-2">
                        <div className="space-x-2">
                            <span className="text-white">{t('login.noAccount')} </span>
                            <Link to="/register" className="text-white text-md underline font-bold">
                                {isMobile ? t('login.createAccountMobile') : t('login.createAccount')}
                            </Link>
                        </div>
                    </div>
                </Form>
            </div>
        </div>
    )
}