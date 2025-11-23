
import React, { useState } from 'react';
import { Share2, Check, Copy, Link as LinkIcon, Twitter, Linkedin, Smartphone } from 'lucide-react';
import { Idea } from '../types';

interface ShareButtonProps {
  idea: Idea;
  variant?: 'card' | 'full';
}

const ShareButton: React.FC<ShareButtonProps> = ({ idea, variant = 'card' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Como é SPA, usamos query params para simular link direto
  const shareUrl = `${window.location.origin}/?idea=${idea.id}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (platform: 'whatsapp' | 'twitter' | 'linkedin') => {
    const text = `Confira o projeto "${idea.title}" na Garagem do Micro SaaS! 🚀`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareUrl);

    let url = '';
    switch(platform) {
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
    }
    window.open(url, '_blank');
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'card') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="p-2 text-gray-400 hover:text-apple-blue hover:bg-blue-50 rounded-full transition-all"
          title="Compartilhar"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-2 animate-in fade-in zoom-in-95">
             <div className="flex gap-1 mb-2">
                 <button onClick={() => handleShare('whatsapp')} className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 p-2 rounded-lg transition-colors flex justify-center"><Smartphone className="w-4 h-4" /></button>
                 <button onClick={() => handleShare('twitter')} className="flex-1 bg-sky-50 hover:bg-sky-100 text-sky-500 p-2 rounded-lg transition-colors flex justify-center"><Twitter className="w-4 h-4" /></button>
                 <button onClick={() => handleShare('linkedin')} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 p-2 rounded-lg transition-colors flex justify-center"><Linkedin className="w-4 h-4" /></button>
             </div>
             <button 
                onClick={handleCopy}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 transition-colors"
             >
                <span className="truncate max-w-[120px]">{shareUrl}</span>
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
             </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4" /> Compartilhar Projeto
      </button>
      {/* Implement full dropdown if needed, currently reusing logic via modal or simple button action */}
      {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-3 animate-in fade-in zoom-in-95">
             <div className="grid grid-cols-3 gap-2 mb-3">
                 <button onClick={() => handleShare('whatsapp')} className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg text-xs text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600"><Smartphone className="w-4 h-4" /></div>
                    WhatsApp
                 </button>
                 <button onClick={() => handleShare('twitter')} className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg text-xs text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-500"><Twitter className="w-4 h-4" /></div>
                    Twitter
                 </button>
                 <button onClick={() => handleShare('linkedin')} className="flex flex-col items-center gap-1 p-2 hover:bg-gray-50 rounded-lg text-xs text-gray-600">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Linkedin className="w-4 h-4" /></div>
                    LinkedIn
                 </button>
             </div>
             <button 
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors border border-gray-200"
             >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
                {copied ? 'Link Copiado!' : 'Copiar Link do Projeto'}
             </button>
          </div>
      )}
    </div>
  );
};

export default ShareButton;
