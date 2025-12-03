import React, { useState } from 'react';
import { Layers, ExternalLink, CheckCircle, Loader } from 'lucide-react';

interface TelegramBlockScreenProps {
    onValidate: () => Promise<boolean>;
}

const TelegramBlockScreen: React.FC<TelegramBlockScreenProps> = ({ onValidate }) => {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');

    const handleValidate = async () => {
        setIsValidating(true);
        setError('');

        try {
            const result = await onValidate();
            if (!result) {
                setError('Você ainda não está no grupo. Por favor, entre no grupo e tente novamente.');
            }
        } catch (err) {
            setError('Erro ao validar. Tente novamente.');
        } finally {
            setIsValidating(false);
        }
    };

    const TELEGRAM_GROUP_LINK = 'https://t.me/microsaaspro';

    return (
        <div className="fixed inset-0 z-50 min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 overflow-y-auto">
            <div className="max-w-lg w-full my-8">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
                    {/* Logo */}
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                            <Layers className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-gray-900">
                        Entre na Comunidade
                    </h1>

                    {/* Description */}
                    <p className="text-center text-gray-600 mb-8 leading-relaxed">
                        O acesso à Garagem é <span className="font-semibold text-gray-900">exclusivo para membros</span> da nossa comunidade no Telegram.
                    </p>

                    {/* Steps */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0">
                                1
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-1">Entre no grupo</p>
                                <p className="text-sm text-gray-600">Clique no botão abaixo para acessar o grupo Micro SaaS Pro</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0">
                                2
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 mb-1">Valide seu acesso</p>
                                <p className="text-sm text-gray-600">Após entrar, clique em "Validar Acesso" para liberar a plataforma</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="space-y-3">
                        <a
                            href={TELEGRAM_GROUP_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 group"
                        >
                            Entrar no Grupo
                            <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </a>

                        <button
                            onClick={handleValidate}
                            disabled={isValidating}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isValidating ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    Validando...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    Já entrei, validar agora
                                </>
                            )}
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Info */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                        <p className="font-semibold mb-2">O que você ganha no grupo:</p>
                        <ul className="space-y-1 text-blue-700">
                            <li>✓ Networking com founders brasileiros</li>
                            <li>✓ Feedback direto e rápido</li>
                            <li>✓ Oportunidades de parcerias</li>
                            <li>✓ Eventos e conteúdos exclusivos</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-6">
                    Problemas para validar? Entre em contato com o suporte.
                </p>
            </div>
        </div>
    );
};

export default TelegramBlockScreen;
