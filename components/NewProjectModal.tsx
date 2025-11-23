import React, { useState, useRef } from 'react';
import { Project } from '../types';
import { X, Upload, Image as ImageIcon, Trash2, AlertCircle } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'reviews'>) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    link_url: '',
    demo_email: '',
    demo_password: '',
    maker_id: '',
    images: [] as string[]
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    // Reset form
    setFormData({
        name: '',
        tagline: '',
        description: '',
        link_url: '',
        demo_email: '',
        demo_password: '',
        maker_id: '',
        images: []
    });
    setError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente se quiser
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
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200/50">
        
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-apple-text tracking-tight">
              Novo Projeto
            </h2>
            <p className="text-sm text-gray-500 mt-1">Compartilhe sua criação com o mundo.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <form id="projectForm" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Upload Section */}
            <div>
                <label className={labelClass}>Galeria do Projeto</label>
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
                    {formData.images.length === 0 && (
                        <p className="text-xs text-gray-400 italic flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Caso nenhuma imagem seja enviada, usaremos uma ilustração padrão.
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Nome do Projeto</label>
                <input required name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="Ex: Financeiro.io" />
              </div>
              <div>
                <label className={labelClass}>Seu Handle</label>
                <input required name="maker_id" value={formData.maker_id} onChange={handleChange} className={inputClass} placeholder="@usuario" />
              </div>
            </div>

            <div>
              <label className={labelClass}>Tagline</label>
              <input required name="tagline" value={formData.tagline} onChange={handleChange} className={inputClass} placeholder="Uma frase curta e impactante." />
            </div>

            <div>
              <label className={labelClass}>Descrição</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} className={`${inputClass} h-32 resize-none`} placeholder="Detalhes sobre o problema, solução e stack tecnológica..." />
            </div>

            <div>
              <label className={labelClass}>Link do Projeto</label>
              <input type="url" required name="link_url" value={formData.link_url} onChange={handleChange} className={inputClass} placeholder="https://..." />
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-dashed border-gray-300">
              <h3 className="text-sm font-bold text-apple-text mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4 text-gray-500" /> Acesso Demo (Opcional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <input name="demo_email" value={formData.demo_email} onChange={handleChange} className={inputClass} placeholder="Email" />
                <input name="demo_password" value={formData.demo_password} onChange={handleChange} className={inputClass} placeholder="Senha" />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 rounded-b-3xl flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-black font-medium transition-colors">Cancelar</button>
          <button type="submit" form="projectForm" className="bg-apple-blue hover:bg-apple-blueHover text-white font-medium py-2.5 px-8 rounded-full shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
            Publicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;