
import React from 'react';
import { FeedbackType } from '../../types';
import { Bug, Sparkles, Wrench, Lightbulb } from 'lucide-react';

const typeConfig: Record<FeedbackType, { label: string; icon: any; color: string }> = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-500' },
  feature: { label: 'Feature', icon: Sparkles, color: 'text-purple-500' },
  improvement: { label: 'Melhoria', icon: Wrench, color: 'text-blue-500' },
  other: { label: 'Outro', icon: Lightbulb, color: 'text-gray-500' },
};

export const TypeBadge: React.FC<{ type: FeedbackType }> = ({ type }) => {
  const config = typeConfig[type] || typeConfig.other;
  const Icon = config.icon;
  return (
    <div className="flex items-center gap-1.5" title={config.label}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className="text-xs font-semibold text-gray-600">{config.label}</span>
    </div>
  );
};
