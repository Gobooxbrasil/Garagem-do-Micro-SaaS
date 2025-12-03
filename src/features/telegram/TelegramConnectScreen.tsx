import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

const TelegramConnectScreen: React.FC = () => {
    const TELEGRAM_GROUP_LINK = 'https://t.me/microsaaspro';

    const handleContinue = () => {
        // Usuário confirma que tem Telegram, vai direto para tela de entrada no grupo
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                            <Layers className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Bem-vindo à Garagem!
                    </h1>

                    {/* Description */}
                    <p className="text-center text-gray-600 mb-8 leading-relaxed">
                        Para acessar a plataforma, você precisa ser membro da nossa <span className="font-semibold text-gray-900">comunidade exclusiva no Telegram</span>.
                    </p>

                    {/* Steps */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-1">Entre no grupo</p>
                                <p className="text-sm text-gray-600">Acesse o grupo Micro SaaS Pro no Telegram</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-1">Valide seu acesso</p>
                                <p className="text-sm text-gray-600">Clique em "Continuar" após entrar no grupo</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <a
                        href={TELEGRAM_GROUP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 mb-4"
                    >
                        Entrar no Grupo Telegram
                        <ArrowRight className="w-5 h-5" />
                    </a>

                    <button
                        onClick={handleContinue}
                        className="w-full bg-black hover:bg-gray-800 text-white px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                    >
                        Já entrei, continuar
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    {/* Info */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        <p className="font-semibold mb-2">Por que Telegram?</p>
                        <ul className="space-y-1 text-blue-700">
                            <li>✓ Acesso exclusivo à comunidade</li>
                            <li>✓ Conexão direta com founders</li>
                            <li>✓ Networking e oportunidades</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TelegramConnectScreen;
