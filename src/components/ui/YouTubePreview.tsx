
import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { VideoModal } from './VideoModal';

interface YouTubePreviewProps {
  url: string | null | undefined;
  className?: string;
}

/**
 * Extrai o ID do vídeo do YouTube de vários formatos de URL.
 * Suporta: watch, shorts, live, embed, youtu.be, parâmetros desordenados.
 */
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;

  // Regex ultra-robusta para capturar IDs de 11 caracteres
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|live\/)|(?:(?:watch)?\?v(?:i)?=|&v(?:i)?=))([^#&\?]*).*/;
  const match = url.match(regExp);

  // Garante que capturou algo e que tem o tamanho padrão de um ID do YT (11 chars)
  return (match && match[1].length === 11) ? match[1] : null;
}

export const YouTubePreview: React.FC<YouTubePreviewProps> = ({ url, className = '' }) => {
  const videoId = getYouTubeVideoId(url || '');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isModalOpen]);

  if (!videoId) return null;

  // URLs de thumbnail: hqdefault é um bom balanço, mqdefault é mais leve
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <>
      <div
        className={`relative group cursor-pointer rounded-xl overflow-hidden bg-black border border-gray-200 mt-4 ${className}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
      >
        <div className="relative aspect-video w-full bg-black">
          <img
            src={thumbnailUrl}
            alt="Video thumbnail"
            className="w-full h-full object-cover opacity-90 group-hover:opacity-75 transition-opacity"
            onError={(e) => {
              // Fallback para a imagem padrão se a HQ não existir (comum em vídeos muito novos)
              e.currentTarget.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
            }}
          />

          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-14 w-14 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg backdrop-blur-sm border border-white/20">
              <Play className="h-6 w-6 text-white fill-white ml-1" />
            </div>
          </div>

          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1.5 border border-white/10">
            <Play className="h-2 w-2 fill-white" />
            ASSISTIR
          </div>
        </div>
      </div>

      <VideoModal
        videoId={videoId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
