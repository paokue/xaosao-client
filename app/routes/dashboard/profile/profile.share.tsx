import { useState, useRef } from 'react';
import {
    Mail,
    Link,
    Copy,
    Check,
    Download,
    Facebook,
    Instagram,
    MessageCircle,
    ChevronLeft,
    LoaderCircle,
} from 'lucide-react';
import * as QRCode from 'qrcode.react';
import { useNavigate, useNavigation, type LoaderFunction } from 'react-router';

// components
import Modal from '~/components/ui/model';
import type { ICustomerResponse } from '~/interfaces/customer';
import { requireUserSession } from '~/services';
import { getCustomerProfile } from '~/services/profile.server';
import { truncateText } from '~/utils/functions/textFormat';

interface LoaderReturn {
    customerData: ICustomerResponse;
    customerId: string;
}

interface TransactionProps {
    loaderData: LoaderReturn;
}

export const loader: LoaderFunction = async ({ request }) => {
    const customerId = await requireUserSession(request)
    const customerData = await getCustomerProfile(customerId)
    return { customerData, customerId }
}

export default function ShareProfilePage({ loaderData }: TransactionProps) {
    const { customerData, customerId } = loaderData;
    const navigate = useNavigate()
    const navigation = useNavigation()
    const [linkCopied, setLinkCopied] = useState(false)
    const [qrDownloaded, setQrDownloaded] = useState(false)
    const qrRef = useRef<HTMLDivElement>(null)
    const url = `http://localhost:5173/dashboard/user-profile/${customerId}`
    const isLoading = navigation.state === "loading"

    const socialPlatforms = [
        {
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-green-500 hover:bg-green-600',
            action: () => shareToWhatsApp()
        },
        {
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-blue-600 hover:bg-blue-700',
            action: () => shareToFacebook()
        },
        {
            name: 'Instagram',
            icon: Instagram,
            color: 'bg-purple-400 hover:bg-purple-500',
            action: () => shareToInstagram()
        },
        {
            name: 'Email',
            icon: Mail,
            color: 'bg-gray-600 hover:bg-gray-700',
            action: () => shareViaEmail()
        }
    ];

    const copyProfileUrl = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const downloadQRCode = () => {
        if (!qrRef.current) return;

        const canvas = qrRef.current.querySelector('canvas');
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `${customerData.firstName.replace(/\s+/g, '_')}_profile_qr.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        setQrDownloaded(true);
        setTimeout(() => setQrDownloaded(false), 2000);
    };

    const shareToWhatsApp = () => {
        const message = `Check out ${customerData.firstName}'s profile: ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const shareToFacebook = () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    };

    const shareToInstagram = () => {
        copyProfileUrl();
        alert('Profile link copied! You can now paste it in your Instagram story or post.');
    };

    const shareViaEmail = () => {
        const subject = `Check out ${customerData.firstName}'s profile`;
        const body = `Hi!\n\nI thought you might be interested in checking out ${customerData.firstName}'s profile:\n\n${url}\n\nBest regards!`;
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    const closeHandler = () => {
        navigate("/dashboard/profile")
    };

    if (isLoading) {
        return (
            <div className="h-11/12 flex justify-center items-center min-h-[200px]">
                <LoaderCircle className="w-6 h-6 animate-spin text-rose-500" />&nbsp; Loading...
            </div>
        )
    }

    return (
        <Modal onClose={closeHandler} className="w-full sm:w-3/5 h-screen sm:h-auto">
            <div className="p-0 sm:p-4 space-y-4 ">
                <div className="flex items-center justify-between block sm:hidden mb-4">
                    <div className="flex items-center" onClick={() => navigate("/dashboard/profile")}>
                        <ChevronLeft />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                    <div className="text-center">
                        <h3 className="hidden sm:block text-md font-semibold text-gray-900 mb-4">QR Code</h3>
                        <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 mb-4">
                            <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4" ref={qrRef}>
                                <QRCode.QRCodeCanvas value={url} size={192} />
                            </div>
                            <p className="text-sm text-gray-600 mb-4">
                                Scan with any QR code reader to view profile
                            </p>
                            <button
                                onClick={downloadQRCode}
                                className="text-sm inline-flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                <span>{qrDownloaded ? 'Downloaded!' : 'Download QR'}</span>
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-gray-900 mb-2 sm:mb-4">Share Options</h3>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Profile Link
                            </label>
                            <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2">
                                    <div className="flex items-center space-x-2">
                                        <Link className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span className="text-sm text-gray-600 truncate">
                                            {truncateText(url, 35)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={copyProfileUrl}
                                    className="text-sm px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center space-x-2"
                                >
                                    {linkCopied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            <span className="hidden sm:inline">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span className="hidden sm:inline">Copy</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-md font-bold text-gray-700 mb-2 sm:mb-4">
                                Share on Social Media
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {socialPlatforms.map((platform) => (
                                    <button
                                        key={platform.name}
                                        onClick={platform.action}
                                        className={`cursor-pointer text-gray-500 border hover:${platform.color} hover:text-white px-4 py-2 rounded-md transition-all duration-300 flex items-center justify-center space-x-2`}
                                    >
                                        <platform.icon className="w-4 h-4" />
                                        <span className="text-sm font-medium">{platform.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
