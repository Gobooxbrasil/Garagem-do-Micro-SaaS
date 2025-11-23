
import React from 'react';
import { Idea } from '../types';
import { 
  Heart,
  Flame,
  Activity, 
  PawPrint, 
  GraduationCap, 
  Scale, 
  Code2, 
  Palette, 
  ShoppingCart, 
  Rocket,
  Briefcase,
  Tractor,
  Plane,
  Utensils,
  Truck,
  Trash2,
  Lightbulb,
  DollarSign,
  Gift,
  Lock,
  User
} from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDelete?: (id: string) => void;
  viewMode: 'grid' | 'list';
  onClick: (idea: Idea) => void;
  currentUserId?: string;
}

// Visual Identity Helper
export const getNicheVisuals = (niche: string) => {
    const n = niche.toLowerCase();
    
    // Mapping rules
    if (n.includes('finan') || n.includes('money') || n.includes('banc')) return { icon: DollarSign, bg: 'bg-emerald-100', text: 'text-emerald-600' };
    if (n.includes('saúde') || n.includes('med') || n.includes('health') || n.includes('bem-estar')) return { icon: Activity, bg: 'bg-rose-100', text: 'text-rose-600' };
    if (n.includes('pet') || n.includes('dog') || n.includes('cat') || n.includes('vet')) return { icon: PawPrint, bg: 'bg-orange-100', text: 'text-orange-600' };
    if (n.includes('educa') || n.includes('ensino') || n.includes('escol')) return { icon: GraduationCap, bg: 'bg-blue-100', text: 'text-blue-600' };
    if (n.includes('produt') || n.includes('task') || n.includes('gestão')) return { icon: Rocket, bg: 'bg-yellow-100', text: 'text-yellow-600' };
    if (n.includes('juríd') || n.includes('lei') || n.includes('advoga')) return { icon: Scale, bg: 'bg-slate-100', text: 'text-slate-600' };
    if (n.includes('agro') || n.includes('fazenda')) return { icon: Tractor, bg: 'bg-green-100', text: 'text-green-700' };
    if (n.includes('dev') || n.includes('code') || n.includes('ia') || n.includes('tech')) return { icon: Code2, bg: 'bg-indigo-100', text: 'text-indigo-600' };
    if (n.includes('market') || n.includes('venda')) return { icon: Rocket, bg: 'bg-purple-100', text: 'text-purple-600' };
    if (n.includes('creator') || n.includes('video') || n.includes('design')) return { icon: Palette, bg: 'bg-pink-100', text: 'text-pink-600' };
    if (n.includes('commerce') || n.includes('loja')) return { icon: ShoppingCart, bg: 'bg-sky-100', text: 'text-sky-600' };
    if (n.includes('rh') || n.includes('recursos')) return { icon: Briefcase, bg: 'bg-teal-100', text: 'text-teal-600' };
    if (n.includes('imob') || n.includes('casa')) return { icon: Briefcase, bg: 'bg-amber-100', text: 'text-amber-600' }; 
    if (n.includes('aliment') || n.includes('food')) return { icon: Utensils, bg: 'bg-red-50', text: 'text-red-500' };
    if (n.includes('logíst') || n.includes('transp')) return { icon: Truck, bg: 'bg-cyan-100', text: 'text-cyan-600' };
    if (n.includes('turism') || n.includes('viage')) return { icon: Plane, bg: 'bg-blue-50', text: 'text-blue-500' };

    // Default
    return { icon: Lightbulb, bg: 'bg-gray-100', text: 'text-gray-500' };
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onUpvote, onToggleFavorite, onDelete, viewMode, onClick, currentUserId }) => {
  
  const isList = viewMode === 'list';
  const hasImage = idea.images && idea.images.length > 0 && idea.images[0] !== '';
  const isOwner = currentUserId && idea.user_id === currentUserId;
  const hasVotes = idea.votes_count > 0;
  
  const visuals = getNicheVisuals(idea.niche);
  const VisualIcon = visuals.icon;

  const renderMonetizationBadge = () => {
    if (idea.payment_type === 'paid') {
        return (
            <div className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                <Lock className="w-3 h-3" /> R$ {idea.price}
            </div>
        );
    }
    if (idea.payment_type === 'donation') {
        return (
            <div className="bg-blue-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
                <Gift className="w-3 h-3" /> Apoiar
            </div>
        );
    }
    return null;
  };

  const renderAuthor = () => (
      <div className="flex items-center gap-2 group/author">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
              {idea.profiles?.avatar_url ? (
                  <img src={idea.profiles.avatar_url} alt="Autor" className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-3 h-3" />
                  </div>
              )}
          </div>
          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[80px] group-hover/author:text-gray-600 transition-colors">
              {idea.profiles?.full_name?.split(' ')[0] || 'Anônimo'}
          </span>
      </div>
  );

  // LIST VIEW LAYOUT
  if (isList) {
    return (
      <div 
        onClick={() => onClick(idea)}
        className="group cursor-pointer bg-white rounded-xl p-4 border border-gray-100 hover:border-apple-blue/30 hover:shadow-md transition-all duration-200 flex items-center gap-4"
      >
        {/* Left: Image Thumbnail */}
        <div className={`w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden border border-gray-100 flex items-center justify-center ${hasImage ? 'bg-gray-50' : visuals.bg}`}>
             {hasImage ? (
                 <img src={idea.images![0]} alt={idea.title} className="w-full h-full object-cover" />
             ) : (
                 <VisualIcon className={`w-6 h-6 ${visuals.text}`} />
             )}
        </div>

        {/* Score */}
        <div className="flex flex-col items-center min-w-[3rem]">
             <span className="text-xs font-bold text-gray-400 mb-1">Rank</span>
             <span className={`text-lg font-bold flex items-center gap-1 ${hasVotes ? 'text-orange-500' : 'text-gray-300'}`}>
                {idea.votes_count}
                <Flame className={`w-3 h-3 ${hasVotes ? 'fill-orange-500 animate-pulse' : 'text-gray-300'}`} />
             </span>
        </div>

        {/* Middle: Content */}
        <div className="flex-grow min-w-0 border-l border-gray-100 pl-4">
          <div className="flex items-center gap-2 mb-1">
             <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0 ${visuals.bg} ${visuals.text.replace('text-', 'text-opacity-80 text-')}`}>
              {idea.niche}
            </span>
            {idea.payment_type === 'paid' && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">R$ {idea.price}</span>}
            {idea.isFavorite && <Heart className="w-3 h-3 fill-red-500 text-red-500" />}
          </div>
          <h3 className="text-base font-bold text-apple-text truncate">{idea.title}</h3>
          <div className="flex items-center gap-3 mt-1">
             <p className="text-xs text-gray-500 truncate max-w-[200px]">{idea.pain}</p>
             <span className="text-gray-300 text-[10px]">•</span>
             {renderAuthor()}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
            {isOwner && onDelete && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(idea.id); }}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                    title="Excluir minha ideia"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>
    );
  }

  // GRID VIEW LAYOUT
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 flex flex-col h-full">
      
      {/* Image Header */}
      <div className={`h-32 w-full relative overflow-hidden cursor-pointer ${hasImage ? 'bg-gray-50' : visuals.bg}`} onClick={() => onClick(idea)}>
        {hasImage ? (
             <img src={idea.images![0]} alt={idea.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        ) : (
             <div className="w-full h-full flex items-center justify-center transition-colors">
                  <div className={`flex flex-col items-center gap-2 opacity-80 ${visuals.text} group-hover:scale-110 transition-transform duration-300`}>
                      <VisualIcon className="w-10 h-10" strokeWidth={1.5} />
                  </div>
             </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-b from-black/50 via-black/10 to-transparent z-10 pointer-events-none"></div>
        
        {/* Overlaid Tags (LEFT SIDE) */}
        <div className="absolute top-3 left-3 flex gap-2 z-20">
             {renderMonetizationBadge()}
            <span className="bg-white/90 backdrop-blur-md text-gray-800 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm border border-gray-200/50">
              {idea.niche}
            </span>
        </div>
        
        {/* Actions Top Right (RIGHT SIDE) */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
             {isOwner && onDelete && (
                 <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(idea.id); }}
                    className="bg-white/90 backdrop-blur-md p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 shadow-sm transition-all border border-transparent hover:border-red-200"
                    title="Excluir Projeto"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
             )}
             <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(idea.id); }}
                className="bg-white/90 backdrop-blur-md p-1.5 rounded-full text-gray-300 hover:text-red-500 shadow-sm transition-all"
            >
                <Heart className={`w-4 h-4 ${idea.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-lg font-bold text-apple-text mb-2 leading-tight group-hover:text-apple-blue transition-colors cursor-pointer" onClick={() => onClick(idea)}>
            {idea.title}
        </h3>

        {/* Pain Summary */}
        <div className="flex-grow mb-4 cursor-pointer" onClick={() => onClick(idea)}>
            <p className="text-sm text-gray-500 font-light line-clamp-2 leading-relaxed">
                "{idea.pain}"
            </p>
        </div>

        {/* Footer: Votes & Action & Author */}
        <div className="pt-4 border-t border-gray-50 flex items-center justify-between mt-auto">
            <div className="flex items-center gap-3">
                <button 
                    onClick={(e) => { e.stopPropagation(); onUpvote(idea.id); }}
                    disabled={idea.hasVoted}
                    className={`flex items-center gap-1.5 transition-colors px-2 py-1 rounded-lg ${
                        idea.hasVoted 
                        ? 'bg-orange-100 text-orange-600 cursor-default' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-orange-500'
                    }`}
                    title={idea.hasVoted ? "Você já votou" : "Votar nesta ideia"}
                >
                    <Flame className={`w-4 h-4 ${hasVotes || idea.hasVoted ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`} />
                    <span className="text-xs font-bold">{idea.votes_count}</span>
                </button>
                {renderAuthor()}
            </div>

            <button 
                onClick={() => onClick(idea)}
                className="text-xs font-semibold text-apple-blue hover:text-apple-blueHover flex items-center gap-1 group/btn"
            >
                Ver Detalhes
            </button>
        </div>
      </div>
    </div>
  );
};

export default IdeaCard;
