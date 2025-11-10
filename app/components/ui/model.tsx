import type { ReactNode, MouseEvent } from "react";

type ModalProps = {
    children: ReactNode;
    onClose: () => void;
    className?: string;
};

export default function Modal({ children, onClose, className }: ModalProps) {
    const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
        onClose();
    };

    const handleModalClick = (event: MouseEvent<HTMLDivElement>) => {
        event.stopPropagation();
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-20 backdrop-blur-sm border"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
        >
            <div
                className={`bg-white rounded shadow p-2 sm:p-6 animate-fade-in overflow-y-auto ${className ?? "max-w-lg w-full"}`}
                onClick={handleModalClick}
            >
                {children}
            </div>
        </div>
    );
}
