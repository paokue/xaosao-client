import React, { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { useLoaderData, Form, useActionData, useNavigation, redirect } from "react-router";
import { CheckCircle, DollarSign, Clock, X, Check } from "lucide-react";
import { requireModelSession } from "~/services/model-auth.server";
import { getServicesForModel, applyForService } from "~/services/model.server";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export const meta: MetaFunction = () => {
  return [
    { title: "Services - XaoSao Model" },
    { name: "description", content: "Browse and apply for available services" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const modelId = await requireModelSession(request);
  const services = await getServicesForModel(modelId);
  return { services };
}

export async function action({ request }: ActionFunctionArgs) {
  const modelId = await requireModelSession(request);
  const formData = await request.formData();

  const serviceId = formData.get("serviceId");
  const customRate = formData.get("customRate");
  const minSessionDuration = formData.get("minSessionDuration");
  const maxSessionDuration = formData.get("maxSessionDuration");
  const notes = formData.get("notes");

  if (!serviceId || !customRate) {
    return {
      success: false,
      error: "Service ID and custom rate are required",
    };
  }

  try {
    await applyForService(modelId, String(serviceId), {
      customRate: Number(customRate),
      isAvailable: true,
      minSessionDuration: minSessionDuration ? Number(minSessionDuration) : 0,
      maxSessionDuration: maxSessionDuration ? Number(maxSessionDuration) : 0,
      notes: notes ? String(notes) : undefined,
    });

    return redirect("/model/services?success=true");
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to apply for service",
    };
  }
}

export default function ModelServicesPage() {
  const { services } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [selectedService, setSelectedService] = useState<any>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const handleApplyClick = (service: any) => {
    setSelectedService(service);
    setShowApplyModal(true);
  };

  const handleCloseModal = () => {
    setShowApplyModal(false);
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Services</h1>
          <p className="mt-2 text-gray-600">
            Browse and apply for services you want to offer to customers
          </p>
        </div>

        {/* Success Message */}
        {new URLSearchParams(window.location.search).get("success") === "true" && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-green-800 font-medium">Application Submitted!</h3>
              <p className="text-green-700 text-sm mt-1">
                Your service application has been submitted successfully. You can now offer this service to customers.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {actionData?.error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <X className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700 text-sm mt-1">{actionData.error}</p>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <div
                key={service.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  {/* Service Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {service.name}
                      </h3>
                      {service.hasApplied && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Check className="w-3 h-3 mr-1" />
                          Applied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description || "No description available"}
                  </p>

                  {/* Rates Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-pink-500 mr-2" />
                      <span className="text-gray-600">Base Rate:</span>
                      <span className="ml-auto font-semibold text-gray-900">
                        ${service.baseRate.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <DollarSign className="w-4 h-4 text-purple-500 mr-2" />
                      <span className="text-gray-600">Commission:</span>
                      <span className="ml-auto font-semibold text-gray-900">
                        {service.commission}%
                      </span>
                    </div>
                    {service.hasApplied && service.modelService && (
                      <div className="flex items-center text-sm pt-2 border-t border-gray-100">
                        <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-gray-600">Your Rate:</span>
                        <span className="ml-auto font-semibold text-green-600">
                          ${service.modelService.customRate.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleApplyClick(service)}
                    className={`w-full py-2.5 px-4 rounded-lg font-medium transition-colors ${
                      service.hasApplied
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"
                    }`}
                  >
                    {service.hasApplied ? "Update Application" : "Apply Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Clock className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Available</h3>
            <p className="text-gray-500">
              There are no services available at the moment. Please check back later.
            </p>
          </div>
        )}

        {/* Apply Modal */}
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900">
                {selectedService?.hasApplied ? "Update Service Application" : "Apply for Service"}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedService?.name}
              </DialogDescription>
            </DialogHeader>

            <Form method="post" className="space-y-4" onSubmit={handleCloseModal}>
              <input type="hidden" name="serviceId" value={selectedService?.id} />

              {/* Service Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Rate:</span>
                  <span className="font-medium text-gray-900">
                    ${selectedService?.baseRate.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Platform Commission:</span>
                  <span className="font-medium text-gray-900">
                    {selectedService?.commission}%
                  </span>
                </div>
              </div>

              {/* Custom Rate */}
              <div>
                <label htmlFor="customRate" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Custom Rate <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="number"
                    id="customRate"
                    name="customRate"
                    step="0.01"
                    min="0"
                    required
                    defaultValue={selectedService?.modelService?.customRate || selectedService?.baseRate}
                    placeholder="Enter your rate"
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Set your rate for this service (minimum: ${selectedService?.baseRate.toFixed(2)})
                </p>
              </div>

              {/* Session Duration Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="minSessionDuration" className="block text-sm font-medium text-gray-700 mb-1">
                    Min Duration (min)
                  </label>
                  <input
                    type="number"
                    id="minSessionDuration"
                    name="minSessionDuration"
                    min="0"
                    defaultValue={selectedService?.modelService?.minSessionDuration || 0}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="maxSessionDuration" className="block text-sm font-medium text-gray-700 mb-1">
                    Max Duration (min)
                  </label>
                  <input
                    type="number"
                    id="maxSessionDuration"
                    name="maxSessionDuration"
                    min="0"
                    defaultValue={selectedService?.modelService?.maxSessionDuration || 0}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={selectedService?.modelService?.notes || ""}
                  placeholder="Any special requirements or notes about this service..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Saving..." : selectedService?.hasApplied ? "Update" : "Apply"}
                </button>
              </div>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
