
import React from 'react';
import { Project } from '../../types';
import { Star, MessageSquare, Box, User } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const averageRating = project.reviews.length 
    ? (project.reviews.reduce((acc, curr) => acc + curr.rating, 0) / project.reviews.length).toFixed(1)
    : null;
  
  const hasImage = project.images && project.images.length > 0 && project.images[0] !== '';

  return (
    <div 
        onClick={() => onClick(project.id)}
        className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 ease-out flex flex-col h-full hover:-translate-y-1"
    >
      <div className="relative h-40 overflow-hidden bg-gray-50">
        {hasImage ? (
             <img 
             src={project.images[0]} 
             alt={project.name} 
             className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
           />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <div className="flex flex-col items-center gap-2 opacity-30">
                     <Box className="w-12 h-12 text-gray-500" strokeWidth={1} />
                     <div className="h-1 w-8 bg-gray-300 rounded-full"></div>
                </div>
            </div>
        )}
       
        {averageRating && (
            <div className="absolute bottom-2 right-2">
                <div className="bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {averageRating}
                </div>
            </div>
        )}
      </div>
      
      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-2">
            <h3 className="text-lg font-bold text-apple-text mb-0.5 truncate group-hover:text-apple-blue transition-colors">
                {project.name}
            </h3>
            <p className="text-xs text-gray-500 font-medium truncate">
                {project.tagline}
            </p>
        </div>

        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4 flex-grow font-light">
            {project.description}
        </p>

        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-3 border-t border-gray-50 mt-auto">
            <span className="flex items-center gap-1 text-gray-500">
                <MessageSquare className="w-3 h-3" /> {project.reviews.length} reviews
            </span>
            
            {/* Author */}
            <div className="flex items-center gap-2 group/author">
                <div className="w-5 h-5 rounded-full overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                    {project.profiles?.avatar_url ? (
                        <img src={project.profiles.avatar_url} alt="Maker" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-2.5 h-2.5" />
                        </div>
                    )}
                </div>
                <span className="font-medium text-gray-500 group-hover/author:text-apple-blue transition-colors">
                    {project.profiles?.full_name?.split(' ')[0] || project.maker_id}
                </span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
