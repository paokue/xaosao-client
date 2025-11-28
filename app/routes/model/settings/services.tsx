import { useState, useEffect } from "react";
import type { MetaFunction } from "react-router";
import { Link, Form, useLoaderData, useNavigation } from "react-router";
import { ArrowLeft, Briefcase, Plus, Check, X, DollarSign, Loader } from "lucide-react";

export const meta: MetaFunction = () => {
  return [
    { title: "Services - Model Settings" },
    { name: "description", content: "Manage your service offerings" },
  ];
};

interface Service {
  id: string;
  name: string;
  description: string | null;
  baseRate: number;
  commission: number;
  status: string;
  isApplied: boolean;
  modelServiceId: string | null;
  customRate: number | null;
  isAvailable: boolean;
}

interface LoaderData {
  services: Service[];
}

export { loader, action } from "./services.server";

export default function ServicesSettings() {
  const { services } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [applyModal, setApplyModal] = useState<Service | null>(null);
  const [cancelModal, setCancelModal] = useState<Service | null>(null);
  const [customRate, setCustomRate] = useState<string>("");

  // Close modals when form submission starts
  useEffect(() => {
    if (isSubmitting) {
      setApplyModal(null);
      setCancelModal(null);
    }
  }, [isSubmitting]);

  return (
    <div className="p-4 lg:p-0">
      <div className="mb-6 lg:hidden">
        <Link
          to="/model/settings"
          className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Settings</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-lg">
            <Briefcase className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              Services Apply
            </h1>
            <p className="text-sm text-gray-600">Apply for services to start earning</p>
          </div>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center">
          <Briefcase className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No services available</p>
          <p className="text-sm text-gray-500">
            Check back later for new service opportunities
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={`rounded-sm shadow-sm overflow-hidden transition-all hover:shadow-lg space-y-2 py-4 ${service.isApplied ? "border border-rose-500" : "bg-white border"
                }`}
            >
              <div className={`px-4 ${service.isApplied ? "text-rose-500" : ""}`}>
                <div className="flex items-center justify-start gap-4">
                  <h3 className={`text-md mb-1 text-rose-500}`}>
                    {service.name}
                  </h3>
                  {service.isApplied && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 backdrop-blur-sm rounded-sm text-xs text-rose-500">
                      <Check className="w-3 h-3" />
                      Applied
                    </span>
                  )}
                </div>
              </div>

              <div className="px-4">
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {service.description || "No description available"}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Base Rate:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {service.baseRate.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-semibold text-rose-600">
                      {service.commission}%
                    </span>
                  </div>
                  {service.isApplied && service.customRate && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <span className="text-gray-600">Your Rate:</span>
                      <span className="font-bold text-rose-600 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {service.customRate.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center my-6">
                  {service.isApplied ? (
                    <button
                      type="button"
                      onClick={() => setCancelModal(service)}
                      className="cursor-pointer text-sm w-full flex items-center justify-center gap-2 px-6 py-1.5 text-white rounded-md bg-rose-500 hover:bg-red-600 border border-rose-500"
                    >
                      <X className="w-4 h-4" />
                      Cancel Service
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setApplyModal(service);
                        setCustomRate(service.baseRate.toString());
                      }}
                      className="cursor-pointer text-sm w-full flex items-center justify-center gap-2 px-6 py-1.5 rounded-md border border-rose-300 text-rose-500"
                    >
                      <Plus className="w-4 h-4" />
                      Apply Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-6">
        <div className="flex items-start gap-3">
          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-md text-blue-600 font-medium mb-1">About Services</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Apply for services you want to offer to customers</li>
              <li>• Set your custom rate and availability after approval</li>
              <li>• Commission is deducted from each booking</li>
              <li>• You can cancel your application anytime</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {applyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 py-8">
          <div className="bg-white rounded-md shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md text-gray-900">Apply for Service</h2>
                <button
                  onClick={() => setApplyModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-rose-50 rounded-sm">
                <h3 className="font-semibold text-rose-600 mb-2">{applyModal.name}</h3>
                <p className="text-sm text-gray-700 mb-3">
                  {applyModal.description || "No description available"}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Rate:</span>
                    <span className="font-semibold flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {applyModal.baseRate.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Commission:</span>
                    <span className="font-semibold text-rose-600">
                      {applyModal.commission}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Custom Rate Input */}
              <Form method="post">
                <input type="hidden" name="serviceId" value={applyModal.id} />
                <input type="hidden" name="actionType" value="apply" />

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Custom Rate <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      name="customRate"
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      step="0.01"
                      min="0"
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      placeholder="Enter your rate"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setApplyModal(null)}
                    className="cursor-pointer text-sm flex-1 px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="cursor-pointer text-sm flex-1 px-4 py-1.5 bg-rose-500 text-white rounded-lg"
                  >
                    {isSubmitting ? <Loader size={18} /> : null}
                    {isSubmitting ? "Applying..." : "Save & Apply"}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-sm shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-md text-gray-900">Cancel Service</h2>
                <button
                  onClick={() => setCancelModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-red-50 border border-red-200 rounded-sm p-4 mb-4">
                  <p className="text-sm text-red-600">
                    Are you sure you want to cancel your application for{" "}
                    <span className="font-semibold">{cancelModal.name}</span>?
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  This will remove your custom rate and make you unavailable for this service.
                  You can always re-apply later.
                </p>
              </div>

              <Form method="post">
                <input type="hidden" name="serviceId" value={cancelModal.id} />
                <input type="hidden" name="actionType" value="cancel" />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCancelModal(null)}
                    className="text-sm flex-1 px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Keep Service
                  </button>
                  <button
                    type="submit"
                    className="text-sm flex-1 px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                  >
                    {isSubmitting ? <Loader size={18} /> : null}
                    {isSubmitting ? "Closing..." : "Confirm Cancel"}
                  </button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
