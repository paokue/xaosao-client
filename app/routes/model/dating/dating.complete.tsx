import { AlertCircle, CheckCircle2, Loader, Wallet } from "lucide-react";
import { Form, redirect, useActionData, useNavigate, useNavigation, useParams, type ActionFunctionArgs } from "react-router";

// components
import Modal from "~/components/ui/model";
import { Button } from "~/components/ui/button";
import { requireModelSession } from "~/services/model-auth.server";
import { capitalize } from "~/utils/functions/textFormat";
import { completeBooking } from "~/services/booking.server";

export async function action({ params, request }: ActionFunctionArgs) {
   const { id } = params;
   const modelId = await requireModelSession(request);

   if (!modelId) {
      throw new Response("Model ID is required", { status: 400 });
   }

   if (request.method === "POST") {
      try {
         const res = await completeBooking(id!, modelId);
         if (res.id) {
            return redirect(`/model/dating?toastMessage=Booking+completed+successfully!+Payment+has+been+released+to+your+wallet.&toastType=success`);
         }
      } catch (error: any) {
         if (error?.payload) {
            return error.payload;
         }
         return {
            success: false,
            error: true,
            message: error?.message || "Failed to complete booking!",
         };
      }
   }

   return { success: false, error: true, message: "Invalid request method!" };
}

export default function CompleteBookingModal() {
   const { id } = useParams();
   const navigate = useNavigate();
   const navigation = useNavigation();
   const actionData = useActionData<typeof action>()
   const isSubmitting = navigation.state !== 'idle' && navigation.formMethod === "POST";

   function closeHandler() {
      navigate("/model/dating");
   }

   return (
      <Modal onClose={closeHandler} className="w-11/12 sm:w-2/5 rounded-sm border p-6">
         <h1 className="text-md font-bold">Complete Booking</h1>
         <p className="hidden sm:block text-sm text-gray-500 my-2">
            Mark this booking as completed after finishing the service.
            <span className="font-bold text-primary"> "{id}"</span>
         </p>
         <Form method="post" className="space-y-4 mt-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
               <div className="flex items-start space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                     <p className="font-medium">Confirm Completion</p>
                     <p>By marking this booking as completed, you confirm that the service has been successfully delivered to the customer.</p>
                  </div>
               </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
               <div className="flex items-start space-x-2">
                  <Wallet className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <div className="text-sm text-emerald-800">
                     <p className="font-medium">Payment Release</p>
                     <p>The payment will be released from escrow and deposited into your wallet immediately after completion.</p>
                  </div>
               </div>
            </div>

            <div>
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
               <Button type="button" variant="outline" onClick={closeHandler}>
                  Close
               </Button>
               <Button type="submit" disabled={isSubmitting} className="text-white bg-rose-500 hover:bg-rose-600">
                  {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
                  Complete & Get Paid
               </Button>
            </div>
         </Form>
      </Modal>
   );
}
