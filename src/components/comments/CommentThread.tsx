import React, { useState } from 'react';
import { Reply, User } from 'lucide-react';
import { Improvement } from '../../types';
import CommentForm from './CommentForm';

interface CommentThreadProps {
    comment: Improvement & { replies?: Improvement[] };
    depth: number;
    onReply: (parentId: string, content: string) => Promise<void>;
    currentUserId?: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
    comment,
    depth,
    onReply,
    currentUserId
}) => {
    const [showReplyForm, setShowReplyForm] = useState(false);

    const handleReply = async (content: string) => {
        await onReply(comment.id, content);
        setShowReplyForm(false);
    };

    const authorName = comment.profiles?.full_name || 'Usuário';
    const authorAvatar = comment.profiles?.avatar_url;
    const isOwn = currentUserId === comment.user_id;
    const isReply = depth > 0;

    return (
        <div className={`${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
            <div className={`relative ${isReply ? 'bg-gray-50 border-l-4 border-gray-300 pl-4 py-3 rounded-r-xl' : 'bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow'}`}>
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    <div className={`${isReply ? 'w-7 h-7' : 'w-10 h-10'} rounded-full bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden flex-shrink-0 ring-2 ring-white shadow-sm`}>
                        {authorAvatar ? (
                            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <User className={`${isReply ? 'w-3 h-3' : 'w-5 h-5'}`} />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-bold text-gray-900 ${isReply ? 'text-sm' : 'text-base'}`}>
                                {authorName}
                            </span>
                            {isOwn && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                    Você
                                </span>
                            )}
                            <span className="text-xs text-gray-400 font-medium">
                                {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <p className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${isReply ? 'text-sm ml-10' : 'text-base ml-13'}`}>
                    {comment.content}
                </p>

                {/* Actions */}
                {!showReplyForm && depth < 2 && (
                    <div className={`${isReply ? 'ml-10' : 'ml-13'} mt-3`}>
                        <button
                            onClick={() => setShowReplyForm(true)}
                            className="text-xs text-gray-500 hover:text-black font-semibold flex items-center gap-1.5 transition-colors group"
                        >
                            <Reply className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Responder
                        </button>
                    </div>
                )}

                {/* Reply Form */}
                {showReplyForm && (
                    <div className={`${isReply ? 'ml-10' : 'ml-13'} mt-4 space-y-2`}>
                        <CommentForm
                            onSubmit={handleReply}
                            placeholder="Escreva sua resposta..."
                            autoFocus
                        />
                        <button
                            onClick={() => setShowReplyForm(false)}
                            className="text-xs text-gray-500 hover:text-black font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-2">
                    {comment.replies.map((reply) => (
                        <CommentThread
                            key={reply.id}
                            comment={reply}
                            depth={depth + 1}
                            onReply={onReply}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CommentThread;
