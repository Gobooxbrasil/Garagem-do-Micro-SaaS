import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastItemProps {
    toast: Toast;
    onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onClose]);

    const getToastStyles = () => {
        switch (toast.type) {
            case 'success':
                return {
                    bg: 'bg-green-50 border-green-200',
                    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                    text: 'text-green-900'
                };
            case 'error':
                return {
                    bg: 'bg-red-50 border-red-200',
                    icon: <XCircle className="w-5 h-5 text-red-600" />,
                    text: 'text-red-900'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50 border-yellow-200',
                    icon: <AlertCircle className="w-5 h-5 text-yellow-600" />,
                    text: 'text-yellow-900'
                };
            case 'info':
                return {
                    bg: 'bg-blue-50 border-blue-200',
                    icon: <Info className="w-5 h-5 text-blue-600" />,
                    text: 'text-blue-900'
                };
        }
    };

    const styles = getToastStyles();

    return (
        <div
            className={`${styles.bg} border rounded-xl p-4 shadow-lg backdrop-blur-sm flex items-start gap-3 min-w-[320px] max-w-md animate-in slide-in-from-right-full duration-300`}
        >
            <div className="flex-shrink-0 mt-0.5">
                {styles.icon}
            </div>
            <p className={`flex-1 text-sm font-medium ${styles.text} leading-relaxed`}>
                {toast.message}
            </p>
            <button
                onClick={() => onClose(toast.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: Toast[];
    onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
            <div className="flex flex-col gap-3 pointer-events-auto">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={onClose} />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
