
import React from 'react';
import { Search, Plus } from 'lucide-react';

interface EmptyStateProps {
  onClearFilters: () => void;
  onNewProject: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onClearFilters, onNewProject }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-sm">
            <Search className="w-10 h-10 text-gray-300" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhum projeto encontrado</h3>
        <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
            Não encontramos nada com os filtros atuais. Tente buscar por outros termos ou seja o primeiro a publicar nesta categoria.
        </p>

        <div className="flex gap-4">
            <button 
                onClick={onClearFilters}
                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
            >
                Limpar Filtros
            </button>
            <button 
                onClick={onNewProject}
                className="px-6 py-2.5 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Publicar Projeto
            </button>
        </div>
    </div>
  );
};
