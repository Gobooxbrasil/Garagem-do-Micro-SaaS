
import React, { useState } from 'react';
import { X, Send, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useCreateFeedback } from '../../hooks/use-feedback';

interface CreateFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const CreateFeedbackModal: React.FC<CreateFeedbackModalProps> = ({ isOpen, onClose, userId }) => {
  const mutation = useCreateFeedback();
  const [formData, setFormData] = useState({
      title: '',
      description: '',
      type: 'feature'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      mutation.mutate({ ...formData, user_id: userId }, {
          onSuccess: () => {
              onClose();
              setFormData({ title: '', description: '', type: 'feature' });
          }
      });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500 fill-yellow-500" /> Nova Sugestão
            </h2>
            <p className="text-sm text-gray-500 mb-6">Ajude a melhorar a Garagem com suas ideias.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mutation.isError && (
                    <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">Erro ao criar sugestão:</p>
                            <p>{mutation.error?.message || "Erro desconhecido. Verifique o console."}</p>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tipo</label>
                    <div className="flex gap-2 flex-wrap">
                        {['feature', 'bug', 'improvement', 'other'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setFormData(p => ({...p, type: t}))}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize border transition-colors ${formData.type === t ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {t === 'feature' ? 'Feature' : t === 'bug' ? 'Bug' : t === 'improvement' ? 'Melhoria' : 'Outro'}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Título</label>
                    <input 
                        required
                        value={formData.title}
                        onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                        placeholder="Ex: Modo Escuro"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-all"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Descrição</label>
                    <textarea 
                        required
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({...p, description: e.target.value}))}
                        placeholder="Descreva detalhadamente..."
                        className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:border-blue-500 transition-all resize-none"
                    />
                </div>

                <div className="pt-2 flex justify-end">
                    <button 
                        type="submit"
                        disabled={mutation.isPending}
                        className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-black/10"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Enviar Sugestão
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
