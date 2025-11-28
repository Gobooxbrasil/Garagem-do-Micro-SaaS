import React from 'react';
import { MessageSquarePlus } from 'lucide-react';
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
        <div className="pt-10 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                <MessageSquarePlus className="w-6 h-6 text-gray-400" />
                {sectionTitle}
                <span className="text-sm font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {comments.length}
                </span>
            </h3>

            {/* Comments List */}
            <div className="space-y-4 mb-10">
                {commentThreads.length === 0 ? (
                    <div className="text-center py-12 px-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <MessageSquarePlus className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm font-medium">
                            Nenhum comentário ainda. Seja o primeiro a colaborar!
                        </p>
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
            <CommentForm
                onSubmit={onAddComment}
                placeholder={isShowroom ? "Deixe seu feedback para o criador..." : "Sugira uma feature ou deixe seu feedback..."}
            />
        </div>
    );
};

export default CommentSection;
