
import React from 'react';
import { Feedback } from '../../types';
import { StatusBadge } from './StatusBadge';
import { TypeBadge } from './TypeBadge';
import { MessageSquare, ChevronUp } from 'lucide-react';

interface FeedbackCardProps {
  feedback: Feedback;
  onClick: (id: string) => void;
  onVote: (e: React.MouseEvent) => void;
  hasVoted: boolean;
  isVoting?: boolean;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, onClick, onVote, hasVoted, isVoting = false }) => {
  return (
    <div
      onClick={() => onClick(feedback.id)}
      className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer group flex gap-4"
    >
      {/* Vote Column */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          onClick={onVote}
          disabled={isVoting}
          className={`w-10 h-12 rounded-lg flex flex-col items-center justify-center border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${hasVoted ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300'}`}
        >
          <ChevronUp className={`w-4 h-4 ${hasVoted ? 'stroke-2' : ''}`} />
          <span className="text-xs font-bold">{feedback.votes_count}</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start mb-2">
          <TypeBadge type={feedback.type} />
          <StatusBadge status={feedback.status} />
        </div>

        <h3 className="text-base font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {feedback.title}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
          {feedback.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> {feedback.comments_count || 0}
            </span>
            <span>•</span>
            <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
          </div>
          {feedback.creator_name && (
            <div className="flex items-center gap-1.5 opacity-60">
              <span className="text-[10px] font-bold uppercase">{feedback.creator_name.split(' ')[0]}</span>
              {feedback.creator_avatar && <img src={feedback.creator_avatar} className="w-4 h-4 rounded-full" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
