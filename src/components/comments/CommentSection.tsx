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
        <div className="pt-8 border-t border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-gray-400" />
                {sectionTitle} ({comments.length})
            </h3>

            {/* Comments List */}
            <div className="space-y-2 mb-8">
                {commentThreads.length === 0 ? (
                    <div className="text-gray-400 text-sm italic bg-gray-50 p-6 rounded-xl text-center border border-dashed border-gray-200">
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
            <CommentForm
                onSubmit={onAddComment}
                placeholder={isShowroom ? "Deixe seu feedback para o criador..." : "Sugira uma feature ou deixe seu feedback..."}
            />
        </div>
    );
};

export default CommentSection;
