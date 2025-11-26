import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useIdeas, useUserInteractions } from '../../hooks/use-ideas-cache';
import { Idea } from '../../types';
import { ShowroomFilters } from './ShowroomFilters';
import { ShowroomCard } from './ShowroomCard';
import { ShowroomListItem } from './ShowroomListItem';
import { EmptyState } from './EmptyState';
import { IdeasListSkeleton } from '../../components/ui/LoadingStates';
import { useToggleFavorite, useJoinInterest } from '../../hooks/use-mutations';
import { useNavigate } from 'react-router-dom';
import NewProjectModal from '../ideas/NewProjectModal';
import { Plus } from 'lucide-react';

const ShowroomPage: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const { data: userInteractions } = useUserInteractions(session?.user?.id);
    const favoriteIds = useMemo(() => Array.from(userInteractions?.favorites || []) as string[], [userInteractions]);

    const [showroomSearch, setShowroomSearch] = useState('');
    const [showroomCategory, setShowroomCategory] = useState('Todos');
    const [showroomViewMode, setShowroomViewMode] = useState<'grid' | 'list'>('grid');
    const [showroomShowFavs, setShowroomShowFavs] = useState(false);
    const [showroomSort, setShowroomSort] = useState<'votes' | 'recent'>('votes');
    const [showroomMyProjects, setShowroomMyProjects] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    const { data: showroomProjects, isLoading } = useIdeas({
        onlyShowroom: true,
        search: showroomSearch,
        category: showroomCategory,
        sortBy: showroomSort,
        showFavorites: showroomShowFavs,
        favoriteIds: favoriteIds,
        myProjects: showroomMyProjects,
        userId: session?.user?.id
    });

    const hydratedShowroomProjects = useMemo<Idea[]>(() => {
        if (!showroomProjects) return [];
        return showroomProjects.map(p => ({
            ...p,
            hasVoted: userInteractions?.votes?.has(p.id) || false,
            isFavorite: userInteractions?.favorites?.has(p.id) || false,
            isInterested: userInteractions?.interests?.has(p.id) || false
        }));
    }, [showroomProjects, userInteractions]);

    const favMutation = useToggleFavorite();

    const handleFavorite = (id: string) => {
        if (!session) return alert('Faça login para favoritar');
        const item = hydratedShowroomProjects.find(i => i.id === id);
        if (item) favMutation.mutate({ ideaId: id, userId: session.user.id, isFavorite: !!item.isFavorite });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-apple-text tracking-tight mb-2">Showroom</h1>
                    <p className="text-gray-500 text-lg font-light">Projetos reais construídos pela comunidade.</p>
                </div>
                <button onClick={() => session ? setIsProjectModalOpen(true) : alert('Faça login para enviar')} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Enviar Projeto
                </button>
            </div>

            <ShowroomFilters
                search={showroomSearch} setSearch={setShowroomSearch}
                category={showroomCategory} setCategory={setShowroomCategory}
                viewMode={showroomViewMode} setViewMode={setShowroomViewMode}
                showFavorites={showroomShowFavs} setShowFavorites={setShowroomShowFavs}
                sortBy={showroomSort} setSortBy={setShowroomSort}
                myProjects={showroomMyProjects} setMyProjects={setShowroomMyProjects}
                isLoggedIn={!!session}
            />

            {isLoading ? <IdeasListSkeleton /> : (
                <>
                    {hydratedShowroomProjects.length === 0 ? <EmptyState /> : (
                        <div className={showroomViewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-4"}>
                            {hydratedShowroomProjects.map(project => (
                                showroomViewMode === 'grid' ? (
                                    <ShowroomCard
                                        key={project.id}
                                        project={project}
                                        onClick={() => navigate(`/showroom/${project.id}`)}
                                        onFavorite={() => handleFavorite(project.id)}
                                    />
                                ) : (
                                    <ShowroomListItem
                                        key={project.id}
                                        project={project}
                                        onClick={() => navigate(`/showroom/${project.id}`)}
                                    />
                                )
                            ))}
                        </div>
                    )}
                </>
            )}

            <NewProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} />
        </div>
    );
};

export default ShowroomPage;
