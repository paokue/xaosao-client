import { useEffect } from "react";
import { X } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router";

type ToastType = "success" | "error" | "warning";

const toastStyles: Record<ToastType, string> = {
   success: "bg-green-100 border-green-500 text-green-700",
   error: "bg-red-100 border-red-500 text-red-700",
   warning: "bg-yellow-100 border-yellow-500 text-yellow-700",
};

export default function Toast() {
   const [searchParams] = useSearchParams();
   const navigate = useNavigate();

   const message = searchParams.get("toastMessage");
   const type = (searchParams.get("toastType") as ToastType) || "success";
   const duration = Number(searchParams.get("toastDuration")) || 3000;

   useEffect(() => {
      if (message) {
         const timer = setTimeout(() => {
            searchParams.delete("toastMessage");
            searchParams.delete("toastType");
            searchParams.delete("toastDuration");
            navigate({ search: searchParams.toString() }, { replace: true });
         }, duration);

         return () => clearTimeout(timer);
      }
   }, [message, duration, navigate, searchParams]);

   if (!message) return null;

   return (
      <div
         className={`fixed bottom-6 right-4 z-50 flex items-center gap-2 px-6 py-3 border-l-4 rounded-md shadow-md transition-all ${toastStyles[type]}`}
      >
         <span className="text-md font-medium">{message}</span>
         <button
            onClick={() => {
               searchParams.delete("toastMessage");
               searchParams.delete("toastType");
               searchParams.delete("toastDuration");
               navigate({ search: searchParams.toString() }, { replace: true });
            }}
         >
            <X size={16} />
         </button>
      </div>
   );
}
