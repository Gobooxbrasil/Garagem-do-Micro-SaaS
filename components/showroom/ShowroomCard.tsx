
import React, { useState } from 'react';
import { Idea } from '../../types';
import ShareButton from '../ShareButton';
import { Heart, ExternalLink, User, Flame, Rocket, Youtube, Target, Megaphone, Play, X } from 'lucide-react';

interface ShowroomCardProps {
  project: Idea;
  onClick: (project: Idea) => void;
  onToggleFavorite: (id: string) => void;
  onVote: (id: string) => void;
}

// Helper para extrair ID do Youtube
const getYoutubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length >= 10) ? match[2] : null;
};

export const ShowroomCard: React.FC<ShowroomCardProps> = ({ project, onClick, onToggleFavorite, onVote }) => {
  const hasImage = project.showroom_image || (project.images && project.images.length > 0 && project.images[0]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const videoUrl = project.showroom_video_url || project.youtube_url || project.youtube_video_url;
  const videoId = getYoutubeId(videoUrl);
  const hasVideo = !!videoId;

  const handleCardClick = () => {
      setIsPlaying(false);
      onClick(project);
  };

  return (
    <div className="group relative bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
        {/* Cover Image / Video Player */}
        <div className="h-48 w-full relative overflow-hidden bg-gray-50 cursor-pointer" onClick={!isPlaying ? handleCardClick : undefined}>
            
            {isPlaying && videoId ? (
                <div className="absolute inset-0 z-40 bg-black animate-in fade-in">
                    <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`} 
                        title="YouTube video player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full"
                    ></iframe>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setIsPlaying(false); }}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors backdrop-blur-sm border border-white/10 z-50"
                        title="Fechar Vídeo"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <>
                    {hasImage ? (
                        <img 
                            src={hasImage} 
                            alt={project.title} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                            <Rocket className="w-12 h-12 mb-2 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Sem Preview</span>
                        </div>
                    )}
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                    
                    {/* Overlay Badges */}
                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap max-w-[80%] z-20">
                        <span className="bg-white/90 backdrop-blur-md text-gray-900 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm">
                            {project.niche}
                        </span>
                        {project.showroom_objective && (
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide shadow-sm flex items-center gap-1 backdrop-blur-md ${project.showroom_objective === 'feedback' ? 'bg-indigo-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                                {project.showroom_objective === 'feedback' ? <Target className="w-3 h-3" /> : <Megaphone className="w-3 h-3" />}
                                {project.showroom_objective === 'feedback' ? 'Feedback' : 'Showcase'}
                            </span>
                        )}
                    </div>

                    <div className="absolute top-4 right-4 flex gap-2 z-20">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(project.id); }}
                            className="bg-white/90 backdrop-blur-md p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-all shadow-sm"
                        >
                            <Heart className={`w-4 h-4 ${project.isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                    </div>

                    {hasVideo && (
                        <div className="absolute bottom-4 right-4 bg-red-600/90 backdrop-blur-sm text-white p-1.5 rounded-lg shadow-sm z-20 flex items-center gap-1">
                            <Youtube className="w-4 h-4" />
                            <span className="text-[10px] font-bold hidden group-hover:inline">VÍDEO</span>
                        </div>
                    )}

                    {/* Play Button Overlay (Always Visible if Video Exists) */}
                    {hasVideo && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 hover:bg-black/40 transition-colors duration-300">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsPlaying(true); }}
                                className="bg-red-600 text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center border-2 border-white/50 backdrop-blur-md group/play"
                                title="Reproduzir Vídeo"
                            >
                                <Play className="w-7 h-7 fill-white ml-1" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2">
                <h3 
                    onClick={handleCardClick}
                    className="text-lg font-bold text-gray-900 leading-tight cursor-pointer hover:text-apple-blue transition-colors line-clamp-1"
                >
                    {project.title}
                </h3>
            </div>
            
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 font-light" onClick={handleCardClick}>
                {project.showroom_description || project.solution}
            </p>

            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                     <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                         {project.creator_avatar ? <img src={project.creator_avatar} className="w-full h-full object-cover" /> : <User className="w-3 h-3 m-1.5 text-gray-400" />}
                     </div>
                     <span className="text-xs font-medium text-gray-600 truncate max-w-[80px]">
                         {project.creator_name?.split(' ')[0] || 'Maker'}
                     </span>
                </div>

                <div className="flex items-center gap-3">
                     <button 
                        onClick={(e) => { e.stopPropagation(); onVote(project.id); }}
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md transition-colors ${project.hasVoted ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:bg-gray-50 hover:text-orange-500'}`}
                     >
                         <Flame className={`w-3.5 h-3.5 ${project.hasVoted ? 'fill-orange-600' : ''}`} />
                         {project.votes_count}
                     </button>
                     
                     {project.showroom_link && (
                         <a 
                            href={project.showroom_link} 
                            target="_blank" 
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-apple-blue hover:text-apple-blueHover p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="Ver Demo"
                         >
                             <ExternalLink className="w-4 h-4" />
                         </a>
                     )}
                </div>
            </div>
        </div>
    </div>
  );
};
