import React, { useState } from 'react';
import { Construction, Clock, ArrowRight, Lock } from 'lucide-react';
import { usePlatformSettings } from '../hooks/use-platform-settings';
import AuthModal from '../features/auth/AuthModal';

export const MaintenancePage: React.FC = () => {
    const { data: settings } = usePlatformSettings();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-zinc-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                    <div className="relative z-10 flex justify-center mb-6">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
                            <Construction className="w-10 h-10 text-yellow-400" />
                        </div>
                    </div>
                    <h1 className="relative z-10 text-2xl font-bold text-white mb-2">Em Manutenção</h1>
                    <p className="relative z-10 text-zinc-400 text-sm">Estamos fazendo melhorias na plataforma.</p>
                </div>

                <div className="p-8">
                    <div className="space-y-6">
                        <div className="flex items-start gap-4 p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h3 className="font-bold text-yellow-800 text-sm">Voltaremos em breve</h3>
                                <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                                    Nossa equipe está trabalhando em atualizações importantes. Agradecemos sua paciência.
                                </p>
                            </div>
                        </div>

                        {settings?.global_announcement && (
                            <div className="text-center">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-2">Mensagem da Equipe</p>
                                <p className="text-sm text-gray-600 italic">"{settings.global_announcement}"</p>
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                            <a href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-900 hover:text-zinc-600 transition-colors">
                                <ArrowRight className="w-4 h-4" /> Recarregar
                            </a>

                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1 transition-colors"
                            >
                                <Lock className="w-3 h-3" /> Admin Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-xs text-gray-400 font-mono">
                System Status: MAINTENANCE_MODE_ACTIVE
            </p>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};
