import { AlertCircle, AlertTriangle, Loader } from "lucide-react";
import { Form, redirect, useActionData, useNavigate, useNavigation, useParams, type ActionFunctionArgs } from "react-router";

// components
import Modal from "~/components/ui/model";
import { Button } from "~/components/ui/button";
import { requireModelSession } from "~/services/model-auth.server";
import { capitalize } from "~/utils/functions/textFormat";
import { deleteModelBooking } from "~/services/booking.server";

export async function action({ params, request }: ActionFunctionArgs) {
   const { id } = params;
   const modelId = await requireModelSession(request);

   if (!modelId) {
      throw new Response("Model ID is required", { status: 400 });
   }

   if (request.method === "DELETE") {
      try {
         const res = await deleteModelBooking(id!, modelId);
         if (res.id) {
            return redirect(`/model/dating?toastMessage=Booking+deleted+successfully!&toastType=success`);
         }
      } catch (error: any) {
         if (error?.payload) {
            return error.payload;
         }
         return {
            success: false,
            error: true,
            message: error?.message || "Failed to delete booking!",
         };
      }
   }

   return { success: false, error: true, message: "Invalid request method!" };
}

export default function DeleteBookingModal() {
   const { id } = useParams();
   const navigate = useNavigate();
   const navigation = useNavigation();
   const actionData = useActionData<typeof action>()
   const isSubmitting = navigation.state !== 'idle' && navigation.formMethod === "DELETE";

   function closeHandler() {
      navigate("/model/dating");
   }

   return (
      <Modal onClose={closeHandler} className="w-11/12 sm:w-2/5 rounded-xl border">
         <h1 className="text-md font-bold">Delete Booking</h1>
         <p className="hidden sm:block text-sm text-gray-500 my-2">
            Are you sure you want to delete this booking?
            <span className="font-bold text-primary"> "{id}"</span>
         </p>
         <Form method="delete" className="space-y-4 mt-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
               <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                     <p className="font-medium">Warning: This action cannot be undone</p>
                     <p>Deleting this booking will permanently remove it from your records. This action is only available for rejected bookings.</p>
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
                  Cancel
               </Button>
               <Button type="submit" variant="destructive" disabled={isSubmitting} className="text-white bg-rose-500">
                  {isSubmitting && <Loader className="h-4 w-4 animate-spin" />}
                  Delete Booking
               </Button>
            </div>
         </Form>
      </Modal>
   );
}
