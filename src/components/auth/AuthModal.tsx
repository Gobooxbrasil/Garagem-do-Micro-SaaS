import React from 'react';
import { X, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    message?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, message = "Para realizar esta ação, você precisa estar logado." }) => {
    const { signInWithGoogle } = useAuth();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900">Login Necessário</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn className="w-8 h-8 text-blue-600" />
                    </div>

                    <p className="text-gray-600 mb-8 text-lg">
                        {message}
                    </p>

                    <button
                        onClick={() => {
                            signInWithGoogle();
                            onClose();
                        }}
                        className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <img
                            src="https://www.google.com/favicon.ico"
                            alt="Google"
                            className="w-5 h-5"
                        />
                        Entrar com Google
                    </button>

                    <button
                        onClick={onClose}
                        className="mt-4 text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
