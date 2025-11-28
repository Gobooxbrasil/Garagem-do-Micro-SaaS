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

    return (
        <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mb-4'}`}>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {authorAvatar ? (
                            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <User className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900">{authorName}</span>
                            {isOwn && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Você</span>
                            )}
                            <span className="text-xs text-gray-400">
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
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3 ml-11">
                    {comment.content}
                </p>

                {/* Actions */}
                {!showReplyForm && (
                    <div className="ml-11">
                        <button
                            onClick={() => setShowReplyForm(true)}
                            className="text-xs text-gray-500 hover:text-black font-medium flex items-center gap-1 transition-colors"
                        >
                            <Reply className="w-3 h-3" />
                            Responder
                        </button>
                    </div>
                )}

                {/* Reply Form */}
                {showReplyForm && (
                    <div className="ml-11 mt-3">
                        <CommentForm
                            onSubmit={handleReply}
                            placeholder="Escreva sua resposta..."
                            autoFocus
                        />
                        <button
                            onClick={() => setShowReplyForm(false)}
                            className="text-xs text-gray-500 hover:text-black mt-2"
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
