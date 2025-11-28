import { redirect } from "react-router";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { requireModelSession } from "~/services/model-auth.server";
import {
  getServicesForModel,
  applyForService,
  cancelServiceApplication,
} from "~/services/service.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const modelId = await requireModelSession(request);
  const services = await getServicesForModel(modelId);

  return { services };
}

export async function action({ request }: ActionFunctionArgs) {
  const modelId = await requireModelSession(request);
  const formData = await request.formData();

  const serviceId = formData.get("serviceId") as string;
  const actionType = formData.get("actionType") as string;

  if (actionType === "apply") {
    const customRate = parseFloat(formData.get("customRate") as string);
    const result = await applyForService(modelId, serviceId, customRate);
    if (result?.success) {
      return redirect(
        `/model/settings/services?toastMessage=${encodeURIComponent(result.message)}&toastType=success`
      );
    } else {
      return redirect(
        `/model/settings/services?toastMessage=${encodeURIComponent(result?.message || "Failed to apply")}&toastType=error`
      );
    }
  } else if (actionType === "cancel") {
    const result = await cancelServiceApplication(modelId, serviceId);
    if (result?.success) {
      return redirect(
        `/model/settings/services?toastMessage=${encodeURIComponent(result.message)}&toastType=success`
      );
    } else {
      return redirect(
        `/model/settings/services?toastMessage=${encodeURIComponent(result?.message || "Failed to cancel")}&toastType=error`
      );
    }
  }

  return null;
}
