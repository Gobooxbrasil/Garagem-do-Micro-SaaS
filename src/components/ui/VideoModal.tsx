
import React from 'react';
import { X } from 'lucide-react';

interface VideoModalProps {
    videoId: string;
    isOpen: boolean;
    onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({ videoId, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl mx-4 animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors p-2 rounded-full hover:bg-white/10"
                    aria-label="Fechar vídeo"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Video Container */}
                <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                        className="absolute top-0 left-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>

                {/* Instructions */}
                <p className="text-center text-white/60 text-sm mt-4">
                    Pressione <kbd className="px-2 py-1 bg-white/10 rounded text-white/80">ESC</kbd> ou clique fora para fechar
                </p>
            </div>
        </div>
    );
};
