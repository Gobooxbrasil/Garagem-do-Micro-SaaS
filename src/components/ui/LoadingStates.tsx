
import React from 'react';
import { Loader2 } from 'lucide-react';

// Skeleton para listas de ideias/projetos
export const IdeasListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse h-[300px] flex flex-col">
          <div className="bg-gray-200 h-32 w-full rounded-xl mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-auto"></div>
          <div className="flex justify-between mt-4 pt-4 border-t border-gray-50">
            <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
            <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Loader overlay para ações globais (fullscreen)
export const ActionLoader = ({ message = "Processando..." }: { message?: string }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4">
        <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
        <p className="text-gray-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

// Loader específico para transações financeiras
export const TransactionLoader = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-blue-100 border-t-apple-blue rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-apple-blue">R$</span>
        </div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-bold text-gray-800">Processando Pagamento</p>
        <p className="text-sm text-gray-500">Verificando comprovante e notificando o criador...</p>
      </div>
      <div className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-apple-blue w-full animate-[progress_1.5s_ease-in-out_infinite] origin-left"></div>
      </div>
    </div>
  );
};
