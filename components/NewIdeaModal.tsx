import React, { useState, useRef, useEffect } from 'react';
import { Idea } from '../types';
import { X, Lightbulb, Upload, Trash2, AlertCircle, ChevronDown, Plus, Search, FileCode, DollarSign, EyeOff, Lock, Phone, Mail, Eye, Info } from 'lucide-react';
import { PRESET_NICHES } from '../constants';

interface NewIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (idea: any) => void; // Relaxed type to handle both create and update payload
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
  
  // Niche Selection State
  const [showNicheList, setShowNicheList] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    niche: '',
    pain: '',
    solution: '',
    why: '',
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
        // Reset
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
    
    // Validations for PAID model
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
        id: initialData?.id, // Pass ID if editing
        price: formData.price ? Number(formData.price) : undefined,
        why_is_private: !!formData.why_is_private 
    });
    
    onClose();
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

  // Helper para renderizar o botão de toggle de visibilidade
  const renderVisibilityToggle = (field: string) => {
      if (formData.monetization_type !== 'PAID') return null;
      
      const isHidden = formData.hidden_fields.includes(field);

      return (
        <button 
            type="button" 
            onClick={() => toggleHiddenField(field)} 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isHidden 
                ? 'bg-red-50 text-red-600 border-red-200 shadow-sm' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
            {isHidden ? (
                <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>CONTEÚDO OCULTO</span>
                </>
            ) : (
                <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visível para todos</span>
                </>
            )}
        </button>
      );
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl p-3 text-apple-text focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide flex items-center";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200/50 relative z-20">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-apple-text tracking-tight flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-yellow-500 fill-yellow-500" /> {initialData ? 'Editar Ideia' : 'Nova Ideia'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{initialData ? 'Atualize os detalhes do projeto.' : 'Compartilhe um problema que precisa de solução.'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-8 space-y-6 custom-scrollbar relative">
          <form id="ideaForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {/* Images */}
            <div>
                <label className={labelClass}>Imagens de Referência</label>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-apple-blue hover:bg-blue-50 transition-all group"
                    >
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-apple-blue mb-1" />
                        <span className="text-[10px] font-bold text-gray-400 group-hover:text-apple-blue">Adicionar</span>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
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

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Título</label>
                <input required name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Ex: Uber para Passeadores" />
              </div>
              
              <div className="relative">
                <label className={labelClass}>Nicho</label>
                <div className="relative">
                    <input 
                        required 
                        name="niche" 
                        value={formData.niche} 
                        onChange={(e) => { handleChange(e); setShowNicheList(true); }}
                        onFocus={() => setShowNicheList(true)}
                        className={`${inputClass} pr-10`} 
                        placeholder="Selecione..."
                        autoComplete="off" 
                    />
                    <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {showNicheList && (
                    <>
                        <div className="absolute z-30 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                            {PRESET_NICHES.filter(n => n.toLowerCase().includes(formData.niche.toLowerCase())).map(niche => (
                                <button
                                    key={niche}
                                    type="button"
                                    onClick={() => selectNiche(niche)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 font-medium border-b border-gray-50"
                                >
                                    {niche}
                                </button>
                            ))}
                            {formData.niche && !PRESET_NICHES.some(n => n.toLowerCase() === formData.niche.toLowerCase()) && (
                                <button type="button" onClick={() => selectNiche(formData.niche)} className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-apple-blue font-bold">
                                    <Plus className="w-3 h-3 inline mr-1" /> Criar "{formData.niche}"
                                </button>
                            )}
                        </div>
                        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setShowNicheList(false)}></div>
                    </>
                )}
              </div>
            </div>

            {/* MONETIZATION SECTION */}
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200">
                <h3 className="text-sm font-bold text-apple-text mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" /> Monetização do Projeto
                </h3>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, monetization_type: 'NONE' }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.monetization_type === 'NONE' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Gratuito
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, monetization_type: 'DONATION' }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.monetization_type === 'DONATION' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Aceitar Doações
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setFormData(prev => ({ ...prev, monetization_type: 'PAID' }))}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${formData.monetization_type === 'PAID' ? 'bg-green-600 text-white border-green-600 shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Vender Acesso
                    </button>
                </div>

                {formData.monetization_type === 'DONATION' && (
                    <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800">
                        Os usuários poderão optar por doar qualquer valor. O QR Code Pix configurado no seu perfil será exibido para eles.
                    </div>
                )}

                {formData.monetization_type === 'PAID' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                        {/* DISCLAIMER ABOUT VISIBILITY */}
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 shadow-sm">
                           <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                           <div className="space-y-1">
                                <p className="text-xs font-bold text-amber-800 uppercase">Como funciona a venda</p>
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    O título, nicho e imagens do seu projeto <u>sempre estarão visíveis</u> na vitrine para atrair compradores. 
                                    Abaixo, você pode escolher exatamente quais campos (Dor, Solução ou PDR) deseja ocultar.
                                </p>
                           </div>
                        </div>

                        <div>
                            <label className={labelClass}>Valor (R$)</label>
                            <input 
                                type="number" 
                                name="price" 
                                value={formData.price} 
                                onChange={handleChange} 
                                className={inputClass} 
                                placeholder="Ex: 50.00"
                                min="1"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email de Contato (Obrigatório)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input required type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="seu@email.com" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">WhatsApp/Telefone (Obrigatório)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input required type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className={`${inputClass} pl-10`} placeholder="(11) 99999-9999" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Core Idea */}
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className={labelClass + " mb-0"}>
                    A Dor Específica (O Problema) 
                    <InfoTooltip text="Qual dor ou dificuldade os clientes enfrentam no dia a dia que este produto vai resolver?" />
                </label>
                {renderVisibilityToggle('pain')}
              </div>
              <textarea required name="pain" value={formData.pain} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Qual é o problema real?" />
            </div>

            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className={labelClass + " mb-0"}>
                    A Solução (O Produto)
                    <InfoTooltip text="Como este produto elimina o problema dos clientes de forma simples e eficaz?" />
                </label>
                {renderVisibilityToggle('solution')}
              </div>
              <textarea required name="solution" value={formData.solution} onChange={handleChange} className={`${inputClass} h-24 resize-none`} placeholder="Como resolver isso?" />
            </div>

            {/* PDR */}
            <div className={`p-4 rounded-xl border border-dashed ${formData.monetization_type === 'PAID' && formData.hidden_fields.includes('pdr') ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-indigo-600" />
                    <label className="text-xs font-bold text-indigo-800 uppercase tracking-wide flex items-center">
                        PDR (Tech Specs)
                        <InfoTooltip text="Quais tecnologias e funcionalidades técnicas são necessárias para desenvolver este produto?" />
                    </label>
                  </div>
                  {renderVisibilityToggle('pdr')}
               </div>
               <textarea 
                  name="pdr" 
                  value={formData.pdr} 
                  onChange={handleChange} 
                  className={`${inputClass} h-32 resize-none font-mono text-xs`} 
                  placeholder="Stack, Fluxo de dados, Requisitos..." 
               />
            </div>

            {/* Extra Info */}
            <div>
               <div className="flex justify-between items-center">
                   <label className={labelClass}>
                       Por que é um bom Micro SaaS?
                       <InfoTooltip text="Por que o churn é baixo? Por que o MVP é simples? Por que o valor é percebido rápido?" />
                   </label>
                   
                   <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                        <input 
                            type="checkbox"
                            checked={formData.why_is_private}
                            onChange={(e) => setFormData(prev => ({ ...prev, why_is_private: e.target.checked }))}
                            className="rounded border-gray-300 text-apple-blue focus:ring-apple-blue"
                        />
                        <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                            {formData.why_is_private ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {formData.why_is_private ? 'Oculto' : 'Público'}
                        </span>
                   </label>
               </div>
               <input required name="why" value={formData.why} onChange={handleChange} className={inputClass} placeholder="Por que isso vai funcionar?" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div>
                    <label className={labelClass}>
                        Modelo de Receita
                        <InfoTooltip text="Como este negócio gera receita? Ex: assinatura mensal, venda única, comissões, etc." />
                    </label>
                    <input required name="pricing_model" value={formData.pricing_model} onChange={handleChange} className={inputClass} placeholder="Ex: SaaS" />
                </div>
                <div>
                    <label className={labelClass}>
                        Público Alvo
                        <InfoTooltip text="Quem são as pessoas que vão comprar este produto? Descreva idade, interesses e necessidades." />
                    </label>
                    <input required name="target" value={formData.target} onChange={handleChange} className={inputClass} placeholder="Ex: B2B" />
                </div>
                <div>
                    <label className={labelClass}>
                        Estratégia
                        <InfoTooltip text="Qual é o plano para atrair clientes e fechar vendas? Ex: redes sociais, anúncios, indicações." />
                    </label>
                    <input required name="sales_strategy" value={formData.sales_strategy} onChange={handleChange} className={inputClass} placeholder="Ex: SEO" />
                </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-4 relative z-30">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-black font-medium transition-colors">Cancelar</button>
          <button type="submit" form="ideaForm" className="bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-8 rounded-full shadow-lg shadow-black/20 transition-all hover:scale-105">
            {initialData ? 'Salvar Alterações' : 'Publicar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewIdeaModal;