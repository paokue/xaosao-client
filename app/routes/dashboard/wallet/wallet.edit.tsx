import React, { useState } from "react"
import type { Route } from "./+types/wallet.edit"
import { AlertCircle, ArrowLeft, FileText, LoaderCircle, Upload } from "lucide-react"
import { Form, redirect, useActionData, useLoaderData, useNavigate, useNavigation, type LoaderFunctionArgs } from "react-router"

// components
import Modal from "~/components/ui/model"
import { Button } from "~/components/ui/button"

// utils and service
import { downloadImage } from "~/utils/functions/download"
import { capitalize, extractFilenameFromCDNSafe } from "~/utils/functions/textFormat"
import { deleteFileFromBunny, uploadFileToBunnyServer } from "~/services/upload.server"
import type { ITransactionCredentials, ITransactionResponse } from "~/interfaces/transaction"
import { getTransaction, requireUserSession, updateTransaction, validateTopUpInputs } from "~/services"
import { formatCurrency, parseFormattedNumber } from "~/utils"

export async function loader({ params, request }: LoaderFunctionArgs) {
   const customerId = await requireUserSession(request);
   const transaction = await getTransaction(params.transactionId!, customerId);
   return transaction;
}

export async function action({ params, request }: Route.ActionArgs) {
   const customerId = await requireUserSession(request)
   const transactionId = params.transactionId || "";
   const formData = await request.formData();
   const transactionData = Object.fromEntries(formData) as Partial<ITransactionCredentials>;

   const file = formData.get("paymentSlip") as File | null;
   const originPaymentSlip = formData.get("originPaymentSlip");

   if (request.method === "PATCH") {
      try {
         if (file && file instanceof File && file.size > 0) {
            if (originPaymentSlip) {
               await deleteFileFromBunny(extractFilenameFromCDNSafe(originPaymentSlip as string))
            }
            const buffer = Buffer.from(await file.arrayBuffer());
            const url = await uploadFileToBunnyServer(buffer, file.name, file.type);
            transactionData.paymentSlip = url;

         } else {
            transactionData.paymentSlip = formData.get("originPaymentSlip") as string;
         }

         transactionData.amount = parseFormattedNumber(transactionData.amount);

         await validateTopUpInputs(transactionData as ITransactionCredentials);

         const res = await updateTransaction(transactionId, customerId, transactionData as ITransactionCredentials);
         if (res.id) {
            return redirect(`/dashboard/wallets?toastMessage=Update+your+transaction+successfully!&toastType=success`);
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
            message: error || "Failed to edit top-up information!",
         };
      }
   }
   return { success: false, error: true, message: "Invalid request method!" };
}

export default function TransactionEdit() {
   const navigate = useNavigate();
   const navigation = useNavigation();
   const actionData = useActionData<typeof action>()
   const [amount, setAmount] = React.useState<number>(0);
   const transaction = useLoaderData<ITransactionResponse>();
   const isSubmitting =
      navigation.state !== "idle" && navigation.formMethod === "PATCH";

   const [previewSlip, setPreviewSlip] = useState<string | null>(null);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);

   const handleDownloadSlip = async () => {
      if (transaction?.paymentSlip) {
         downloadImage(transaction.paymentSlip, `payment-slip-${transaction.identifier}.jpg`);
      }
   };

   function closeHandler() {
      navigate("/dashboard/wallets");
   }

   // When user uploads a new file
   function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) {
         setSelectedFile(file); // Store the actual file

         const reader = new FileReader();
         reader.onloadend = () => {
            const base64 = reader.result as string;
            setPreviewSlip(base64); // Store base64 for preview only
         };
         reader.readAsDataURL(file);
      }
   }

   // Trigger hidden file input
   const fileInputRef = React.useRef<HTMLInputElement>(null);

   function triggerFileSelect() {
      fileInputRef.current?.click();
   }

   const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

   return (
      <Modal onClose={closeHandler} className="h-screen sm:h-auto w-full sm:w-3/5 py-8 sm:py-4 px-4 border rounded-xl">
         <Form method="patch" className="space-y-4" encType="multipart/form-data">
            <div className="flex items-center justify-start space-x-2" onClick={closeHandler}>
               <ArrowLeft className="block sm:hidden text-gray-500" size={20} />
               <span>Back To Wallet</span>
            </div>

            <div>
               <h3 className="flex items-center text-black text-md font-bold">Transaction Edit</h3>
               <p className="text-gray-500 text-sm ml-2">You can only edit transaction details while it's pending!</p>
            </div>

            <div className="space-y-2 px-2 sm:px-4">
               <div className="space-y-4">
                  <hr />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-sm font-medium text-gray-500">Transaction ID</label>
                        <p className="mt-1 text-sm font-mono">{transaction?.id}</p>
                     </div>
                     <div>
                        <label className="text-sm font-medium text-gray-500">Identifier</label>
                        <p className="mt-1 text-sm font-mono">{transaction?.identifier}</p>
                     </div>
                  </div>
                  <hr />

                  <div className="space-y-4">
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

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between sm:space-x-3 space-y-2 sm:space-y-0">
                     <div className="flex items-center space-x-3">
                        <div>
                           <p className="text-sm font-medium">Payment Slip</p>
                           {previewSlip ? (
                              <div>
                                 <img src={previewSlip} alt="New slip preview" className="mt-2 h-28 rounded-md border" />
                                 <p className="text-xs text-green-600 mt-1">New file: {selectedFile?.name}</p>
                              </div>
                           ) : transaction?.paymentSlip ? (
                              <img src={transaction.paymentSlip} alt="Existing slip" className="mt-2 h-28 rounded-md border" />
                           ) : (
                              <p className="text-sm text-gray-500">No slip uploaded</p>
                           )}
                        </div>
                     </div>
                     <div className="flex space-x-2">
                        {transaction?.paymentSlip && !previewSlip && (
                           <Button variant="outline" size="sm" onClick={handleDownloadSlip}>
                              <FileText className="h-3 w-3 mr-1" />
                              Download
                           </Button>
                        )}
                        <Button type="button" variant="outline" size="sm" onClick={triggerFileSelect}>
                           <Upload className="h-3 w-3 mr-1" />
                           Upload New
                        </Button>
                     </div>
                  </div>

                  <input
                     type="file"
                     accept="image/*"
                     ref={fileInputRef}
                     name="paymentSlip"
                     className="hidden"
                     onChange={handleFileChange}
                  />
                  <input className="hidden" name="originPaymentSlip" defaultValue={transaction.paymentSlip} />
               </div>
            </div>

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

            <div className="flex justify-end space-x-2 pt-4">
               <Button
                  type="button"
                  variant="outline"
                  onClick={closeHandler}
                  className="bg-gray-500 text-white hover:bg-gray-600 hover:text-white"
               >
                  Close
               </Button>
               <Button
                  type="submit"
                  variant="outline"
                  className="flex gap-2 bg-rose-500 text-white hover:bg-rose-600 hover:text-white"
               >
                  {isSubmitting && <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />}
                  {isSubmitting ? "Saving...." : "Save Change"}
               </Button>
            </div>
         </Form>
      </Modal>
   )
}