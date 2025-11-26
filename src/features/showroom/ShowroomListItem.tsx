

import React from 'react';
import { Idea } from '../../types';
import { Heart, ExternalLink, Rocket, Flame, Target, Megaphone } from 'lucide-react';
import ShareButton from '../../components/ui/ShareButton';

interface ShowroomListItemProps {
  project: Idea;
  onClick: (project: Idea) => void;
  onToggleFavorite: (id: string) => void;
  onVote: (id: string) => void;
}

export const ShowroomListItem: React.FC<ShowroomListItemProps> = ({ project, onClick, onToggleFavorite, onVote }) => {
  const hasImage = project.showroom_image || (project.images && project.images.length > 0 && project.images[0]);

  return (
    <div 
        onClick={() => onClick(project)}
        className="group bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:border-apple-blue/30 transition-all cursor-pointer flex items-center gap-4"
    >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative">
            {hasImage ? (
                <img src={hasImage} alt={project.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Rocket className="w-6 h-6" />
                </div>
            )}
        </div>

        {/* Info */}
        <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 truncate group-hover:text-apple-blue transition-colors">
                    {project.title}
                </h3>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                    {project.niche}
                </span>
                {project.showroom_objective && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${project.showroom_objective === 'feedback' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {project.showroom_objective === 'feedback' ? <Target className="w-3 h-3" /> : <Megaphone className="w-3 h-3" />}
                        {project.showroom_objective === 'feedback' ? 'Feedback' : 'Divulgação'}
                    </span>
                )}
            </div>
            <p className="text-xs text-gray-500 truncate max-w-md">
                {project.showroom_description || project.solution}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <span>Por <strong>{project.creator_name?.split(' ')[0] || 'Maker'}</strong></span>
                <span>•</span>
                <span className={`flex items-center gap-1 font-bold ${project.hasVoted ? 'text-orange-500' : ''}`}>
                    <Flame className="w-3 h-3" /> {project.votes_count} votos
                </span>
            </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pl-4 border-l border-gray-50">
            <button 
                onClick={(e) => { e.stopPropagation(); onToggleFavorite(project.id); }}
                className={`p-2 rounded-full transition-colors ${project.isFavorite ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
                title="Favoritar"
            >
                <Heart className={`w-4 h-4 ${project.isFavorite ? 'fill-red-500' : ''}`} />
            </button>
            
            <ShareButton idea={project} variant="card" />

            {project.showroom_link && (
                <a 
                    href={project.showroom_link} 
                    target="_blank" 
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-400 hover:text-apple-blue hover:bg-blue-50 rounded-full transition-colors"
                    title="Visitar Link"
                >
                    <ExternalLink className="w-4 h-4" />
                </a>
            )}
            
            <button 
                onClick={(e) => { e.stopPropagation(); onClick(project); }}
                className="bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-black/10"
            >
                Ver Detalhes
            </button>
        </div>
    </div>
  );
};