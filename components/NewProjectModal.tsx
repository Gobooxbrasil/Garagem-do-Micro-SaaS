import React, { useState } from 'react';
import { Project } from '../types';
import { X, Upload } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'reviews'>) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    link_url: '',
    demo_email: '',
    demo_password: '',
    maker_id: '',
    images: ['https://picsum.photos/800/600?random=100']
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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