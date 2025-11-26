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
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useVoteIdea, useToggleFavorite, useJoinInterest, useAddImprovement } from '../../hooks/use-mutations';
import { usePrefetch } from '../../hooks/use-prefetch';

const IdeasPage: React.FC = () => {
    const { session } = useAuth();
    const { data: rawIdeas, isLoading } = useIdeas({ userId: session?.user?.id });
    const { data: userInteractions } = useUserInteractions(session?.user?.id);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNiche, setSelectedNiche] = useState('Todos');
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [showMostVotedOnly, setShowMostVotedOnly] = useState(false);
    const [showMyIdeasOnly, setShowMyIdeasOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'votes' | 'newest'>('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
    const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
    const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false); // For promoting idea
    const [editingProject, setEditingProject] = useState<Idea | null>(null);

    const voteMutation = useVoteIdea();
    const favMutation = useToggleFavorite();
    const joinMutation = useJoinInterest();
    const improvementMutation = useAddImprovement();
    const { prefetchIdeaDetail } = usePrefetch();

    const ideas = useMemo<Idea[]>(() => {
        if (!rawIdeas) return [];
        return rawIdeas.map(idea => ({
            ...idea,
            hasVoted: userInteractions?.votes?.has(idea.id) || false,
            isFavorite: userInteractions?.favorites?.has(idea.id) || false,
            isInterested: userInteractions?.interests?.has(idea.id) || false
        }));
    }, [rawIdeas, userInteractions]);

    const niches = useMemo<string[]>(() => {
        if (!rawIdeas) return ['Todos'];
        const allNiches = rawIdeas.map(i => i.niche);
        return ['Todos', ...Array.from(new Set(allNiches)) as string[]];
    }, [rawIdeas]);

    const filteredIdeas = useMemo(() => {
        let result = [...ideas];
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(idea =>
                idea.title.toLowerCase().includes(q) ||
                idea.pain.toLowerCase().includes(q) ||
                idea.solution.toLowerCase().includes(q)
            );
        }
        if (showFavoritesOnly) result = result.filter(idea => idea.isFavorite);
        if (showMostVotedOnly) result.sort((a, b) => b.votes_count - a.votes_count);
        else if (sortBy === 'votes') result.sort((a, b) => b.votes_count - a.votes_count);
        else result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        if (showMyIdeasOnly && session?.user) result = result.filter(idea => idea.user_id === session.user.id);
        if (selectedNiche !== 'Todos') result = result.filter(idea => idea.niche === selectedNiche);

        return result;
    }, [ideas, selectedNiche, sortBy, searchQuery, showFavoritesOnly, showMyIdeasOnly, showMostVotedOnly, session]);

    const totalPages = Math.ceil(filteredIdeas.length / itemsPerPage);
    const paginatedIdeas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredIdeas.slice(start, start + itemsPerPage);
    }, [filteredIdeas, currentPage, itemsPerPage]);

    const handleVote = (id: string) => {
        if (!session) return alert('Faça login para votar');
        voteMutation.mutate({ ideaId: id, userId: session.user.id });
    };

    const handleFavorite = (id: string) => {
        if (!session) return alert('Faça login para favoritar');
        const item = ideas.find(i => i.id === id);
        if (item) favMutation.mutate({ ideaId: id, userId: session.user.id, isFavorite: !!item.isFavorite });
    };

    const handlePromote = (idea: Idea) => {
        setEditingProject(idea);
        setIsProjectModalOpen(true);
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
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Filter className="w-3 h-3" /> Nichos</h3>
                        <div className="space-y-1">
                            {niches.map(niche => (
                                <button key={niche} onClick={() => setSelectedNiche(niche)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${selectedNiche === niche ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{niche}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filtros</h3>
                        <div className="space-y-1">
                            <button onClick={() => setShowMostVotedOnly(!showMostVotedOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${showMostVotedOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>Mais Votadas</button>
                            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${showFavoritesOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>Favoritos</button>
                            {session && <button onClick={() => setShowMyIdeasOnly(!showMyIdeasOnly)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${showMyIdeasOnly ? 'bg-gray-100 font-bold text-black' : 'text-gray-600 hover:bg-gray-50'}`}>Minhas Ideias</button>}
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-3">
                    {isLoading ? <IdeasListSkeleton /> : (
                        <div className="grid gap-6">
                            {paginatedIdeas.map(idea => (
                                <IdeaCard
                                    key={idea.id}
                                    idea={idea}
                                    onVote={() => handleVote(idea.id)}
                                    onFavorite={() => handleFavorite(idea.id)}
                                    onClick={() => { setSelectedIdeaId(idea.id); prefetchIdeaDetail(idea.id); }}
                                    onDelete={() => setIdeaToDelete(idea.id)}
                                    onPromote={() => handlePromote(idea)}
                                    isOwner={session?.user?.id === idea.user_id}
                                />
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-12">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                            <span className="text-sm font-medium text-gray-600">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <NewIdeaModal isOpen={isIdeaModalOpen} onClose={() => setIsIdeaModalOpen(false)} />
            {selectedIdeaId && <IdeaDetailModal ideaId={selectedIdeaId} isOpen={!!selectedIdeaId} onClose={() => setSelectedIdeaId(null)} />}
            {ideaToDelete && <DeleteConfirmationModal isOpen={!!ideaToDelete} onClose={() => setIdeaToDelete(null)} onConfirm={() => { /* Implement delete logic */ }} />}
            {isProjectModalOpen && <NewProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} initialData={editingProject || undefined} />}
        </div>
    );
};

export default IdeasPage;
