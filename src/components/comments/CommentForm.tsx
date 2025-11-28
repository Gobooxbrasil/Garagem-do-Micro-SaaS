import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface CommentFormProps {
    onSubmit: (content: string) => Promise<void>;
    placeholder?: string;
    buttonText?: string;
    autoFocus?: boolean;
}

export const CommentForm: React.FC<CommentFormProps> = ({
    onSubmit,
    placeholder = "Sugira uma feature ou deixe seu feedback...",
    buttonText,
    autoFocus = false
}) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content.trim());
            setContent('');
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="flex-grow relative">
                <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-black outline-none transition-all resize-none h-24"
                />
            </div>
            <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="bg-black hover:bg-gray-800 text-white p-3 rounded-xl shadow-lg shadow-black/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title={buttonText || "Enviar"}
            >
                {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Send className="w-5 h-5" />
                )}
            </button>
        </form>
    );
};

export default CommentForm;
