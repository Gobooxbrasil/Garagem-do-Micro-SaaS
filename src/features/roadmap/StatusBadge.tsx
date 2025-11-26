
import React from 'react';
import { FeedbackStatus } from '../../types';

const statusConfig: Record<FeedbackStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-gray-100 text-gray-500' },
  planned: { label: 'Planejado', className: 'bg-blue-50 text-blue-600 border border-blue-100' },
  in_progress: { label: 'Em Progresso', className: 'bg-yellow-50 text-yellow-600 border border-yellow-100' },
  completed: { label: 'Concluído', className: 'bg-green-50 text-green-600 border border-green-100' },
  rejected: { label: 'Rejeitado', className: 'bg-red-50 text-red-600' },
};

export const StatusBadge: React.FC<{ status: FeedbackStatus }> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.className}`}>
      {config.label}
    </span>
  );
};
