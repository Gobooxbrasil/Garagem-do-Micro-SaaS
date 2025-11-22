import React from 'react';
import { Project } from '../types';
import { Star } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  const averageRating = project.reviews.length 
    ? (project.reviews.reduce((acc, curr) => acc + curr.rating, 0) / project.reviews.length).toFixed(1)
    : 'Novo';

  return (
    <div 
        onClick={() => onClick(project.id)}
        className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all duration-500 ease-out flex flex-col h-full hover:-translate-y-1"
    >
      <div className="relative h-56 overflow-hidden">
        <img 
          src={project.images[0]} 
          alt={project.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
        />
        <div className="absolute top-3 right-3">
            <div className="bg-white/90 backdrop-blur-md text-apple-text text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {averageRating}
            </div>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-3">
            <h3 className="text-xl font-semibold text-apple-text mb-1 group-hover:text-apple-blue transition-colors">
                {project.name}
            </h3>
            <p className="text-apple-subtext text-sm font-medium">
                {project.tagline}
            </p>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-6 flex-grow font-light">
            {project.description}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-gray-50">
            <span>
                {project.reviews.length} avaliações
            </span>
            <span className="font-medium text-gray-500">
                @{project.maker_id}
            </span>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;