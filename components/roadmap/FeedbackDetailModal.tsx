
import React, { useState } from 'react';
import { X, ChevronUp, MessageSquare, Send, Loader2, Calendar, User } from 'lucide-react';
import { useFeedbackDetail, useFeedbackComments, useVoteFeedback, useAddFeedbackComment } from '../../hooks/use-feedback';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';
import { Feedback } from '../../types';

interface FeedbackDetailModalProps {
  feedbackId: string | null;
  onClose: () => void;
  userId: string;
  userHasVoted: boolean;
}

export const FeedbackDetailModal: React.FC<FeedbackDetailModalProps> = ({ feedbackId, onClose, userId, userHasVoted }) => {
  const { data: feedback, isLoading } = useFeedbackDetail(feedbackId || '');
  const { data: comments, isLoading: commentsLoading } = useFeedbackComments(feedbackId || '');
  const voteMutation = useVoteFeedback();
  const commentMutation = useAddFeedbackComment();
  const [newComment, setNewComment] = useState('');

  if (!feedbackId) return null;
  if (isLoading || !feedback) return null;

  const handleVote = () => {
      voteMutation.mutate({ feedbackId: feedback.id, userId, hasVoted: userHasVoted });
  };

  const handleComment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newComment.trim()) return;
      commentMutation.mutate({ feedbackId: feedback.id, userId, content: newComment }, {
          onSuccess: () => setNewComment('')
      });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                <div className="flex-grow pr-8">
                    <div className="flex gap-2 mb-3">
                        <TypeBadge type={feedback.type} />
                        <StatusBadge status={feedback.status} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{feedback.title}</h2>
                </div>
                <button onClick={onClose} className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
                <div className="flex gap-6 mb-8">
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={handleVote}
                            className={`w-14 h-16 rounded-xl flex flex-col items-center justify-center border transition-all ${userHasVoted ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-500'}`}
                        >
                            <ChevronUp className="w-6 h-6 mb-1" />
                            <span className="text-sm font-bold">{feedback.votes_count}</span>
                        </button>
                    </div>
                    <div className="space-y-6 flex-grow">
                        <p className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">{feedback.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 pt-4 border-t border-gray-100">
                             <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                    {feedback.creator_avatar ? <img src={feedback.creator_avatar} className="w-full h-full object-cover" /> : <User className="w-3 h-3 m-1.5" />}
                                </div>
                                <span className="font-medium text-gray-600">{feedback.creator_name || 'Anônimo'}</span>
                             </div>
                             <span>•</span>
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(feedback.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Comentários ({comments?.length || 0})
                    </h3>

                    <div className="space-y-6 mb-6">
                        {commentsLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /> : 
                         comments?.map(comment => (
                             <div key={comment.id} className="flex gap-3">
                                 <div className="w-8 h-8 rounded-full bg-white border border-gray-200 overflow-hidden flex-shrink-0">
                                     {comment.profiles?.avatar_url ? <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" /> : <User className="w-4 h-4 m-2 text-gray-400" />}
                                 </div>
                                 <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex-grow">
                                     <div className="flex justify-between items-center mb-1">
                                         <span className="text-xs font-bold text-gray-700">{comment.profiles?.full_name}</span>
                                         <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                                     </div>
                                     <p className="text-sm text-gray-600">{comment.content}</p>
                                 </div>
                             </div>
                         ))}
                         {comments?.length === 0 && <p className="text-center text-gray-400 text-sm italic">Nenhum comentário ainda.</p>}
                    </div>

                    <form onSubmit={handleComment} className="relative">
                        <input 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Adicione um comentário..."
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-12 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!newComment.trim() || commentMutation.isPending}
                            className="absolute right-2 top-2 p-1.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {commentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};
