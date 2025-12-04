import React, { useState, useEffect } from 'react';
import { Layers, ExternalLink, CheckCircle, Loader, QrCode, Smartphone, LogOut, Send } from 'lucide-react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthProvider';

interface TelegramBlockScreenProps {
    onValidate: () => Promise<boolean>;
}

const TelegramBlockScreen: React.FC<TelegramBlockScreenProps> = ({ onValidate }) => {
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [showQrCode, setShowQrCode] = useState(false);

    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const { signOut } = useAuth();

    const TELEGRAM_GROUP_LINK = 'https://t.me/microsaaspro';

    useEffect(() => {
        QRCode.toDataURL(TELEGRAM_GROUP_LINK)
            .then(url => setQrCodeUrl(url))
            .catch(err => console.error('Error generating QR code:', err));
    }, []);

    const handleValidate = async () => {
        setIsValidating(true);
        setError('');

        try {
            const result = await onValidate();
            if (!result) {
                setError('Você ainda não está no grupo do Telegram. Por favor, entre no grupo usando o botão acima e tente novamente.');
            }
        } catch (err) {
            console.error('Validation error:', err);
            setError('Erro ao validar. Verifique se você conectou sua conta do Telegram e está no grupo.');
        } finally {
            setIsValidating(false);
        }
    };



    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-white to-gray-50 overflow-y-auto">
            <div className="min-h-full flex items-center justify-center px-4 py-6">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                        {/* Logo */}
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg">
                                <Layers className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-center mb-2 text-gray-900">
                            Entre na Comunidade
                        </h1>

                        {/* Description */}
                        <p className="text-center text-gray-600 mb-4 text-sm leading-relaxed">
                            O acesso à Garagem é <span className="font-semibold text-gray-900">exclusivo e gratuito</span> para membros da nossa comunidade no Telegram.
                        </p>

                        {/* Steps */}
                        <div className="space-y-2 mb-4">
                            <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                                    1
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Entre no grupo</p>
                                    <p className="text-xs text-gray-600">Clique no botão abaixo para acessar o grupo Micro SaaS Pro</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                                    2
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm mb-0.5">Valide seu acesso</p>
                                    <p className="text-xs text-gray-600">Após entrar, clique em "Validar Acesso" para liberar a plataforma</p>
                                </div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="space-y-2">
                            <a
                                href={TELEGRAM_GROUP_LINK}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 group"
                            >
                                Entrar no Grupo
                                <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </a>

                            <button
                                onClick={handleValidate}
                                disabled={isValidating}
                                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader className="w-4 h-4 animate-spin" />
                                        Validando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Já entrei, validar agora
                                    </>
                                )}
                            </button>


                            <button
                                onClick={() => setShowQrCode(!showQrCode)}
                                className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-xl font-medium text-sm transition-all hidden md:flex items-center justify-center gap-2"
                            >
                                {showQrCode ? (
                                    <>
                                        <Smartphone className="w-4 h-4" />
                                        Esconder QR Code
                                    </>
                                ) : (
                                    <>
                                        <QrCode className="w-4 h-4" />
                                        Validar pelo celular
                                    </>
                                )}
                            </button>

                            {showQrCode && qrCodeUrl && (
                                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center animate-in fade-in slide-in-from-top-2">
                                    <img src={qrCodeUrl} alt="QR Code para grupo Telegram" className="w-48 h-48" />
                                    <p className="text-xs text-gray-500 mt-2 text-center">
                                        Aponte a câmera do seu celular para entrar no grupo
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                                {error}
                            </div>
                        )}

                        {/* Info */}
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
                            <p className="font-semibold mb-1">O que você ganha no grupo:</p>
                            <ul className="space-y-0.5 text-blue-700">
                                <li>✓ Networking com founders brasileiros</li>
                                <li>✓ Feedback direto e rápido</li>
                                <li>✓ Oportunidades de parcerias</li>
                                <li>✓ Eventos e conteúdos exclusivos</li>
                            </ul>
                        </div>

                        <button
                            onClick={signOut}
                            className="mt-6 w-full text-center text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1"
                        >
                            <LogOut className="w-3 h-3" /> Sair da conta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TelegramBlockScreen;
