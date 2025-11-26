
import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Trash2, AlertCircle, Rocket, Youtube, Target, Megaphone, CheckSquare, Square, Mail, Key } from 'lucide-react';
import { Idea } from '../../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: any) => void;
  initialData?: Idea | null;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '', 
    niche: '', 
    showroom_description: '', 
    showroom_link: '', 
    showroom_image: '', 
    showroom_video_url: '',
    showroom_objective: 'feedback' as 'feedback' | 'showcase',
    publish_to_showroom: true,
    
    // Campos de Idea
    pain: '', 
    solution: '', 
    tech_stack: '', 
    
    // Auth/Demo Credentials (Exigido update no SQL: ALTER TABLE ideas ADD COLUMN demo_email TEXT...)
    demo_email: '',
    demo_password: '',
  });

  // Populate form on open/edit
  useEffect(() => {
    if (isOpen && initialData) {
        setFormData({
            title: initialData.title || '',
            niche: initialData.niche || '',
            showroom_description: initialData.showroom_description || initialData.solution || '',
            showroom_link: initialData.showroom_link || '',
            showroom_image: initialData.showroom_image || (initialData.images && initialData.images[0]) || '',
            showroom_video_url: initialData.showroom_video_url || '',
            showroom_objective: initialData.showroom_objective || 'feedback',
            publish_to_showroom: true, // Se está abrindo aqui, é para publicar/editar no showroom

            pain: initialData.pain || '',
            solution: initialData.solution || '',
            tech_stack: initialData.pdr || '', // Mapping simple PDR to stack for now
            
            demo_email: initialData.demo_email || '',
            demo_password: initialData.demo_password || ''
        });
    } else if (isOpen && !initialData) {
        // Reset if new
        setFormData({
            title: '', niche: '', showroom_description: '', showroom_link: '', 
            showroom_image: '', showroom_video_url: '', showroom_objective: 'feedback', 
            publish_to_showroom: true, pain: '', solution: '', tech_stack: '', 
            demo_email: '', demo_password: ''
        });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const now = new Date().toISOString();

    // Adapter para o formato de Idea
    const ideaPayload = {
        id: initialData?.id, // Se existir, é update
        title: formData.title,
        niche: formData.niche || 'Outros',
        
        // Showroom Specifics
        is_showroom: formData.publish_to_showroom,
        showroom_description: formData.showroom_description,
        showroom_link: formData.showroom_link,
        showroom_image: formData.showroom_image,
        showroom_video_url: formData.showroom_video_url,
        showroom_objective: formData.showroom_objective,
        showroom_approved_at: formData.publish_to_showroom ? (initialData?.showroom_approved_at || now) : null,
        
        // Default Idea Fields
        pain: formData.pain || formData.showroom_description.substring(0, 100), 
        solution: formData.solution || "Solução implementada no projeto.",
        why: formData.showroom_objective === 'feedback' ? "Busco Feedback" : "Showcase",
        
        // Only override PDR if creating new or if explicit
        pdr: formData.tech_stack || initialData?.pdr,

        // Demo Credentials Payload
        demo_email: formData.demo_email,
        demo_password: formData.demo_password
    };

    onSave(ideaPayload);
    onClose();
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);
    if (file.size > 5 * 1024 * 1024) { 
        setError('A imagem deve ter no máximo 5MB.');
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
        setFormData(prev => ({ ...prev, showroom_image: reader.result as string }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const inputClass = "w-full bg-white border border-gray-200 rounded-xl p-3 text-apple-text focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide flex items-center gap-1.5";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200/50">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-apple-text tracking-tight flex items-center gap-2">
              <Rocket className="w-6 h-6 text-purple-600" /> {initialData ? 'Editar Projeto' : 'Publicar MVP'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Mostre seu projeto rodando para a comunidade.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <form id="projectForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Publish Checkbox */}
            <div 
                onClick={() => setFormData(p => ({...p, publish_to_showroom: !p.publish_to_showroom}))}
                className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${formData.publish_to_showroom ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}
            >
                <div className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${formData.publish_to_showroom ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-gray-300'}`}>
                    {formData.publish_to_showroom && <CheckSquare className="w-4 h-4" />}
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-sm">Publicar no Showroom</p>
                    <p className="text-xs text-gray-500">Seu projeto ficará visível na aba Showroom imediatamente.</p>
                </div>
            </div>

            {/* Objective Selection */}
            <div>
                 <label className={labelClass}>Qual o objetivo desta publicação?</label>
                 <div className="grid grid-cols-2 gap-4">
                     <button
                        type="button"
                        onClick={() => setFormData(p => ({...p, showroom_objective: 'feedback'}))}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.showroom_objective === 'feedback' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-200 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                     >
                         <Target className={`w-6 h-6 ${formData.showroom_objective === 'feedback' ? 'text-indigo-600' : 'text-gray-400'}`} />
                         <span className="font-bold text-sm">Quero Feedback</span>
                         <span className="text-xs opacity-70">Busco testadores e opiniões para melhorar</span>
                     </button>
                     <button
                        type="button"
                        onClick={() => setFormData(p => ({...p, showroom_objective: 'showcase'}))}
                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.showroom_objective === 'showcase' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-200 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                     >
                         <Megaphone className={`w-6 h-6 ${formData.showroom_objective === 'showcase' ? 'text-emerald-600' : 'text-gray-400'}`} />
                         <span className="font-bold text-sm">Apenas Divulgar</span>
                         <span className="text-xs opacity-70">O produto está pronto, quero usuários</span>
                     </button>
                 </div>
            </div>

            {/* Upload Section */}
            <div>
                <label className={labelClass}>Screenshot / Preview (Capa)</label>
                <div className="mt-2">
                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100 mb-3">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {!formData.showroom_image ? (
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-apple-blue hover:bg-blue-50 transition-all group"
                        >
                            <Upload className="w-8 h-8 text-gray-400 group-hover:text-apple-blue mb-2" />
                            <span className="text-sm font-bold text-gray-400 group-hover:text-apple-blue">Upload da Imagem</span>
                            <span className="text-xs text-gray-300 group-hover:text-apple-blue/70">PNG, JPG (Max 5MB)</span>
                        </div>
                    ) : (
                        <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-gray-200 group">
                            <img src={formData.showroom_image} alt="Preview" className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => setFormData(p => ({...p, showroom_image: ''}))}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-8 h-8 text-white" />
                            </button>
                        </div>
                    )}
                   
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Nome do Projeto</label>
                <input required name="title" value={formData.title} onChange={handleChange} className={inputClass} placeholder="Ex: Financeiro.io" />
              </div>
              <div>
                <label className={labelClass}>Categoria</label>
                <select required name="niche" value={formData.niche} onChange={handleChange} className={inputClass}>
                    <option value="">Selecione...</option>
                    <option value="Finanças">Finanças</option>
                    <option value="Saúde & Bem-estar">Saúde & Bem-estar</option>
                    <option value="Educação">Educação</option>
                    <option value="Produtividade">Produtividade</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="IA & Machine Learning">IA & Machine Learning</option>
                    <option value="Dev Tools">Dev Tools</option>
                    <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className={labelClass}>Link do Projeto (URL)</label>
                    <input type="url" required name="showroom_link" value={formData.showroom_link} onChange={handleChange} className={inputClass} placeholder="https://..." />
                 </div>
                 <div>
                    <label className={labelClass}>Vídeo do Youtube (Opcional)</label>
                    <div className="relative">
                        <Youtube className="absolute left-3 top-3.5 w-4 h-4 text-red-500" />
                        <input 
                            type="url" 
                            name="showroom_video_url" 
                            value={formData.showroom_video_url} 
                            onChange={handleChange} 
                            className={`${inputClass} pl-10`} 
                            placeholder="https://youtube.com/watch?v=..." 
                        />
                    </div>
                 </div>
            </div>

            <div>
              <label className={labelClass}>Descrição do Projeto</label>
              <textarea required name="showroom_description" value={formData.showroom_description} onChange={handleChange} className={`${inputClass} h-32 resize-none`} placeholder="O que seu projeto faz? Qual problema resolve?" />
            </div>

            {/* Optional Fields Toggle */}
            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
              <h3 className="text-sm font-bold text-apple-text mb-4 flex items-center gap-2">
                 Detalhes Opcionais
              </h3>
              
              <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Stack Tecnológica (Separar por vírgula)</label>
                    <input name="tech_stack" value={formData.tech_stack} onChange={handleChange} className={inputClass} placeholder="Ex: React, Node.js, Supabase" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}><Mail className="w-3.5 h-3.5" /> Email de Demo (Opcional)</label>
                        <input name="demo_email" value={formData.demo_email} onChange={handleChange} className={inputClass} placeholder="usuario@demo.com" />
                      </div>
                      <div>
                        <label className={labelClass}><Key className="w-3.5 h-3.5" /> Senha de Demo (Opcional)</label>
                        <input name="demo_password" value={formData.demo_password} onChange={handleChange} className={inputClass} placeholder="123456" />
                      </div>
                  </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-black font-medium transition-colors">Cancelar</button>
          <button type="submit" form="projectForm" className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-8 rounded-full shadow-lg shadow-purple-500/20 transition-all hover:scale-105">
            {initialData ? 'Salvar Alterações' : 'Publicar no Showroom'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;
