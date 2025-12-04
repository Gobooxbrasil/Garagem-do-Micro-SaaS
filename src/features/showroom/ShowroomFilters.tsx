
import React from 'react';
import { Search, LayoutGrid, List, Filter, Heart, Flame, Clock, UserCircle, ChevronDown, X } from 'lucide-react';
import { PRESET_NICHES } from '../../constants';

interface ShowroomFiltersProps {
   searchQuery: string;
   setSearchQuery: (val: string) => void;
   category: string;
   setCategory: (val: string) => void;
   viewMode: 'grid' | 'list';
   setViewMode: (mode: 'grid' | 'list') => void;
   showFavorites: boolean;
   setShowFavorites: (val: boolean) => void;
   sortBy: 'recent' | 'votes';
   setSortBy: (val: 'recent' | 'votes') => void;
   myProjects: boolean;
   setMyProjects: (val: boolean) => void;
   requireAuth: () => boolean;
   onClearFilters: () => void;
}

export const ShowroomFilters: React.FC<ShowroomFiltersProps> = ({
   searchQuery, setSearchQuery,
   category, setCategory,
   viewMode, setViewMode,
   showFavorites, setShowFavorites,
   sortBy, setSortBy,
   myProjects, setMyProjects,
   requireAuth,
   onClearFilters
}) => {
   return (
      <div className="space-y-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">

         {/* Search & Main Controls */}
         <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-grow relative group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-apple-blue transition-colors" />
               <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nome, categoria ou descrição..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-4 py-4 text-sm font-medium focus:ring-2 focus:ring-apple-blue/10 focus:border-apple-blue outline-none transition-all shadow-sm"
               />
            </div>

            {/* Category Dropdown */}
            <div className="relative min-w-[200px] group">
               <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-full appearance-none bg-white border border-gray-200 rounded-2xl pl-4 pr-10 py-4 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-apple-blue/10 focus:border-apple-blue outline-none cursor-pointer"
               >
                  <option value="Todos">Todas as Categorias</option>
                  {PRESET_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-apple-blue transition-colors" />
            </div>
         </div>

         {/* Quick Filters & View Toggle */}
         <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex flex-wrap items-center gap-2">
               <button
                  onClick={() => { if (requireAuth()) setShowFavorites(!showFavorites); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${showFavorites ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
               >
                  <Heart className={`w-3.5 h-3.5 ${showFavorites ? 'fill-red-600' : ''}`} /> Favoritos
               </button>

               <button
                  onClick={() => setSortBy(sortBy === 'votes' ? 'recent' : 'votes')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${sortBy === 'votes' ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
               >
                  <Flame className={`w-3.5 h-3.5 ${sortBy === 'votes' ? 'fill-orange-600' : ''}`} /> Mais Votados
               </button>

               <button
                  onClick={() => setSortBy('recent')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${sortBy === 'recent' ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
               >
                  <Clock className="w-3.5 h-3.5" /> Recentes
               </button>

               <button
                  onClick={() => { if (requireAuth()) setMyProjects(!myProjects); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border ${myProjects ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}
               >
                  <UserCircle className="w-3.5 h-3.5" /> Meus Projetos
               </button>

               {/* Clear Filters Button */}
               {(searchQuery || category !== 'Todos' || showFavorites || myProjects) && (
                  <button
                     onClick={onClearFilters}
                     className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  >
                     <X className="w-3.5 h-3.5" /> Limpar Filtros
                  </button>
               )}
            </div>

            <div className="flex bg-gray-100/80 p-1 rounded-xl ml-auto">
               <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Visualização em Grade"
               >
                  <LayoutGrid className="w-4 h-4" />
               </button>
               <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Visualização em Lista"
               >
                  <List className="w-4 h-4" />
               </button>
            </div>
         </div>
      </div>
   );
};
