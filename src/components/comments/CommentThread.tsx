import React, { useState } from 'react';
import { MessageSquare, User } from 'lucide-react';
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
    const [showReplies, setShowReplies] = useState(true);

    const handleReply = async (content: string) => {
        await onReply(comment.id, content);
        setShowReplyForm(false);
        setShowReplies(true);
    };

    const authorName = comment.profiles?.full_name || 'Usuário';
    const authorAvatar = comment.profiles?.avatar_url;
    const isOwn = currentUserId === comment.user_id;
    const hasReplies = comment.replies && comment.replies.length > 0;

    const formatTime = (date: string) => {
        const d = new Date(date);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="group">
            {/* Main Comment */}
            <div className="flex gap-3 hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors">
                {/* Avatar */}
                <div className="flex-shrink-0 mt-0.5">
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-200">
                        {authorAvatar ? (
                            <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <User className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-[15px]">
                            {authorName}
                        </span>
                        <span className="text-xs text-gray-500 font-normal">
                            {formatTime(comment.created_at)}
                        </span>
                    </div>

                    {/* Message */}
                    <div className="text-[15px] text-gray-900 leading-relaxed whitespace-pre-wrap mb-1">
                        {comment.content}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-2">
                        {hasReplies && (
                            <button
                                onClick={() => setShowReplies(!showReplies)}
                                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                <MessageSquare className="w-4 h-4" />
                                {comment.replies!.length} {comment.replies!.length === 1 ? 'Resposta' : 'Respostas'}
                                <span className="text-xs font-normal text-gray-500">
                                    {showReplies ? 'Ocultar' : 'Ver threads'}
                                </span>
                            </button>
                        )}
                        {!showReplyForm && depth < 2 && (
                            <button
                                onClick={() => setShowReplyForm(true)}
                                className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors opacity-0 group-hover:opacity-100"
                            >
                                Responder
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {showReplyForm && (
                        <div className="mt-3 space-y-2">
                            <CommentForm
                                onSubmit={handleReply}
                                placeholder="Responder..."
                                autoFocus
                            />
                            <button
                                onClick={() => setShowReplyForm(false)}
                                className="text-xs text-gray-500 hover:text-gray-900"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Replies */}
            {hasReplies && showReplies && (
                <div className="ml-12 mt-2 border-l-2 border-gray-200 pl-4 space-y-2">
                    {comment.replies!.map((reply) => (
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
