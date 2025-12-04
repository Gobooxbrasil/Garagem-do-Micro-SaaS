
import React, { useState } from 'react';
import { Idea } from '../../types';
import ShareButton from '../../components/ui/ShareButton';
import { Heart, ExternalLink, User, Flame, Rocket, Youtube, Target, Megaphone, Play, X } from 'lucide-react';
import { getYouTubeVideoId } from '../../components/ui/YouTubePreview'; // Importação centralizada
import { VideoModal } from '../../components/ui/VideoModal';

interface ShowroomCardProps {
    project: Idea;
    onClick: (project: Idea) => void;
    onToggleFavorite: (id: string) => void;
    onVote: (id: string) => void;
}

export const ShowroomCard: React.FC<ShowroomCardProps> = ({ project, onClick, onToggleFavorite, onVote }) => {
    const hasImage = project.showroom_image || (project.images && project.images.length > 0 && project.images[0]);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // Priority: 1) New standard field, 2) Showroom, 3) Legacy
    const videoUrl = project.youtube_url || project.showroom_video_url || project.youtube_video_url;

    // Utilizando função importada centralizada
    const videoId = getYouTubeVideoId(videoUrl || '');
    const hasVideo = !!videoId;

    const handleCardClick = () => {
        onClick(project);
    };

    const handlePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (videoId) {
            setIsVideoModalOpen(true);
        }
    };

    return (
        <div className="group relative bg-white rounded-3xl overflow-hidden shadow-soft border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
            {/* Cover Image / Video Player */}
            <div className="h-48 w-full relative overflow-hidden bg-gray-50 cursor-pointer" onClick={handleCardClick}>

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

                {/* Play Button Overlay (Always Visible if Video Exists) */}
                {hasVideo && (
                    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/20 hover:bg-black/40 transition-colors duration-300">
                        <button
                            onClick={handlePlay}
                            className="bg-red-600 text-white w-14 h-14 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center border-2 border-white/50 backdrop-blur-md group/play"
                            title="Assistir Vídeo"
                        >
                            <Play className="w-7 h-7 fill-white ml-1" />
                        </button>
                    </div>
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

            {/* Video Modal */}
            {hasVideo && videoId && (
                <VideoModal
                    videoId={videoId}
                    isOpen={isVideoModalOpen}
                    onClose={() => setIsVideoModalOpen(false)}
                />
            )}
        </div>
    );
};
