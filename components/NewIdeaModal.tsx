
import React, { useState, useRef, useEffect } from 'react';
import { Idea } from '../types';
import { X, Lightbulb, Upload, Trash2, AlertCircle, ChevronDown, Plus, Search } from 'lucide-react';
import { PRESET_NICHES } from '../constants';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: Omit<Idea, 'id' | 'votes_count' | 'is_building' | 'isFavorite' | 'created_at'>) => void;
}

const NewIdeaModal: React.FC<NewIdeaModalProps> = ({ isOpen, onClose, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Niche Selection State
  const [showNicheList, setShowNicheList] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    niche: '',
    pain: '',
    solution: '',
    why: '',
    pricing_model: '',
    target: '',
    sales_strategy: '',
    images: [] as string[]
  });

  // Close niche dropdown when clicking outside (simulated with backdrop in return)

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
      sales_strategy: '',
      images: []
    });
    setError(null);
    setShowNicheList(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const selectNiche = (niche: string) => {
    setFormData(prev => ({ ...prev, niche }));
    setShowNicheList(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    // Validação de Tamanho (2MB = 2 * 1024 * 1024 bytes)
    if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB.');
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, base64String]
        }));
    };
    reader.readAsDataURL(file);
    
    // Limpar input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl p-3 text-apple-text focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200/50 relative z-20">
        
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
        <div className="overflow-y-auto p-8 space-y-6 custom-scrollbar relative">
          <form id="ideaForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Upload Section */}
            <div>
                <label className={labelClass}>Imagens de Referência (Opcional)</label>
                <div className="space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {/* Upload Button */}
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-apple-blue hover:bg-blue-50 transition-all group"
                        >
                            <Upload className="w-6 h-6 text-gray-400 group-hover:text-apple-blue mb-1" />
                            <span className="text-[10px] font-bold text-gray-400 group-hover:text-apple-blue">Adicionar</span>
                            <span className="text-[8px] text-gray-300 group-hover:text-apple-blue/70">Max 2MB</span>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleImageUpload}
                        />

                        {/* Image Previews */}
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Título da Ideia</label>
                <input required name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Ex: Uber para Passeadores de Cães" />
              </div>
              
              {/* Niche Combobox */}
              <div className="relative">
                <label className={labelClass}>Nicho / Mercado</label>
                <div className="relative">
                    <input 
                        required 
                        name="niche" 
                        value={formData.niche} 
                        onChange={(e) => {
                            handleChange(e);
                            setShowNicheList(true);
                        }}
                        onFocus={() => setShowNicheList(true)}
                        className={`${inputClass} pr-10`} 
                        placeholder="Selecione ou digite..."
                        autoComplete="off" 
                    />
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Dropdown */}
                {showNicheList && (
                    <>
                        <div className="absolute z-30 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                            {PRESET_NICHES.filter(n => n.toLowerCase().includes(formData.niche.toLowerCase())).map(niche => (
                                <button
                                    key={niche}
                                    type="button"
                                    onClick={() => selectNiche(niche)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors flex items-center gap-2 border-b border-gray-50 last:border-0"
                                >
                                    {niche}
                                </button>
                            ))}
                            {formData.niche && !PRESET_NICHES.some(n => n.toLowerCase() === formData.niche.toLowerCase()) && (
                                <button
                                    type="button"
                                    onClick={() => selectNiche(formData.niche)}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-apple-blue font-bold transition-colors flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3" /> Criar nicho "{formData.niche}"
                                </button>
                            )}
                             {PRESET_NICHES.filter(n => n.toLowerCase().includes(formData.niche.toLowerCase())).length === 0 && !formData.niche && (
                                <div className="p-3 text-xs text-gray-400 text-center">Comece a digitar...</div>
                            )}
                        </div>
                        {/* Backdrop to close dropdown */}
                        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setShowNicheList(false)}></div>
                    </>
                )}
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
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-4 relative z-30">
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
