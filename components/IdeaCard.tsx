import React from 'react';
import { Idea } from '../types';
import { 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  DollarSign, 
  Users, 
  TrendingUp, 
  ArrowBigUp,
  Heart
} from 'lucide-react';

interface IdeaCardProps {
  idea: Idea;
  onUpvote: (id: string) => void;
  onToggleBuild: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  viewMode: 'grid' | 'list';
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, onUpvote, onToggleBuild, onToggleFavorite, viewMode }) => {
  
  const isList = viewMode === 'list';
  // Date parsing fallback
  const dateStr = new Date(idea.created_at).toLocaleDateString();

  // LIST VIEW LAYOUT
  if (isList) {
    return (
      <div className="group bg-white rounded-xl p-5 border border-gray-100 hover:border-gray-300 hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center gap-6">
        
        {/* Left: Votes & Fav */}
        <div className="flex md:flex-col items-center gap-3 flex-shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onUpvote(idea.id); }}
            className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gray-50 hover:bg-blue-50 group/vote transition-colors"
          >
            <ArrowBigUp className="w-6 h-6 text-gray-400 group-hover/vote:text-apple-blue" />
            <span className="text-xs font-bold text-gray-600 group-hover/vote:text-apple-blue">{idea.votes_count}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(idea.id); }}
            className="p-2 rounded-full hover:bg-gray-50 transition-colors"
          >
            <Heart className={`w-5 h-5 transition-colors ${idea.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
          </button>
        </div>

        {/* Middle: Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-3 mb-1">
             <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider flex-shrink-0">
              {idea.niche}
            </span>
            <span className="text-xs text-gray-400">
                {dateStr}
            </span>
          </div>
          <h3 className="text-lg font-bold text-apple-text truncate mb-1">{idea.title}</h3>
          <p className="text-sm text-gray-600 font-light line-clamp-1 mb-2">{idea.pain}</p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
             <div className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {idea.pricing_model}</div>
             <div className="flex items-center gap-1 hidden md:flex"><Users className="w-3 h-3" /> {idea.target}</div>
          </div>
        </div>

        {/* Right: Action */}
        <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
             <button 
                onClick={() => onToggleBuild(idea.id)}
                className={`w-full md:w-auto px-6 py-2 rounded-lg font-medium text-sm transition-all ${
                    idea.is_building 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
            >
                {idea.is_building ? 'Em Construção' : 'Construir'}
            </button>
        </div>
      </div>
    );
  }

  // GRID VIEW LAYOUT (Original Improved)
  return (
    <div className="group relative bg-white rounded-3xl p-8 transition-all duration-300 shadow-soft hover:shadow-hover flex flex-col h-full border border-transparent hover:border-gray-100">
      
      {/* Top Actions */}
      <div className="absolute top-6 right-6 z-10">
          <button 
            onClick={() => onToggleFavorite(idea.id)}
            className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-50 transition-all transform hover:scale-110"
          >
            <Heart className={`w-5 h-5 transition-colors ${idea.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} />
          </button>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {idea.niche}
        </span>
      </div>

      <h3 className="text-2xl font-semibold text-apple-text mb-6 tracking-tight pr-8">
        {idea.title}
      </h3>

      {/* Main Content Sections */}
      <div className="space-y-6 flex-grow text-sm">
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-apple-subtext text-xs font-semibold uppercase tracking-wide">
            <AlertCircle className="w-4 h-4" /> A Dor
          </div>
          <p className="text-gray-700 leading-relaxed font-light text-base">{idea.pain}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-apple-blue text-xs font-semibold uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4" /> Solução
          </div>
          <p className="text-gray-700 leading-relaxed font-light text-base">{idea.solution}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                    <Zap className="w-3 h-3" /> Por Quê?
                </div>
                <p className="text-gray-600 text-xs font-medium">{idea.why}</p>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                    <DollarSign className="w-3 h-3" /> Modelo
                </div>
                <p className="text-gray-600 text-xs font-medium">{idea.pricing_model}</p>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                    <Users className="w-3 h-3" /> Público
                </div>
                <p className="text-gray-600 text-xs font-medium">{idea.target}</p>
            </div>
            <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                    <TrendingUp className="w-3 h-3" /> Vendas
                </div>
                <p className="text-gray-600 text-xs font-medium">{idea.sales_strategy}</p>
            </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-8 flex items-center gap-4">
        <button 
          onClick={() => onUpvote(idea.id)}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:border-apple-blue px-4 py-3 rounded-xl transition-colors group/vote shadow-sm"
        >
          <ArrowBigUp className="w-5 h-5 text-gray-400 group-hover/vote:text-apple-blue transition-colors" />
          <span className="text-sm font-medium text-gray-600 group-hover/vote:text-apple-blue">{idea.votes_count}</span>
        </button>
        <button 
            onClick={() => onToggleBuild(idea.id)}
            className={`flex-grow py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                idea.is_building 
                ? 'bg-green-50 text-green-600 border border-green-100' 
                : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/5'
            }`}
        >
            {idea.is_building ? 'Em Construção' : 'Iniciar Construção'}
        </button>
      </div>
    </div>
  );
};

export default IdeaCard;