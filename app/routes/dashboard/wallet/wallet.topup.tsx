import React from "react";
import type { Route } from "./+types/wallet.topup";
import { Form, redirect, useActionData, useNavigate, useNavigation } from "react-router";
import { AlertCircle, ArrowLeft, Building2, Check, CheckCircle, Clock, Copy, Download, LoaderCircle, QrCode, Upload } from "lucide-react";

// components
import Modal from "~/components/ui/model";
import { capitalize } from "~/utils/functions/textFormat";
import { uploadFileToBunnyServer } from "~/services/upload.server";
import { requireUserSession, validateTopUpInputs } from "~/services";
import type { ITransactionCredentials } from "~/interfaces/transaction";
import { formatCurrency } from "~/utils";

export async function action({ request }: Route.ActionArgs) {
    const { topUpWallet } = await import("~/services");
    const customerId = await requireUserSession(request);
    const formData = await request.formData();
    const transactionData = Object.fromEntries(formData) as Partial<ITransactionCredentials>;
    const amount = formData.get("amount");
    const voucher = formData.get("voucher");

    if (request.method === "POST") {
        try {
            if (voucher && voucher instanceof File && voucher.size > 0) {
                const buffer = Buffer.from(await voucher.arrayBuffer());
                const url = await uploadFileToBunnyServer(buffer, voucher.name, voucher.type);
                transactionData.paymentSlip = url;
            }

            transactionData.amount = Number(transactionData.amount);
            await validateTopUpInputs(transactionData as ITransactionCredentials);
            const res = await topUpWallet(transactionData.paymentSlip as string, Number(amount), customerId);
            if (res.id) {
                return redirect(`/dashboard/wallets?toastMessage=Deposit+success.+Your+transaction+is+under+review!&toastType=success`);
            }

        } catch (error: any) {
            console.error("Error updating customer:", error);
            if (error?.payload) {
                return error.payload;
            }
            if (error && typeof error === "object" && !Array.isArray(error)) {
                const keys = Object.keys(error);
                if (keys.length > 0) {
                    const firstKey = keys[0];
                    const firstMessage = (error as Record<string, any>)[firstKey];

                    return {
                        success: false,
                        error: true,
                        message: `${firstKey}: ${firstMessage}`,
                    };
                }
            }

            return {
                success: false,
                error: true,
                message: error || "Failed to create new top-up!",
            };
        }
    }
    return { success: false, error: true, message: "Invalid request method!" };
}

export default function WalletTopUpPage() {
    const navigate = useNavigate();
    const navigation = useNavigation();
    const actionData = useActionData<typeof action>()

    const [step, setStep] = React.useState<number>(1);
    const [dragOver, setDragOver] = React.useState<boolean>(false);
    const [amount, setAmount] = React.useState<number>(0);
    const [paymentMethod, setPaymentMethod] = React.useState<string>("qr");
    const [copiedAccount, setCopiedAccount] = React.useState<boolean>(false);
    const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
    const [previewSlip, setPreviewSlip] = React.useState<string | null>(null);

    const isSubmitting =
        navigation.state !== "idle" && navigation.formMethod === "POST";

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

    const bankAccount = "1234567890123456";
    const bankName = "ທະນະຄານການຄ້າມະຫາຊົນ";
    const accountName = "XAOSAO XAOSAO";

    const paymentMethods = [
        {
            id: "qr",
            name: "QR Code Payment",
            icon: QrCode,
            description: "Scan QR code with your banking app",
        },
        {
            id: "bank",
            name: "Bank Transfer",
            icon: Building2,
            description: "Transfer to our bank account",
        },
    ];

    function closeHandler() {
        navigate("/dashboard/wallets");
    }

    const downloadQR = () => {
        const link = document.createElement("a");
        link.href = "/images/qr-code.jpg";
        link.download = "payment-qr-code.png";
        link.click();
    };

    const copyAccountNumber = () => {
        navigator.clipboard.writeText(bankAccount);
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith("image/") || file.type === "application/pdf")) {
            handleFileUpload(file);
        }
    };

    const handleFileUpload = (file: File) => {
        setUploadedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewSlip(reader.result as string);
        };
        reader.readAsDataURL(file);

        // sync with actual input for form submission
        if (fileInputRef.current) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInputRef.current.files = dt.files;
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const removeFile = () => {
        setUploadedFile(null);
        setPreviewSlip(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
    };

    const canProceed = () => {
        switch (step) {
            case 1:
                return amount && amount > 0;
            case 2:
                return paymentMethod;
            case 3:
                return uploadedFile;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <div className="p-0 sm:p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Amount <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="amount"
                                    value={amount != null ? amount.toLocaleString() : ""}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/,/g, '');
                                        if (rawValue === '') {
                                            setAmount(0);
                                        } else {
                                            const numValue = Number(rawValue);
                                            if (!isNaN(numValue)) {
                                                setAmount(numValue);
                                            }
                                        }
                                    }}
                                    placeholder="0.00"
                                    className="block w-full p-4 py-2 border border-gray-300 rounded-md text-md font-semibold focus:ring-1 focus:ring-rose-200 focus:border-rose-500 outline-none transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Quick Amount
                            </label>
                            <div className="grid grid-cols-5 gap-2">
                                {quickAmounts.map((quickAmount) => (
                                    <button
                                        type="button"
                                        key={quickAmount}
                                        onClick={() => setAmount(quickAmount)}
                                        className="cursor-pointer py-2 px-3 border border-gray-200 rounded-lg text-sm font-medium hover:border-rose-500 hover:text-rose-500 transition-colors"
                                    >
                                        {formatCurrency(quickAmount)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="p-0 sm:p-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Choose Payment Method
                            </label>
                            <div className="flex items-center justify-between gap-2">
                                {paymentMethods.map((method) => (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`cursor-pointer w-full py-2 px-4 border rounded-md flex items-center space-x-3 transition-colors ${paymentMethod === method.id
                                            ? "border-rose-500 bg-rose-50"
                                            : "border-gray-200 hover:border-gray-300"
                                            }`}
                                    >
                                        <method.icon
                                            className={`h-6 w-6 ${paymentMethod === method.id ? "text-rose-500" : "text-gray-400"
                                                }`}
                                        />
                                        <div className="text-left">
                                            <div className="text-sm font-medium text-gray-900">{method.name}</div>
                                            <div className="text-sm text-gray-500">{method.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {paymentMethod === "qr" && (
                            <div className="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center">
                                <div className="w-52 h-52 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <img src="/images/qr-code.jpg" alt="QR-code" />
                                </div>
                                <button
                                    type="button"
                                    onClick={downloadQR}
                                    className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    <span className="text-sm">Download QR Code</span>
                                </button>
                                <p className="text-sm text-gray-500 mt-2">
                                    Scan this QR code with your banking app to make payment
                                </p>
                            </div>
                        )}

                        {paymentMethod === "bank" && (
                            <div className="bg-white border border-gray-200 rounded-xl p-4">
                                <h4 className="text-sm font-semibold text-gray-900 mb-4">Bank Transfer Details</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="text-sm text-gray-600">Bank Name</div>
                                            <div className="text-sm font-medium">{bankName}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="text-sm text-gray-600">Account Name</div>
                                            <div className="text-sm font-medium">{accountName}</div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <div className="text-sm text-gray-600">Account Number</div>
                                            <div className="text-sm font-mono font-medium">{bankAccount}</div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={copyAccountNumber}
                                            className="flex items-center space-x-1 p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors cursor-pointer"
                                        >
                                            {copiedAccount ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 3:
                return (
                    <div className="p-0 sm:p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Payment Voucher <span className="text-rose-500">*</span>
                            </label>
                            <input type="text" name="amount" value={amount ?? 0} className="hidden" readOnly />
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`border-2 border-dashed rounded-xl p-2 text-center transition-colors ${dragOver
                                    ? "border-rose-500 bg-rose-50"
                                    : uploadedFile
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                            >
                                {uploadedFile ? (
                                    <div className="space-y-4">
                                        <div className="w-full flex items-center justify-center">
                                            <img
                                                src={previewSlip ?? ""}
                                                alt="New slip preview"
                                                className="mt-2 h-28 rounded-md border"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium text-green-700">{uploadedFile.name}</div>
                                            <div className="text-sm text-green-600">
                                                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="border border-gray-500 text-sm text-gray-500 hover:text-gray-700 py-1 px-3 rounded-md cursor-pointer"
                                        >
                                            Remove file
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <Upload className="h-6 w-6 text-gray-400 mx-auto" />
                                        <div>
                                            <div className="font-medium text-gray-700">Drop your payment voucher here</div>
                                            <div className="text-sm text-gray-500 mt-1">or click to browse files</div>
                                        </div>
                                        <label
                                            htmlFor="file-upload"
                                            className="text-sm inline-block px-4 py-2 bg-rose-500 text-white rounded-lg cursor-pointer hover:bg-rose-600 transition-colors"
                                        >
                                            Choose File
                                        </label>
                                    </div>
                                )}
                                {/* always keep input in form */}
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    ref={fileInputRef}
                                    name="voucher"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="file-upload"
                                />
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                Supported formats: JPG, PNG, PDF (Max 10MB)
                            </p>
                        </div>

                        <div className="p-4 bg-amber-50 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-amber-700">
                                    <strong>Processing Time:</strong> Your deposit will be processed within 1-2 business
                                    hours after voucher verification.
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="p-0 sm:p-6 text-center space-y-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                        <h3 className="text-md font-semibold text-gray-900 mb-2">Top-up Request Submitted!</h3>
                        <p className="text-sm text-gray-600">
                            Your payment voucher has been submitted successfully. We'll process your deposit within 1-2
                            business hours.
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Modal onClose={closeHandler} className="w-full h-screen sm:h-auto sm:w-2/4 space-y-2 py-8 px-4 sm:px-4 sm:p-0 border">
            <Form method="post" encType="multipart/form-data" className="space-y-4">
                <div className="flex items-center justify-start space-x-2" onClick={closeHandler}>
                    <ArrowLeft className="text-gray-500" size={20} />
                    <span>Back To Wallet</span>
                </div>
                <div className="space-y-1">
                    <h1 className="text-lg text-gray-800">
                        {step === 1 && "Top-up your wallet balance"}
                        {step === 2 && "Choose payment method"}
                        {step === 3 && "Upload payment voucher"}
                        {step === 4 && "Top-up submitted"}
                    </h1>
                </div>

                {renderStepContent()}

                <div className="px-8">
                    {actionData?.error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-500 rounded-lg flex items-center space-x-2 backdrop-blur-sm">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            <span className="text-red-500 text-sm">
                                {capitalize(actionData.message)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="px-6 flex items-center justify-between mt-8">
                    <div className="flex space-x-1">
                        {[1, 2, 3, 4].map((stepNum) => (
                            <div
                                key={stepNum}
                                className={`w-2 h-2 rounded-full ${stepNum === step ? "bg-rose-500" : stepNum < step ? "bg-green-500" : "bg-gray-300"
                                    }`}
                            />
                        ))}
                    </div>

                    <div className="flex space-x-3">
                        {step === 1 &&
                            <button
                                type="button"
                                onClick={() => navigate("/dashboard/wallets")}
                                className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>}
                        {step > 1 && step < 4 && (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="cursor-pointer px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Back
                            </button>
                        )}

                        {step < 4 ? (
                            <button
                                type={step === 3 ? "submit" : "button"}
                                onClick={step < 3 ? () => setStep(step + 1) : undefined}
                                disabled={!canProceed()}
                                className="flex items-center justify-center text-sm cursor-pointer px-6 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {step === 3 && isSubmitting && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
                                {step === 3 ? isSubmitting ? "Submiting...." : "Submit" : "Continue"}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={closeHandler}
                                className="text-sm cursor-pointer px-6 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            </Form>
        </Modal>
    );
}