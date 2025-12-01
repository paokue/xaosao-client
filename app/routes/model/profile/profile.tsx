import React, { useRef } from 'react';
import type { MetaFunction, LoaderFunctionArgs, ActionFunctionArgs } from 'react-router';
import { useLoaderData, useNavigate, useNavigation, useSearchParams, redirect, useFetcher } from 'react-router';
import { BadgeCheck, Settings, User, Calendar, MarsStroke, ToggleLeft, MapPin, Star, ChevronLeft, ChevronRight, X, Pencil, Book, BriefcaseBusiness, Trash2, Upload, Loader, Info, Building2, Plus, CreditCard, UserRoundPen } from 'lucide-react';

// components
import {
    Card,
    CardTitle,
    CardFooter,
    CardHeader,
    CardContent,
    CardDescription,
} from "~/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import Rating from '~/components/ui/rating';
import { Badge } from '~/components/ui/badge';
import EmptyPage from '~/components/ui/empty';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

// services and utils
import { requireModelSession } from '~/services/model-auth.server';
import { getModelOwnProfile, createModelImage, deleteModelImage, updateModelImage, getModelBanks, createModelBank, updateModelBank, deleteModelBank } from '~/services/model-profile.server';
import { deleteFileFromBunny, uploadFileToBunnyServer } from '~/services/upload.server';
import type { IModelOwnProfileResponse, IModelBank } from '~/interfaces/model-profile';
import { capitalize, getFirstWord, extractFilenameFromCDNSafe } from '~/utils/functions/textFormat';
import { calculateAgeFromDOB, formatCurrency, formatNumber } from '~/utils';

const MAX_IMAGES = 6;

export const meta: MetaFunction = () => {
    return [
        { title: "My Profile - Model Dashboard" },
        { name: "description", content: "View and manage your model profile" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs) {
    const modelId = await requireModelSession(request);
    const [model, banks] = await Promise.all([
        getModelOwnProfile(modelId),
        getModelBanks(modelId),
    ]);
    return { model, banks };
}

export async function action({ request }: ActionFunctionArgs) {
    const modelId = await requireModelSession(request);
    const formData = await request.formData();
    const actionType = formData.get("actionType") as string;

    // Handle bank create action
    if (actionType === "createBank") {
        const bankName = formData.get("bank_name") as string;
        const bankAccountName = formData.get("bank_account_name") as string;
        const bankAccountNumber = formData.get("bank_account_number") as string;
        const qrCodeFile = formData.get("qr_code_file") as File;

        if (!bankName || !bankAccountName || !bankAccountNumber) {
            return redirect(`/model/profile?error=${encodeURIComponent("All required fields must be filled!")}&tab=banks`);
        }

        try {
            let qrCodeUrl: string | undefined;

            // Upload QR code image if provided
            if (qrCodeFile && qrCodeFile instanceof File && qrCodeFile.size > 0) {
                const buffer = Buffer.from(await qrCodeFile.arrayBuffer());
                qrCodeUrl = await uploadFileToBunnyServer(buffer, qrCodeFile.name, qrCodeFile.type);
            }

            await createModelBank(modelId, {
                bank_name: bankName,
                bank_account_name: bankAccountName,
                bank_account_number: Number(bankAccountNumber),
                qr_code: qrCodeUrl,
            });
            return redirect(`/model/profile?success=${encodeURIComponent("Bank created successfully!")}&tab=banks`);
        } catch (error: any) {
            return redirect(`/model/profile?error=${encodeURIComponent(error.message || "Failed to create bank!")}&tab=banks`);
        }
    }

    // Handle bank update action
    if (actionType === "updateBank") {
        const bankId = formData.get("bankId") as string;
        const bankName = formData.get("bank_name") as string;
        const bankAccountName = formData.get("bank_account_name") as string;
        const bankAccountNumber = formData.get("bank_account_number") as string;
        const qrCodeFile = formData.get("qr_code_file") as File;
        const existingQrCode = formData.get("existing_qr_code") as string;

        if (!bankId || !bankName || !bankAccountName || !bankAccountNumber) {
            return redirect(`/model/profile?error=${encodeURIComponent("All required fields must be filled!")}&tab=banks`);
        }

        try {
            let qrCodeUrl: string | undefined = existingQrCode || undefined;

            // Upload new QR code image if provided
            if (qrCodeFile && qrCodeFile instanceof File && qrCodeFile.size > 0) {
                // Delete old QR code from BunnyCDN if exists
                if (existingQrCode) {
                    await deleteFileFromBunny(extractFilenameFromCDNSafe(existingQrCode));
                }
                const buffer = Buffer.from(await qrCodeFile.arrayBuffer());
                qrCodeUrl = await uploadFileToBunnyServer(buffer, qrCodeFile.name, qrCodeFile.type);
            }

            await updateModelBank(bankId, modelId, {
                bank_name: bankName,
                bank_account_name: bankAccountName,
                bank_account_number: Number(bankAccountNumber),
                qr_code: qrCodeUrl,
            });
            return redirect(`/model/profile?success=${encodeURIComponent("Bank updated successfully!")}&tab=banks`);
        } catch (error: any) {
            return redirect(`/model/profile?error=${encodeURIComponent(error.message || "Failed to update bank!")}&tab=banks`);
        }
    }

    // Handle bank delete action
    if (actionType === "deleteBank") {
        const bankId = formData.get("bankId") as string;
        if (!bankId) {
            return redirect(`/model/profile?error=${encodeURIComponent("Bank ID is required!")}&tab=banks`);
        }
        try {
            await deleteModelBank(bankId, modelId);
            return redirect(`/model/profile?success=${encodeURIComponent("Bank deleted successfully!")}&tab=banks`);
        } catch (error: any) {
            return redirect(`/model/profile?error=${encodeURIComponent(error.message || "Failed to delete bank!")}&tab=banks`);
        }
    }

    // Handle image actions
    const imageId = formData.get("imageId") as string;
    const imageName = formData.get("imageName") as string;
    const newFile = formData.get("newFile") as File;

    // Handle delete action
    if (actionType === "delete") {
        if (!imageId) {
            return redirect(`/model/profile?error=${encodeURIComponent("Image ID is required!")}&tab=images`);
        }

        try {
            // Delete file from BunnyCDN if imageName exists
            if (imageName) {
                await deleteFileFromBunny(extractFilenameFromCDNSafe(imageName));
            }
            await deleteModelImage(imageId, modelId);
            return redirect(`/model/profile?success=${encodeURIComponent("Image deleted successfully!")}&tab=images`);
        } catch (error: any) {
            return redirect(`/model/profile?error=${encodeURIComponent(error.message || "Failed to delete image!")}&tab=images`);
        }
    }

    // Handle upload (POST - new image) or update (PATCH - replace existing image)
    const isNewUpload = imageId?.startsWith("placeholder");

    if (newFile && newFile instanceof File && newFile.size > 0) {
        try {
            let imageUrl = "";

            // Delete old file from BunnyCDN if updating existing image
            if (!isNewUpload && imageName) {
                await deleteFileFromBunny(extractFilenameFromCDNSafe(imageName));
            }

            // Upload new file to BunnyCDN
            const buffer = Buffer.from(await newFile.arrayBuffer());
            imageUrl = await uploadFileToBunnyServer(buffer, newFile.name, newFile.type);

            if (isNewUpload) {
                // Create new image record in database
                const res = await createModelImage(modelId, imageUrl);
                if (res.id) {
                    return redirect(`/model/profile?success=${encodeURIComponent("Image uploaded successfully!")}&tab=images`);
                }
            } else {
                // Update existing image record in database
                const res = await updateModelImage(imageId, modelId, imageUrl);
                if (res.id) {
                    return redirect(`/model/profile?success=${encodeURIComponent("Image updated successfully!")}&tab=images`);
                }
            }
        } catch (error: any) {
            console.error("Error uploading/updating image:", error);
            return redirect(`/model/profile?error=${encodeURIComponent(error?.message || "Failed to upload image!")}&tab=images`);
        }
    }

    return null;
}

export default function ModelProfilePage() {
    const fetcher = useFetcher();
    const navigate = useNavigate();
    const navigation = useNavigation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { model, banks } = useLoaderData<{ model: IModelOwnProfileResponse; banks: IModelBank[] }>();

    const images = model.Images;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const qrCodeInputRef = useRef<HTMLInputElement>(null);

    // States for file upload and delete
    const [selectedImageId, setSelectedImageId] = React.useState<string | null>(null);
    const [uploadingImageId, setUploadingImageId] = React.useState<string | null>(null);
    const [deletingImageId, setDeletingImageId] = React.useState<string | null>(null);
    const [deletingBankId, setDeletingBankId] = React.useState<string | null>(null);
    const [selectedImageName, setSelectedImageName] = React.useState<string | null>(null);

    // States for bank modal
    const [isBankModalOpen, setIsBankModalOpen] = React.useState(false);
    const [isBankSubmitting, setIsBankSubmitting] = React.useState(false);
    const [editingBank, setEditingBank] = React.useState<IModelBank | null>(null);
    const [qrCodeFile, setQrCodeFile] = React.useState<File | null>(null);
    const [qrCodePreview, setQrCodePreview] = React.useState<string | null>(null);
    const [bankFormData, setBankFormData] = React.useState({
        bank_name: "",
        bank_account_name: "",
        bank_account_number: "",
    });

    // States for delete confirmation modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [bankToDelete, setBankToDelete] = React.useState<IModelBank | null>(null);

    // States for image preview
    const [touchEndX, setTouchEndX] = React.useState<number | null>(null);
    const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

    const errorMessage = searchParams.get("error");
    const successMessage = searchParams.get("success");
    const activeTab = searchParams.get("tab") || "account";

    const canUploadMore = images.length < MAX_IMAGES;
    const remainingSlots = MAX_IMAGES - images.length;

    const isSubmitting = navigation.state !== "idle" || fetcher.state !== "idle";

    // Handle file selection and upload
    const handleFileInputClick = (imageId: string, imageName: string) => {
        setSelectedImageId(imageId);
        setSelectedImageName(imageName);
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && selectedImageId) {
            const file = e.target.files[0];

            const formData = new FormData();
            formData.append("imageId", selectedImageId);
            formData.append("imageName", selectedImageName || "");
            formData.append("newFile", file);

            // Set uploading state
            setUploadingImageId(selectedImageId);

            fetcher.submit(formData, {
                method: "post",
                encType: "multipart/form-data",
            });

            // Reset file input
            e.target.value = "";
        }
    };

    // Reset uploading/deleting state when fetcher completes
    React.useEffect(() => {
        if (fetcher.state === 'idle') {
            if (uploadingImageId) setUploadingImageId(null);
            if (deletingImageId) setDeletingImageId(null);
            if (deletingBankId) setDeletingBankId(null);
            if (isBankSubmitting) setIsBankSubmitting(false);
        }
    }, [fetcher.state, uploadingImageId, deletingImageId, deletingBankId, isBankSubmitting]);

    // Handle delete image
    const handleDeleteImage = (imageId: string, imageName: string) => {
        setDeletingImageId(imageId);
        const formData = new FormData();
        formData.append("actionType", "delete");
        formData.append("imageId", imageId);
        formData.append("imageName", imageName);
        fetcher.submit(formData, { method: "post" });
    };

    // Handle open delete confirmation modal
    const handleOpenDeleteBankModal = (bank: IModelBank) => {
        setBankToDelete(bank);
        setIsDeleteModalOpen(true);
    };

    // Handle close delete confirmation modal
    const handleCloseDeleteBankModal = () => {
        setIsDeleteModalOpen(false);
        setBankToDelete(null);
    };

    // Handle confirm delete bank
    const handleConfirmDeleteBank = () => {
        if (!bankToDelete) return;
        setDeletingBankId(bankToDelete.id);
        const formData = new FormData();
        formData.append("actionType", "deleteBank");
        formData.append("bankId", bankToDelete.id);
        fetcher.submit(formData, { method: "post" });
        handleCloseDeleteBankModal();
    };

    // Handle open bank modal for create
    const handleOpenCreateBankModal = () => {
        setEditingBank(null);
        setBankFormData({
            bank_name: "",
            bank_account_name: "",
            bank_account_number: "",
        });
        setQrCodeFile(null);
        setQrCodePreview(null);
        setIsBankModalOpen(true);
    };

    // Handle open bank modal for edit
    const handleOpenEditBankModal = (bank: IModelBank) => {
        setEditingBank(bank);
        setBankFormData({
            bank_name: bank.bank_name,
            bank_account_name: bank.bank_account_name,
            bank_account_number: String(bank.bank_account_number),
        });
        setQrCodeFile(null);
        setQrCodePreview(bank.qr_code || null);
        setIsBankModalOpen(true);
    };

    // Handle close bank modal
    const handleCloseBankModal = () => {
        setIsBankModalOpen(false);
        setEditingBank(null);
        setBankFormData({
            bank_name: "",
            bank_account_name: "",
            bank_account_number: "",
        });
        setQrCodeFile(null);
        setQrCodePreview(null);
    };

    // Handle QR code file selection
    const handleQrCodeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setQrCodeFile(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setQrCodePreview(previewUrl);
        }
    };

    // Handle remove QR code
    const handleRemoveQrCode = () => {
        setQrCodeFile(null);
        setQrCodePreview(null);
        if (qrCodeInputRef.current) {
            qrCodeInputRef.current.value = "";
        }
    };

    // Handle bank form submit
    const handleBankFormSubmit = () => {
        setIsBankSubmitting(true);
        const formData = new FormData();
        formData.append("bank_name", bankFormData.bank_name);
        formData.append("bank_account_name", bankFormData.bank_account_name);
        formData.append("bank_account_number", bankFormData.bank_account_number);

        if (qrCodeFile) {
            formData.append("qr_code_file", qrCodeFile);
        }

        if (editingBank) {
            formData.append("actionType", "updateBank");
            formData.append("bankId", editingBank.id);
            // Pass existing QR code URL for update logic
            if (editingBank.qr_code && !qrCodeFile) {
                formData.append("existing_qr_code", editingBank.qr_code);
            }
        } else {
            formData.append("actionType", "createBank");
        }

        fetcher.submit(formData, { method: "post", encType: "multipart/form-data" });
    };

    // Close bank modal when submission is complete
    React.useEffect(() => {
        if (fetcher.state === 'idle' && isBankSubmitting) {
            setIsBankSubmitting(false);
            handleCloseBankModal();
        }
    }, [fetcher.state, isBankSubmitting]);

    // Clear messages after 5 seconds
    React.useEffect(() => {
        if (successMessage || errorMessage) {
            const timeout = setTimeout(() => {
                searchParams.delete("success");
                searchParams.delete("error");
                setSearchParams(searchParams, { replace: true });
            }, 5000);
            return () => clearTimeout(timeout);
        }
    }, [successMessage, errorMessage, searchParams, setSearchParams]);

    const handlePrev = () => {
        if (selectedIndex === null) return;
        setSelectedIndex((prev) => (prev! - 1 + images.length) % images.length);
    };

    const handleNext = () => {
        if (selectedIndex === null) return;
        setSelectedIndex((prev) => (prev! + 1) % images.length);
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

    return (
        <div className="h-auto sm:h-screen flex items-center justify-center">
            <div className="w-11/12 sm:w-4/5 h-full">
                <div className="px-2 sm:px-6 py-2 sm:py-8 space-y-2">
                    <div className="flex sm:hidden items-start justify-end px-0 sm:px-4">
                        <div className="flex sm:hidden items-center gap-2">
                            <Button
                                size="sm"
                                type="button"
                                className="cursor-pointer block sm:hidden text-gray-500 bg-white hover:bg-gray-500 hover:text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                onClick={() => navigate('/model/settings')}
                            >
                                <Settings className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-6">
                        <div className="flex-shrink-0">
                            <img
                                src={model?.profile || undefined}
                                alt={`${model.firstName}-${model.lastName}`}
                                className="w-32 h-32 rounded-full object-cover border-2 border-rose-500"
                            />
                        </div>
                        <div className="flex sm:hidden items-center justify-center gap-2 text-center">
                            <div className="flex items-center justify-center gap-2 mb-1 px-4 py-0.5 rounded-full bg-gray-100">
                                <h2 className="text-lg text-gray-800">{`${model.firstName} ${model.lastName || ''}`}</h2>
                                <BadgeCheck className="w-5 h-5 text-rose-500" />
                            </div>
                            <div
                                className="flex items-center justify-center gap-2 mb-1 px-4 py-2 rounded-full bg-gray-100 cursor-pointer hover:bg-gray-200"
                                onClick={() => navigate("/model/profile/edit")}
                            >
                                <UserRoundPen className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="hidden sm:block flex-1">
                            <div className="mb-2">
                                <h1 className="text-2xl font-bold mb-1">
                                    {model.firstName}&nbsp;{model.lastName || ''}
                                </h1>

                            </div>
                            <div className="flex items-center gap-6 mb-4">
                                <div className='flex items-center gap-1'>
                                    <span className="text-lg text-black font-bold">{formatNumber(model.totalLikes)}</span>
                                    <span className="text-md text-gray-500 ml-1">Likes</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <span className="text-lg text-black font-bold">{formatNumber(model.totalFriends)}</span>
                                    <span className="text-md text-gray-500 ml-1">Friends</span>
                                </div>
                                <div className='flex items-center gap-1'>
                                    <span className="text-lg text-black font-bold">{formatNumber(model.total_review)}</span>
                                    <span className="text-md text-gray-500 ml-1">Reviews</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mb-6">
                                <Button
                                    size="sm"
                                    type="button"
                                    className="cursor-pointer hidden sm:block border border-rose-500 text-rose-500 bg-white hover:bg-rose-500 hover:text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                    onClick={() => navigate('/model/profile/edit')}
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    size="sm"
                                    type="button"
                                    className="cursor-pointer hidden sm:block bg-gray-600 text-white px-4 font-medium text-sm shadow-lg hover:shadow-xl transition-all duration-200 rounded-md"
                                    onClick={() => navigate('/model/settings')}
                                >
                                    Settings
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex sm:hidden items-center justify-around w-full mb-4">
                        <div className="w-1/3 text-center flex items-center justify-center gap-3 border-r">
                            <div className="text-lg text-black font-bold">{formatNumber(model.totalLikes)}</div>
                            <div className="text-md text-gray-500">Likes</div>
                        </div>
                        <div className="w-1/3 text-center flex items-center justify-center gap-3 border-r">
                            <div className="text-lg text-black font-bold">{formatNumber(model.totalFriends)}</div>
                            <div className="text-md text-gray-500">Friends</div>
                        </div>
                        <div className="w-1/3 text-center flex items-center justify-center gap-3">
                            <div className="text-lg text-black font-bold">{formatNumber(model.total_review)}</div>
                            <div className="text-md text-gray-500">Reviews</div>
                        </div>
                    </div>
                </div>

                <div className="pb-4">
                    <Tabs defaultValue={activeTab} className="w-full">
                        <TabsList className='w-full mb-2'>
                            <TabsTrigger value="account">Account Info</TabsTrigger>
                            <TabsTrigger value="banks">Bank Accounts</TabsTrigger>
                            <TabsTrigger value="services">Services</TabsTrigger>
                            <TabsTrigger value="images">Images</TabsTrigger>
                        </TabsList>
                        <TabsContent value="account">
                            <div className="flex flex-col sm:flex-row items-start justify-between space-y-2">
                                <div className="w-full flex items-start justify-start flex-col space-y-3 text-sm p-2">
                                    <h3 className="text-gray-800 font-bold uppercase">Personal Information:</h3>
                                    <p className='flex items-center'><User size={14} />&nbsp;Full Name: {model.firstName}&nbsp;{model.lastName || ''}</p>
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
                                    <div className="flex items-center"><ToggleLeft size={14} />&nbsp;Availability:&nbsp;&nbsp;
                                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                                            {capitalize(model.available_status)}
                                        </Badge>
                                    </div>
                                    <p className="flex items-center"><MapPin size={14} />&nbsp;Address: {model.address || 'Not set'}</p>
                                    <p className="flex items-center"><Calendar size={14} />&nbsp;Member Since: {new Date(model.createdAt).toDateString()}</p>
                                    {model.career && <p className="flex items-center"><BriefcaseBusiness size={14} />&nbsp;Career: {model.career}</p>}
                                    {model.education && <p className="flex items-center"><Book size={14} />&nbsp;Education: {model.education}</p>}
                                    {model.bio && <p className="flex items-center"><User size={14} />&nbsp;Bio: {model.bio}</p>}
                                </div>
                                <Separator className="block sm:hidden" />
                                <div className="w-full mb-8 space-y-4">
                                    {model.interests &&
                                        <div className='space-y-2'>
                                            <h3 className="text-sm uppercase text-gray-800 font-bold">Interests:</h3>
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
                                        <h3 className="text-sm text-gray-800 font-bold">Total Rating</h3>
                                        <div className="flex items-center">
                                            <Star size={14} />&nbsp;Rating: &nbsp; {model.rating === 0 ?
                                                <Badge variant="outline" className="bg-rose-100 text-rose-700 border-rose-200 px-3 py-1">
                                                    {capitalize('No Rating')}
                                                </Badge> : <Rating value={model.rating} />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="banks" className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-800 uppercase">My Bank Accounts</h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="bg-rose-500 text-white hover:bg-rose-500 hover:text-white"
                                    onClick={handleOpenCreateBankModal}
                                >
                                    <Plus size={16} />
                                    Add New
                                </Button>
                            </div>

                            {successMessage && activeTab === "banks" && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">{successMessage}</p>
                                </div>
                            )}
                            {errorMessage && activeTab === "banks" && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">{errorMessage}</p>
                                </div>
                            )}

                            {banks.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {banks.map((bank) => {
                                        const isDeleting = deletingBankId === bank.id;
                                        return (
                                            <Card key={bank.id} className={`py-2 relative border-gray-200 ${isDeleting ? 'opacity-50' : ''}`}>
                                                {isDeleting && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10 rounded-lg">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Loader className="w-6 h-6 text-rose-500 animate-spin" />
                                                            <span className="text-xs text-rose-500">Deleting...</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-rose-100 rounded-lg">
                                                                <Building2 className="w-4 h-4 text-rose-600" />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                className="cursor-pointer p-1.5 text-gray-500 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                                                onClick={() => handleOpenEditBankModal(bank)}
                                                                disabled={isDeleting}
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="cursor-pointer p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                onClick={() => handleOpenDeleteBankModal(bank)}
                                                                disabled={isDeleting || isSubmitting}
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="text-sm">Bank name:&nbsp; {bank.bank_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="text-sm">Account name:&nbsp; {bank.bank_account_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <span className="text-sm">Account number:&nbsp;{bank.bank_account_number}</span>
                                                    </div>
                                                    <div className='flex items-center justify-center flex-col space-y-2'>
                                                        {bank.qr_code && (
                                                            <div className="mt-3">
                                                                <img
                                                                    src={bank.qr_code}
                                                                    alt="QR Code"
                                                                    className="w-30 h-30 object-contain border rounded"
                                                                />
                                                            </div>
                                                        )}
                                                        <span className='text-gray-500 text-sm'>Qr Code</span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="w-full">
                                    <EmptyPage
                                        title="No Bank Accounts"
                                        description="You have not added any bank accounts yet. Add one to receive payments."
                                    />
                                    <div className="flex justify-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white"
                                            onClick={handleOpenCreateBankModal}
                                        >
                                            <Plus size={16} />
                                            Add Your First Bank
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                        <TabsContent value="services" className="space-y-4">
                            {model.ModelService.length > 0 ?
                                <div className="w-full">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase">My Services</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mx-auto ">
                                        {model.ModelService.map((service) => {
                                            const name = getFirstWord(service.service.name).toLowerCase();
                                            return (
                                                <Card key={service.id} className={`cursor-pointer w-full max-w-sm ${name === "sleep" ? "border-cyan-500" : name === "drinking" ? "border-green-500" : "border-rose-500"}`}>
                                                    <CardHeader>
                                                        <CardTitle className='text-sm'>{service.service.name}</CardTitle>
                                                        <CardDescription className='text-xs sm:text-sm'>
                                                            {service.service.description}
                                                        </CardDescription>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <strong className="text-sm">{formatCurrency(Number(service.customRate ? service.customRate : service.service.baseRate))} /time</strong>
                                                    </CardContent>
                                                    <CardFooter className="flex-col gap-2">
                                                        <Badge variant="outline" className={`${service.isAvailable ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200"} px-3 py-1`}>
                                                            {service.isAvailable ? 'Available' : 'Unavailable'}
                                                        </Badge>
                                                    </CardFooter>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                                :
                                <div className="w-full">
                                    <EmptyPage
                                        title="No Services"
                                        description="You have not added any services yet."
                                    />
                                    <div className="flex justify-center mt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white"
                                            onClick={() => navigate('/model/settings/services')}
                                        >
                                            Add Services
                                        </Button>
                                    </div>
                                </div>
                            }
                        </TabsContent>
                        <TabsContent value="images" className='w-full space-y-4'>
                            {successMessage && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">{successMessage}</p>
                                </div>
                            )}
                            {errorMessage && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">{errorMessage}</p>
                                </div>
                            )}

                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {images.map((image, index) => {
                                    const isUploading = uploadingImageId === image.id;
                                    const isDeleting = deletingImageId === image.id;
                                    const isBusy = isUploading || isDeleting;
                                    return (
                                        <div
                                            key={image.id}
                                            className="relative aspect-square group cursor-pointer overflow-hidden rounded-lg border border-gray-200"
                                        >
                                            <img
                                                src={image.name}
                                                alt={`Profile ${index + 1}`}
                                                className={`w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105 ${isBusy ? 'opacity-50' : ''}`}
                                                onClick={() => !isBusy && setSelectedIndex(index)}
                                            />

                                            {isUploading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                                                    <div className="flex flex-col items-center gap-2 text-white">
                                                        <Loader className="w-8 h-8 animate-spin" />
                                                        <p className="text-sm font-medium">Uploading...</p>
                                                    </div>
                                                </div>
                                            )}

                                            {isDeleting && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                                                    <div className="flex flex-col items-center gap-2 text-white">
                                                        <Loader className="w-8 h-8 animate-spin" />
                                                        <p className="text-sm font-medium">Deleting...</p>
                                                    </div>
                                                </div>
                                            )}

                                            {!isBusy && (
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4 gap-2">
                                                    <button
                                                        type="button"
                                                        className="flex text-rose-500 bg-rose-100 border border-rose-300 rounded-sm px-2 py-1 text-xs shadow-md gap-1 cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleFileInputClick(image.id, image.name);
                                                        }}
                                                    >
                                                        <Upload size={14} />
                                                        Upload New
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="flex text-red-500 bg-red-100 border border-red-300 rounded-sm px-2 py-1 text-xs shadow-md gap-1 cursor-pointer"
                                                        disabled={isSubmitting}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteImage(image.id, image.name);
                                                        }}
                                                    >
                                                        <Trash2 size={14} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                            {/* Image number badge */}
                                            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                {index + 1}/{MAX_IMAGES}
                                            </div>
                                        </div>
                                    );
                                })}

                                {Array.from({ length: remainingSlots }).map((_, index) => {
                                    const placeholderId = `placeholder-${index}`;
                                    const isUploading = uploadingImageId === placeholderId;
                                    return (
                                        <div
                                            key={placeholderId}
                                            className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 ${isUploading
                                                ? 'border-rose-400 bg-rose-50'
                                                : canUploadMore
                                                    ? 'border-gray-300 hover:border-rose-400 hover:bg-rose-50 cursor-pointer transition-colors'
                                                    : 'border-gray-200 bg-gray-50'
                                                }`}
                                            onClick={() => canUploadMore && !isUploading && handleFileInputClick(placeholderId, "")}
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader className="w-8 h-8 text-rose-500 animate-spin" />
                                                    <span className="text-xs text-rose-500">Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className={`w-8 h-8 ${canUploadMore ? 'text-gray-400' : 'text-gray-300'}`} />
                                                    <span className={`text-xs ${canUploadMore ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        Click to upload
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm text-blue-800 font-medium">
                                        Image Upload Limit
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        You can upload up to {MAX_IMAGES} images. Currently using {images.length}/{MAX_IMAGES} slots.
                                        {remainingSlots > 0 && ` (${remainingSlots} ${remainingSlots === 1 ? 'slot' : 'slots'} remaining)`}
                                    </p>
                                </div>
                            </div>

                            {selectedIndex !== null && images.length > 0 && (
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

                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-4 py-2 rounded-full">
                                        {selectedIndex + 1} / {images.length}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Bank Create/Edit Modal */}
                <Dialog open={isBankModalOpen} onOpenChange={setIsBankModalOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle className="text-md font-normal">{editingBank ? 'Edit Bank Account' : 'Add Bank Account'}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 pb-4">
                            <div className="grid gap-2">
                                <Label htmlFor="bank_name">Bank Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="bank_name"
                                    placeholder="Enter bank name..."
                                    value={bankFormData.bank_name}
                                    className="text-sm"
                                    onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bank_account_name">Account Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="bank_account_name"
                                    className="text-sm"
                                    placeholder="Enter account holder name..."
                                    value={bankFormData.bank_account_name}
                                    onChange={(e) => setBankFormData({ ...bankFormData, bank_account_name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bank_account_number">Account Number <span className="text-red-500">*</span></Label>
                                <Input
                                    type="number"
                                    className="text-sm"
                                    id="bank_account_number"
                                    placeholder="Enter account number..."
                                    value={bankFormData.bank_account_number}
                                    onChange={(e) => setBankFormData({ ...bankFormData, bank_account_number: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>QR Code Image (Optional)</Label>
                                <input
                                    type="file"
                                    ref={qrCodeInputRef}
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleQrCodeFileChange}
                                />
                                {qrCodePreview ? (
                                    <div className="relative w-32 h-32 border rounded-lg overflow-hidden group">
                                        <img
                                            src={qrCodePreview}
                                            alt="QR Code Preview"
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                className="p-1.5 bg-white rounded-full text-rose-500 hover:bg-rose-50"
                                                onClick={() => qrCodeInputRef.current?.click()}
                                            >
                                                <Upload size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                className="p-1.5 bg-white rounded-full text-red-500 hover:bg-red-50"
                                                onClick={handleRemoveQrCode}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        className="mt-2 w-full h-32 border border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-colors"
                                        onClick={() => qrCodeInputRef.current?.click()}
                                    >
                                        <Upload className="w-6 h-6 text-gray-400" />
                                        <span className="text-xs text-gray-500">Upload QR</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseBankModal}
                                disabled={isBankSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-rose-500 hover:bg-rose-600 text-white"
                                onClick={handleBankFormSubmit}
                                disabled={!bankFormData.bank_name || !bankFormData.bank_account_name || !bankFormData.bank_account_number || isBankSubmitting}
                            >
                                {isBankSubmitting ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        {editingBank ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    editingBank ? 'Update Bank' : 'Add Bank'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Bank Confirmation Modal */}
                <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-md font-normal text-red-600">Delete Bank Account</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this bank account? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        {bankToDelete && (
                            <div className="py-4">
                                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-gray-500" />
                                        <span className="font-medium text-sm">{bankToDelete.bank_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <CreditCard className="w-4 h-4" />
                                        <span>{bankToDelete.bank_account_name}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 font-mono">
                                        {bankToDelete.bank_account_number}
                                    </div>
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCloseDeleteBankModal}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={handleConfirmDeleteBank}
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Bank
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div >
    );
};