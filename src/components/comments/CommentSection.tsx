import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Improvement } from '../../types';
import CommentForm from './CommentForm';
import CommentThread from './CommentThread';

interface CommentSectionProps {
    ideaId: string;
    comments: Improvement[];
    currentUserId?: string;
    onAddComment: (content: string) => Promise<void>;
    onReply: (parentId: string, content: string) => Promise<void>;
    title?: string;
    isShowroom?: boolean;
}

// Organize comments into threads
const organizeThreads = (improvements: Improvement[]): (Improvement & { replies?: Improvement[] })[] => {
    const map = new Map<string, Improvement & { replies?: Improvement[] }>();
    const roots: (Improvement & { replies?: Improvement[] })[] = [];

    // First pass: create map
    improvements.forEach(imp => map.set(imp.id, { ...imp, replies: [] }));

    // Second pass: organize hierarchy
    improvements.forEach(imp => {
        const item = map.get(imp.id);
        if (!item) return;

        if (imp.parent_id && map.has(imp.parent_id)) {
            const parent = map.get(imp.parent_id);
            if (parent && parent.replies) {
                parent.replies.push(item);
            }
        } else {
            roots.push(item);
        }
    });

    return roots;
};

export const CommentSection: React.FC<CommentSectionProps> = ({
    ideaId,
    comments,
    currentUserId,
    onAddComment,
    onReply,
    title,
    isShowroom = false
}) => {
    const commentThreads = organizeThreads(comments);
    const sectionTitle = title || (isShowroom ? 'Feedback & Comentários' : 'Dúvidas & Sugestões');

    return (
        <div className="border-t border-gray-200 pt-6 mt-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                    {sectionTitle}
                </h3>
                <span className="text-sm text-gray-500 font-medium">
                    {comments.length} {comments.length === 1 ? 'comentário' : 'comentários'}
                </span>
            </div>

            {/* Comments List */}
            <div className="space-y-4 mb-6">
                {commentThreads.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                        Nenhum comentário ainda. Seja o primeiro a colaborar!
                    </div>
                ) : (
                    commentThreads.map((thread) => (
                        <CommentThread
                            key={thread.id}
                            comment={thread}
                            depth={0}
                            onReply={onReply}
                            currentUserId={currentUserId}
                        />
                    ))
                )}
            </div>

            {/* Add Comment Form */}
            <div className="border-t border-gray-200 pt-4">
                <CommentForm
                    onSubmit={onAddComment}
                    placeholder={isShowroom ? "Deixe seu feedback..." : "Adicionar comentário..."}
                />
            </div>
        </div>
    );
};

export default CommentSection;
