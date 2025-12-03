import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useIdeas, useUserInteractions } from '../../hooks/use-ideas-cache';
import { Idea } from '../../types';
import IdeaCard from './IdeaCard';
import IdeaDetailModal from './IdeaDetailModal';
import NewIdeaModal from './NewIdeaModal';
import NewProjectModal from './NewProjectModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { IdeasListSkeleton } from '../../components/ui/LoadingStates';
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Grid, List, TrendingUp, Heart, Flame, X } from 'lucide-react';
import { useVoteIdea, useToggleFavorite, useJoinInterest, useAddImprovement, useSaveIdea } from '../../hooks/use-mutations';
import { useCreateProject } from '../../hooks/useCreateProject';
import { usePrefetch } from '../../hooks/use-prefetch';
import { supabase } from '../../lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '../../lib/cache-keys';
import { useToast } from '../../context/ToastContext';

const IdeasPage: React.FC = () => {
    const { session } = useAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNiche, setSelectedNiche] = useState('Todos');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showMostVotedOnly, setShowMostVotedOnly] = useState(false);
    const [showMyIdeasOnly, setShowMyIdeasOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'votes' | 'recent'>('recent');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [nicheSearchQuery, setNicheSearchQuery] = useState('');

    const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Idea | null>(null);

    const { data: userInteractions } = useUserInteractions(session?.user?.id);

    // Buscar dados com paginação no servidor
    const { data: response, isLoading } = useIdeas({
        userId: session?.user?.id,
        page: currentPage,
        pageSize: itemsPerPage,
        category: selectedNiche !== 'Todos' ? selectedNiche : undefined,
        search: searchQuery || undefined,
        sortBy: showMostVotedOnly ? 'votes' : sortBy,
        myProjects: showMyIdeasOnly,
        showFavorites: showFavoritesOnly,
        favoriteIds: showFavoritesOnly ? Array.from(userInteractions?.favorites || []) : undefined
    });
    const { data: allIdeasForNiches } = useIdeas({ userId: session?.user?.id, pageSize: 1000 });
    const { data: myIdeasData } = useIdeas({ userId: session?.user?.id, myProjects: true, pageSize: 1 });

    const voteMutation = useVoteIdea();
    const favMutation = useToggleFavorite();
    const joinMutation = useJoinInterest();
    const improvementMutation = useAddImprovement();
    const saveMutation = useSaveIdea();
    const { create: createIdea } = useCreateProject('idea');
    const { create: createShowroom } = useCreateProject('showroom');
    const { prefetchIdeaDetail } = usePrefetch();
    const queryClient = useQueryClient();
    const toast = useToast();

    // Dados paginados do servidor
    const ideas = useMemo<Idea[]>(() => {
        if (!response?.data) return [];
        return response.data.map(idea => ({
            ...idea,
            hasVoted: userInteractions?.votes?.has(idea.id) || false,
            isFavorite: userInteractions?.favorites?.has(idea.id) || false,
            isInterested: userInteractions?.interests?.has(idea.id) || false
        }));
    }, [response, userInteractions]);

    // Total de páginas baseado no count do servidor
    const totalPages = Math.ceil((response?.totalCount || 0) / itemsPerPage);

    // Nichos para o filtro (usa query separada com limite maior para contagem)
    const niches = useMemo<{ name: string; count: number }[]>(() => {
        if (!allIdeasForNiches?.data) return [{ name: 'Todos', count: 0 }];

        const counts: Record<string, number> = {};
        allIdeasForNiches.data.forEach(idea => {
            const niche = idea.niche || 'Outros';
            counts[niche] = (counts[niche] || 0) + 1;
        });

        const nicheList = Object.entries(counts).map(([name, count]) => ({ name, count }));
        // Ordenar por contagem decrescente
        nicheList.sort((a, b) => b.count - a.count);

        return [
            { name: 'Todos', count: allIdeasForNiches.totalCount },
            ...nicheList
        ];
    }, [allIdeasForNiches]);

    // Contar ideias com votos (para o badge "Mais Votadas")
    const votedIdeasCount = useMemo(() => {
        if (!allIdeasForNiches?.data) return 0;
        return allIdeasForNiches.data.filter(idea => (idea.votes_count || 0) > 0).length;
    }, [allIdeasForNiches]);

    const handleVote = async (ideaId: string) => {
        if (!session) return toast.warning('Faça login para votar');
        try {
            await voteMutation.mutateAsync({ ideaId, userId: session.user.id });
        } catch (error) {
            console.error('Erro ao votar:', error);
            toast.error("Erro ao registrar voto. Tente novamente.");
        }
    };

    const handleFavorite = async (id: string) => {
        if (!session) return toast.warning('Faça login para favoritar');
        const item = ideas.find(i => i.id === id);
        if (item) {
            try {
                await favMutation.mutateAsync({ ideaId: id, userId: session.user.id, isFavorite: !!item.isFavorite });
            } catch (err) {
                console.error("Erro ao favoritar:", err);
                toast.error("Erro ao atualizar favoritos.");
            }
        }
    };

    const handleSaveIdea = async (data: any) => {
        if (!session?.user?.id) return;
        try {
            if (data.id) {
                // Edit mode - bypass rate limit
                await saveMutation.mutateAsync({ ...data, user_id: session.user.id });
                setIsIdeaModalOpen(false);
                setIsProjectModalOpen(false);
                setEditingProject(null);
            } else {
                // Create mode - use rate limit
                let success = false;
                if (data.is_showroom) {
                    success = await createShowroom(data);
                } else {
                    success = await createIdea(data);
                }

                if (success) {
                    setIsIdeaModalOpen(false);
                    setIsProjectModalOpen(false);
                    setEditingProject(null);
                }
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            // Toast is handled by useCreateProject for creation errors
            if (data.id) toast.error('Erro ao salvar. Tente novamente.');
        }
    };

    const handlePromote = (idea: Idea) => {
        setEditingProject(idea);
        setIsProjectModalOpen(true);
    };

    const activeFiltersCount = [
        searchQuery,
        selectedNiche !== 'Todos',
        showMostVotedOnly,
        showFavoritesOnly,
        showMyIdeasOnly
    ].filter(Boolean).length;

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedNiche('Todos');
        setShowMostVotedOnly(false);
        setShowFavoritesOnly(false);
        setShowMyIdeasOnly(false);
        setNicheSearchQuery('');
        setCurrentPage(1);
    };

    const handleAddImprovement = async (ideaId: string, content: string, parentId?: string) => {
        if (!session?.user?.id) {
            toast.warning('Faça login para comentar');
            return;
        }
        try {
            await improvementMutation.mutateAsync({ ideaId, userId: session.user.id, content, parentId });
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            toast.error('Erro ao adicionar comentário. Tente novamente.');
        }
    };

    const handleDeleteIdea = async () => {
        if (!ideaToDelete || !session?.user?.id) return;

        try {
            const { error } = await supabase
                .from('ideas')
                .delete()
                .eq('id', ideaToDelete)
                .eq('user_id', session.user.id); // Ensure user owns the idea

            if (error) throw error;

            // Invalidate cache to refresh the list
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });

            // Close modal
            setIdeaToDelete(null);

            toast.success('Projeto excluído com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir projeto:', error);
            toast.error('Erro ao excluir projeto. Tente novamente.');
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-apple-text tracking-tight mb-2">Ideias & Validação</h1>
                    <p className="text-gray-500 text-lg font-light">Descubra, vote e valide as próximas grandes ideias.</p>
                </div>
                <button onClick={() => session ? setIsIdeaModalOpen(true) : toast.warning('Faça login para criar')} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Nova Ideia
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <aside className="lg:col-span-1 space-y-8">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" placeholder="Buscar ideias..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm" />
                    </div>

                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="w-full flex items-center justify-between px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-sm font-medium group mb-6"
                        >
                            <span className="flex items-center gap-2">
                                <X className="w-4 h-4" />
                                Limpar Filtros
                            </span>
                            <span className="bg-red-200 text-red-700 text-xs px-2 py-0.5 rounded-full group-hover:bg-red-300 transition-colors">
                                {activeFiltersCount}
                            </span>
                        </button>
                    )}

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filtros</h3>
                        <div className="space-y-1">
                            <button onClick={() => setShowMostVotedOnly(!showMostVotedOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${showMostVotedOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="flex items-center gap-2">
                                    <TrendingUp className={`w-4 h-4 ${showMostVotedOnly ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    Mais Votadas
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${showMostVotedOnly ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {votedIdeasCount}
                                </span>
                            </button>
                            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${showFavoritesOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="flex items-center gap-2">
                                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'text-black fill-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    Favoritos
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${showFavoritesOnly ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {userInteractions?.favorites?.size || 0}
                                </span>
                            </button>
                            {session && (
                                <button onClick={() => setShowMyIdeasOnly(!showMyIdeasOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${showMyIdeasOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <span className="flex items-center gap-2">
                                        <Flame className={`w-4 h-4 ${showMyIdeasOnly ? 'text-orange-500 fill-orange-500' : 'text-gray-400 group-hover:text-orange-400'}`} />
                                        Meus Projetos
                                    </span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${showMyIdeasOnly ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {myIdeasData?.totalCount || 0}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Visualização</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${viewMode === 'grid' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Grid className="w-4 h-4" /> Cards
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${viewMode === 'list' ? 'bg-black text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                            >
                                <List className="w-4 h-4" /> Lista
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Filter className="w-3 h-3" /> Nichos</h3>
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                            <input
                                type="text"
                                placeholder="Buscar nicho..."
                                value={nicheSearchQuery}
                                onChange={(e) => setNicheSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-xs"
                            />
                        </div>
                        <div className="space-y-1 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                            {niches
                                .filter(niche => niche.name.toLowerCase().includes(nicheSearchQuery.toLowerCase()))
                                .map(niche => (
                                    <button key={niche.name} onClick={() => setSelectedNiche(niche.name)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedNiche === niche.name ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <span>{niche.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedNiche === niche.name ? 'bg-white text-black' : 'bg-gray-100 text-gray-500'}`}>
                                            {niche.count}
                                        </span>
                                    </button>
                                ))}
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-3">
                    {isLoading ? <IdeasListSkeleton /> : (
                        <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                            {ideas.map(idea => (
                                <IdeaCard
                                    key={idea.id}
                                    idea={idea}
                                    onUpvote={() => handleVote(idea.id)}
                                    onToggleFavorite={() => handleFavorite(idea.id)}
                                    onClick={() => { setSelectedIdeaId(idea.id); prefetchIdeaDetail(idea.id); }}
                                    onDelete={session?.user?.id === idea.user_id ? () => setIdeaToDelete(idea.id) : undefined}
                                    viewMode={viewMode}
                                    currentUserId={session?.user?.id}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12">
                            <button
                                onClick={() => {
                                    setCurrentPage(p => Math.max(1, p - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === 1}
                                className="px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <div className="flex gap-2">
                                {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(pageNum => (
                                    <button
                                        key={pageNum}
                                        onClick={() => {
                                            setCurrentPage(pageNum);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${currentPage === pageNum
                                            ? 'bg-black text-white shadow-lg'
                                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                {totalPages > 10 && (
                                    <>
                                        <span className="flex items-center text-gray-400 px-2">...</span>
                                        <button
                                            onClick={() => {
                                                setCurrentPage(totalPages);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                                                ? 'bg-black text-white shadow-lg'
                                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {totalPages}
                                        </button>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setCurrentPage(p => Math.min(totalPages, p + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-600 transition-colors flex items-center gap-2"
                            >
                                Seguinte <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <NewIdeaModal
                isOpen={isIdeaModalOpen}
                onClose={() => setIsIdeaModalOpen(false)}
                onSave={handleSaveIdea}
            />
            {selectedIdeaId && (
                <IdeaDetailModal
                    idea={ideas.find(i => i.id === selectedIdeaId) || null}
                    currentUserId={session?.user?.id}
                    currentUserData={{ name: session?.user?.user_metadata?.full_name || 'Usuário', avatar: session?.user?.user_metadata?.avatar_url }}
                    onClose={() => setSelectedIdeaId(null)}
                    onUpvote={(id) => handleVote(id)}
                    onToggleFavorite={(id) => handleFavorite(id)}
                    onRequestPdr={async () => { }}
                    onAddImprovement={handleAddImprovement}
                    refreshData={() => prefetchIdeaDetail(selectedIdeaId)}
                    onPromoteIdea={handlePromote}
                />
            )}
            {ideaToDelete && <DeleteConfirmationModal isOpen={!!ideaToDelete} onClose={() => setIdeaToDelete(null)} onConfirm={handleDeleteIdea} />}
            {isProjectModalOpen && (
                <NewProjectModal
                    isOpen={isProjectModalOpen}
                    onClose={() => setIsProjectModalOpen(false)}
                    initialData={editingProject || undefined}
                    onSave={handleSaveIdea}
                />
            )}
        </div>
    );
};

export default IdeasPage;
