import React, { useState } from 'react';
import { useAuth } from '../../context/AuthProvider';
import { useFeedbackList, useUserFeedbackVotes, useVoteFeedback } from '../../hooks/use-feedback';
import { FeedbackType, FeedbackStatus, Feedback } from '../../types';
import { FeedbackCard } from './FeedbackCard';
import { CreateFeedbackModal } from './CreateFeedbackModal';
import { FeedbackDetailModal } from './FeedbackDetailModal';
import { IdeasListSkeleton } from '../../components/ui/LoadingStates';
import { Plus, Filter } from 'lucide-react';
import { AuthModal } from '../../components/auth/AuthModal';

const RoadmapPage: React.FC = () => {
    const { session } = useAuth();
    const [roadmapFilter, setRoadmapFilter] = useState<{ type: FeedbackType | 'all', status: FeedbackStatus | 'all', sort: 'votes' | 'recent' }>({ type: 'all', status: 'all', sort: 'votes' });

    const { data: feedbacks, isLoading } = useFeedbackList(roadmapFilter);
    const { data: userFeedbackVotes } = useUserFeedbackVotes(session?.user?.id);
    const feedbackVoteMutation = useVoteFeedback();

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const handleVote = (id: string) => {
        console.log('[DEBUG] handleVote called for feedback:', id);
        if (!session) {
            setIsAuthModalOpen(true);
            return;
        }
        const hasVoted = !!userFeedbackVotes?.has(id);
        console.log('[DEBUG] hasVoted:', hasVoted, 'isPending:', feedbackVoteMutation.isPending);

        if (feedbackVoteMutation.isPending) {
            console.log('[DEBUG] Mutation already pending, ignoring click');
            return;
        }

        feedbackVoteMutation.mutate({ feedbackId: id, userId: session.user.id, hasVoted });
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-apple-text tracking-tight mb-2">Feedback & Roadmap</h1>
                    <p className="text-gray-500 text-lg font-light">Ajude a construir o futuro da plataforma.</p>
                </div>
                <button onClick={() => session ? setIsFeedbackModalOpen(true) : setIsAuthModalOpen(true)} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Nova Sugestão
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <aside className="lg:col-span-1 space-y-8">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Filter className="w-3 h-3" /> Tipo</h3>
                        <div className="space-y-1">
                            {['all', 'bug', 'feature', 'improvement', 'other'].map(t => (
                                <button key={t} onClick={() => setRoadmapFilter(p => ({ ...p, type: t as any }))} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm capitalize transition-colors ${roadmapFilter.type === t ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{t === 'all' ? 'Todos' : t === 'feature' ? 'Features' : t === 'bug' ? 'Bugs' : t === 'improvement' ? 'Melhorias' : 'Outros'}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Status</h3>
                        <div className="space-y-1">
                            {['all', 'pending', 'planned', 'in_progress', 'completed'].map(s => (
                                <button key={s} onClick={() => setRoadmapFilter(p => ({ ...p, status: s as any }))} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm capitalize transition-colors ${roadmapFilter.status === s ? 'bg-white border border-gray-200 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>{s === 'all' ? 'Todos' : s === 'in_progress' ? 'Em Progresso' : s === 'completed' ? 'Concluído' : s === 'pending' ? 'Pendente' : 'Planejado'}</button>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="lg:col-span-3">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-sm text-gray-500"><strong>{feedbacks?.length || 0}</strong> sugestões encontradas</span>
                        <div className="flex gap-2">
                            <button onClick={() => setRoadmapFilter(p => ({ ...p, sort: 'votes' }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roadmapFilter.sort === 'votes' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}>Mais Votados</button>
                            <button onClick={() => setRoadmapFilter(p => ({ ...p, sort: 'recent' }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roadmapFilter.sort === 'recent' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}>Mais Recentes</button>
                        </div>
                    </div>

                    {isLoading ? <IdeasListSkeleton /> : (
                        <div className="grid gap-4">
                            {feedbacks?.map((item: Feedback) => (
                                <FeedbackCard
                                    key={item.id}
                                    feedback={item}
                                    onClick={(id) => setSelectedFeedbackId(id)}
                                    hasVoted={userFeedbackVotes?.has(item.id) || false}
                                    isVoting={feedbackVoteMutation.isPending}
                                    onVote={(e) => { e.stopPropagation(); handleVote(item.id); }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <CreateFeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} userId={session?.user?.id || ''} />
            {selectedFeedbackId && <FeedbackDetailModal feedbackId={selectedFeedbackId} onClose={() => setSelectedFeedbackId(null)} userId={session?.user?.id || ''} userHasVoted={!!userFeedbackVotes?.has(selectedFeedbackId)} />}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
            />
        </div>
    );
};

export default RoadmapPage;
