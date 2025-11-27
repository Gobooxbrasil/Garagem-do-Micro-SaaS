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
import { Plus, Search, Filter, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ... (rest of the component remains the same until modals) ... */}

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
