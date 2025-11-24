
import React, { useState, useRef, useEffect } from 'react';
import { Idea } from '../types';
import { X, Lightbulb, Upload, Trash2, AlertCircle, ChevronDown, Plus, Search, FileCode, DollarSign, EyeOff, Lock, Phone, Mail, Eye, Info, CheckCircle2 } from 'lucide-react';
import { PRESET_NICHES } from '../constants';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: any) => void; 
  initialData?: Idea | null;
}

// Componente Helper para Tooltips
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex items-center ml-1.5 align-middle z-50">
    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-apple-blue transition-colors" />
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm text-white text-[11px] font-medium py-2.5 px-3.5 rounded-xl shadow-xl border border-white/10 relative leading-relaxed text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></div>
      </div>
    </div>
  </div>
);

const NewIdeaModal: React.FC<NewIdeaModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    niche: '',
    pain: '',
    solution: '',
    why: '', // Novo campo
    why_is_private: false,
    pricing_model: '',
    target: '',
    sales_strategy: '',
    pdr: '',
    images: [] as string[],
    
    // Monetization
    monetization_type: 'NONE' as 'NONE' | 'DONATION' | 'PAID',
    price: '',
    hidden_fields: [] as string[],
    contact_phone: '',
    contact_email: ''
  });

  // Populate form on open/edit
  useEffect(() => {
    if (isOpen && initialData) {
        setFormData({
            title: initialData.title || '',
            niche: initialData.niche || '',
            pain: initialData.pain || '',
            solution: initialData.solution || '',
            why: initialData.why || '',
            why_is_private: initialData.why_is_private || false,
            pricing_model: initialData.pricing_model || '',
            target: initialData.target || '',
            sales_strategy: initialData.sales_strategy || '',
            pdr: initialData.pdr || '',
            images: initialData.images || [],
            monetization_type: (initialData.monetization_type as any) || 'NONE',
            price: initialData.price ? String(initialData.price) : '',
            hidden_fields: initialData.hidden_fields || [],
            contact_phone: initialData.contact_phone || '',
            contact_email: initialData.contact_email || ''
        });
    } else if (isOpen && !initialData) {
        setFormData({
            title: '', niche: '', pain: '', solution: '', why: '', why_is_private: false,
            pricing_model: '', target: '', sales_strategy: '', pdr: '', images: [],
            monetization_type: 'NONE', price: '', hidden_fields: [], contact_phone: '', contact_email: ''
        });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.monetization_type === 'PAID') {
        if (!formData.price || Number(formData.price) <= 0) {
            setError("Para vender o projeto, defina um valor válido.");
            return;
        }
        if (!formData.contact_email || !formData.contact_phone) {
            setError("Para vender o projeto, email e telefone são obrigatórios.");
            return;
        }
    }
    onSave({
        ...formData,
        id: initialData?.id,
        price: formData.price ? Number(formData.price) : undefined,
        why_is_private: !!formData.why_is_private 
    });
    onClose();
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleHiddenField = (field: string) => {
    setFormData(prev => {
        const current = prev.hidden_fields;
        if (current.includes(field)) {
            return { ...prev, hidden_fields: current.filter(f => f !== field) };
        } else {
            return { ...prev, hidden_fields: [...current, field] };
        }
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB.');
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, index) => index !== indexToRemove) }));
  };

  const renderVisibilityToggle = (field: string) => {
      if (formData.monetization_type !== 'PAID') return null;
      const isHidden = formData.hidden_fields.includes(field);
      return (
        <button type="button" onClick={() => toggleHiddenField(field)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isHidden ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
            {isHidden ? <><EyeOff className="w-3.5 h-3.5" /><span>CONTEÚDO OCULTO</span></> : <><Eye className="w-3.5 h-3.5" /><span>Visível para todos</span></>}
        </button>
      );
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl p-3 text-apple-text focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide flex items-center";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200/50">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-apple-text tracking-tight flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-400 fill-yellow-400" /> {initialData ? 'Editar Ideia' : 'Nova Ideia'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Compartilhe uma dor real ou uma oportunidade de negócio.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <form id="ideaForm" onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Título da Ideia</label>
                <input required name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Ex: Tinder para Adotar Pets" />
              </div>
              <div>
                <label className={labelClass}>Nicho / Mercado</label>
                <select required name="niche" value={formData.niche} onChange={handleChange} className={inputClass}>
                    <option value="">Selecione...</option>
                    {PRESET_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            {/* Pain */}
            <div>
              <div className="flex justify-between items-center mb-1">
                  <label className={labelClass}>
                      <AlertCircle className="w-3.5 h-3.5 mr-1.5" /> A Dor Específica (O Problema)
                      <InfoTooltip text="Qual dor ou dificuldade os clientes enfrentam no dia a dia que este produto vai resolver?" />
                  </label>
                  {renderVisibilityToggle('pain')}
              </div>
              <textarea required name="pain" value={formData.pain} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Descreva a dor que seu público sente..." />
            </div>

            {/* Solution */}
            <div>
              <div className="flex justify-between items-center mb-1">
                  <label className={labelClass}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> A Solução (O Produto)
                      <InfoTooltip text="Como este produto elimina o problema dos clientes de forma simples e eficaz?" />
                  </label>
                  {renderVisibilityToggle('solution')}
              </div>
              <textarea required name="solution" value={formData.solution} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Como sua ideia resolve esse problema?" />
            </div>

            {/* Why - NEW FIELD */}
            <div>
              <div className="flex justify-between items-center mb-1">
                  <label className={labelClass}>
                      <Lightbulb className="w-3.5 h-3.5 mr-1.5" /> Por que é um bom Micro SaaS (Descrição)?
                      <InfoTooltip text="Por que o churn é baixo? Por que o MVP é simples? Por que o valor é percebido rápido?" />
                  </label>
                  <div className="flex items-center gap-2">
                     {renderVisibilityToggle('why')}
                     <button
                        type="button"
                        onClick={() => setFormData(p => ({...p, why_is_private: !p.why_is_private}))}
                        className={`p-1.5 rounded-md transition-colors ${formData.why_is_private ? 'bg-zinc-100 text-zinc-900' : 'text-gray-400 hover:text-gray-600'}`}
                        title="Ocultar do público geral (Visível apenas para você)"
                     >
                        {formData.why_is_private ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                  </div>
              </div>
              <textarea 
                  name="why" 
                  value={formData.why} 
                  onChange={handleChange} 
                  className={`${inputClass} h-24 resize-none ${formData.why_is_private ? 'bg-zinc-50 border-zinc-300' : ''}`} 
                  placeholder="Explique o diferencial, a simplicidade ou o potencial de receita..." 
              />
              {formData.why_is_private && <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1"><Lock className="w-3 h-3"/> Este campo ficará visível apenas para você.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Modelo de Preço</label>
                <input required name="pricing_model" value={formData.pricing_model} onChange={handleChange} className={inputClass} placeholder="Ex: Assinatura R$ 29/mês" />
              </div>
              <div>
                <label className={labelClass}>Público Alvo (Target)</label>
                <input required name="target" value={formData.target} onChange={handleChange} className={inputClass} placeholder="Ex: Dentistas, Pequenas Empresas..." />
              </div>
            </div>

            <div>
              <label className={labelClass}>Estratégia de Vendas</label>
              <textarea required name="sales_strategy" value={formData.sales_strategy} onChange={handleChange} className={`${inputClass} h-20 resize-none`} placeholder="Como você vai conseguir os primeiros 10 clientes?" />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                  <label className={labelClass}>
                      <FileCode className="w-3.5 h-3.5 mr-1.5" /> Briefing Técnico (PRD) - Opcional
                      <InfoTooltip text="É o documento que explica a ideia do Micro SaaS, as funcionalidades, as regras e como a IA deve agir,  tudo de forma organizada para que a ferramenta consiga criar o produto corretamente." />
                  </label>
                  {renderVisibilityToggle('pdr')}
              </div>
              <textarea name="pdr" value={formData.pdr} onChange={handleChange} className={`${inputClass} h-32 font-mono text-sm bg-slate-50`} placeholder="// Detalhes técnicos, stack sugerida, arquitetura..." />
            </div>

            {/* Images */}
            <div>
                <label className={labelClass}>Imagens de Referência (Opcional)</label>
                <div className="flex flex-wrap gap-4 mt-2">
                    {formData.images.map((img, idx) => (
                        <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 group">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-5 h-5 text-white" /></button>
                        </div>
                    ))}
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-apple-blue hover:bg-blue-50 transition-colors text-gray-400 hover:text-apple-blue">
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-[9px] font-bold uppercase">Adicionar</span>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
            </div>

            {/* Monetization Section */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" /> Monetizar esta Ideia
                </h3>
                
                <div className="flex gap-2 mb-6 p-1 bg-gray-200 rounded-lg">
                    {['NONE', 'DONATION', 'PAID'].map((type) => (
                        <button
                            key={type}
                            type="button"
                            onClick={() => setFormData(p => ({...p, monetization_type: type as any}))}
                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${formData.monetization_type === type ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {type === 'NONE' ? 'Grátis' : type === 'DONATION' ? 'Aceitar Doações' : 'Vender Acesso'}
                        </button>
                    ))}
                </div>

                {formData.monetization_type === 'PAID' && (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800 mb-2">
                            Ao vender o acesso, partes do conteúdo (PDR, Solução, etc) serão ocultadas até o pagamento.
                        </div>
                        <div>
                            <label className={labelClass}>Valor do Acesso (R$)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className={inputClass} placeholder="Ex: 50.00" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}><Phone className="w-3 h-3 mr-1" /> WhatsApp Contato</label>
                                <input type="tel" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className={inputClass} placeholder="(11) 99999-9999" />
                            </div>
                            <div>
                                <label className={labelClass}><Mail className="w-3 h-3 mr-1" /> Email Contato</label>
                                <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={inputClass} placeholder="seu@email.com" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-black font-medium transition-colors">Cancelar</button>
          <button type="submit" form="ideaForm" className="bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-8 rounded-full shadow-lg shadow-black/20 transition-all hover:scale-105">
            {initialData ? 'Salvar Alterações' : 'Publicar Ideia'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewIdeaModal;