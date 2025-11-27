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
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Grid, List, TrendingUp, Heart, Lightbulb, X } from 'lucide-react';
import { useVoteIdea, useToggleFavorite, useJoinInterest, useAddImprovement, useSaveIdea } from '../../hooks/use-mutations';
import { usePrefetch } from '../../hooks/use-prefetch';

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
    const { data: allIdeasForNiches } = useIdeas({ userId: session?.user?.id });
    // const { data: myIdeasData } = useIdeas({ userId: session?.user?.id, myProjects: true, pageSize: 1 });

    const voteMutation = useVoteIdea();
    const favMutation = useToggleFavorite();
    const joinMutation = useJoinInterest();
    const improvementMutation = useAddImprovement();
    const { prefetchIdeaDetail } = usePrefetch();

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

    // Nichos para o filtro (usa query separada sem paginação)
    const niches = useMemo<string[]>(() => {
        if (!allIdeasForNiches?.data) return ['Todos'];
        const allNiches = allIdeasForNiches.data.map(i => i.niche);
        return ['Todos', ...Array.from(new Set(allNiches)) as string[]];
    }, [allIdeasForNiches]);

    const saveMutation = useSaveIdea();

    const handleVote = (id: string) => {
        if (!session) return alert('Faça login para votar');
        voteMutation.mutate({ ideaId: id, userId: session.user.id }, {
            onError: (err) => {
                console.error("Erro ao votar:", err);
                alert("Erro ao registrar voto. Tente novamente.");
            }
        });
    };

    const handleFavorite = (id: string) => {
        if (!session) return alert('Faça login para favoritar');
        const item = ideas.find(i => i.id === id);
        if (item) favMutation.mutate({ ideaId: id, userId: session.user.id, isFavorite: !!item.isFavorite }, {
            onError: (err) => {
                console.error("Erro ao favoritar:", err);
                alert("Erro ao atualizar favoritos.");
            }
        });
    };

    const handleSaveIdea = async (data: any) => {
        if (!session?.user?.id) return;
        try {
            await saveMutation.mutateAsync({ ...data, user_id: session.user.id });
            setIsIdeaModalOpen(false);
            setIsProjectModalOpen(false);
            setEditingProject(null);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar. Tente novamente.');
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-apple-text tracking-tight mb-2">Ideias & Validação</h1>
                    <p className="text-gray-500 text-lg font-light">Descubra, vote e valide as próximas grandes ideias.</p>
                </div>
                <button onClick={() => session ? setIsIdeaModalOpen(true) : alert('Faça login para criar')} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 flex items-center gap-2">
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
                            </button>
                            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${showFavoritesOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <span className="flex items-center gap-2">
                                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'text-black fill-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                    Favoritos
                                </span>
                            </button>
                            {session && (
                                <button onClick={() => setShowMyIdeasOnly(!showMyIdeasOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${showMyIdeasOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    <span className="flex items-center gap-2">
                                        <Lightbulb className={`w-4 h-4 ${showMyIdeasOnly ? 'text-black fill-black' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                        Meus Projetos
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
                                .filter(niche => niche.toLowerCase().includes(nicheSearchQuery.toLowerCase()))
                                .map(niche => (
                                    <button key={niche} onClick={() => setSelectedNiche(niche)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedNiche === niche ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                        <span>{niche}</span>
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
                    onClose={() => setSelectedIdeaId(null)}
                    onUpvote={(id) => handleVote(id)}
                    onToggleFavorite={(id) => handleFavorite(id)}
                    onRequestPdr={async () => { }}
                    refreshData={() => { }}
                />
            )}
            {ideaToDelete && <DeleteConfirmationModal isOpen={!!ideaToDelete} onClose={() => setIdeaToDelete(null)} onConfirm={() => { /* Implement delete logic */ }} />}
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
