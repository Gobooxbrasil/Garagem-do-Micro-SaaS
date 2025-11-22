import React, { useState } from 'react';
import { Idea } from '../types';
import { X, Lightbulb } from 'lucide-react';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Omit<Idea, 'id' | 'votes_count' | 'is_building' | 'isFavorite' | 'created_at'>) => void;
}

const NewIdeaModal: React.FC<NewIdeaModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    niche: '',
    pain: '',
    solution: '',
    why: '',
    pricing_model: '',
    target: '',
    sales_strategy: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    // Reset form
    setFormData({
      title: '',
      niche: '',
      pain: '',
      solution: '',
      why: '',
      pricing_model: '',
      target: '',
      sales_strategy: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl p-3 text-apple-text focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200/50">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-apple-text tracking-tight flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500 fill-yellow-500" /> Nova Ideia
            </h2>
            <p className="text-sm text-gray-500 mt-1">Compartilhe um problema que precisa de solução.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <form id="ideaForm" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Título da Ideia</label>
                <input required name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Ex: Uber para Passeadores de Cães" />
              </div>
              <div>
                <label className={labelClass}>Nicho / Mercado</label>
                <input required name="niche" value={formData.niche} onChange={handleChange} className={inputClass} placeholder="Ex: Pet, Saúde, Jurídico" />
              </div>
            </div>

            <div>
              <label className={labelClass}>A Dor (Pain Point)</label>
              <textarea required name="pain" value={formData.pain} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Qual é o problema real que as pessoas enfrentam?" />
            </div>

            <div>
              <label className={labelClass}>A Solução</label>
              <textarea required name="solution" value={formData.solution} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Como o software resolve isso de forma elegante?" />
            </div>

            <div>
               <label className={labelClass}>O "Porquê" (Diferencial)</label>
               <input required name="why" value={formData.why} onChange={handleChange} className={inputClass} placeholder="Por que isso vai funcionar agora?" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                    <label className={labelClass}>Modelo de Receita</label>
                    <input required name="pricing_model" value={formData.pricing_model} onChange={handleChange} className={inputClass} placeholder="Ex: SaaS Mensal" />
                </div>
                <div>
                    <label className={labelClass}>Público Alvo</label>
                    <input required name="target" value={formData.target} onChange={handleChange} className={inputClass} placeholder="Ex: B2B Pequenas Empresas" />
                </div>
                <div>
                    <label className={labelClass}>Estratégia de Venda</label>
                    <input required name="sales_strategy" value={formData.sales_strategy} onChange={handleChange} className={inputClass} placeholder="Ex: SEO, Cold Mail" />
                </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-black font-medium transition-colors">Cancelar</button>
          <button type="submit" form="ideaForm" className="bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-8 rounded-full shadow-lg shadow-black/20 transition-all hover:scale-105">
            Cadastrar Ideia
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewIdeaModal;