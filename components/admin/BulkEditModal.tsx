
import React, { useState, useRef } from 'react';
import { X, Upload, Check, DollarSign, Mail, Tag, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import { PRESET_NICHES } from '../../constants';
import { supabase } from '../../lib/supabaseClient';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onSave: (updates: any) => Promise<void>;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({ isOpen, onClose, selectedCount, onSave }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // States para os valores
  const [niche, setNiche] = useState('');
  const [monetizationType, setMonetizationType] = useState<'NONE' | 'DONATION' | 'PAID'>('NONE');
  const [price, setPrice] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // States para habilitar a edição do campo (Checkboxes)
  const [updateNiche, setUpdateNiche] = useState(false);
  const [updateMonetization, setUpdateMonetization] = useState(false);
  const [updatePrice, setUpdatePrice] = useState(false);
  const [updateEmail, setUpdateEmail] = useState(false);
  const [updateImage, setUpdateImage] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setUpdateImage(true);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const updates: any = {};

      if (updateNiche) updates.niche = niche;
      
      if (updateMonetization) {
          updates.monetization_type = monetizationType;
          updates.payment_type = monetizationType === 'PAID' ? 'paid' : monetizationType === 'DONATION' ? 'donation' : 'free';
      }
      
      if (updatePrice) updates.price = parseFloat(price) || 0;
      
      if (updateEmail) updates.contact_email = contactEmail;

      if (updateImage && imageFile) {
          // Upload da imagem
          const fileExt = imageFile.name.split('.').pop();
          const fileName = `bulk_${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
              .from('project-images')
              .upload(fileName, imageFile);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
              .from('project-images')
              .getPublicUrl(fileName);

          updates.images = [publicUrl]; // Sobrescreve array de imagens principal
          updates.showroom_image = publicUrl; // Atualiza capa do showroom
      }

      // Se nenhum campo foi selecionado
      if (Object.keys(updates).length === 0) {
          alert("Selecione pelo menos um campo para atualizar.");
          setLoading(false);
          return;
      }

      await onSave(updates);
      onClose();
      
      // Reset states
      setUpdateNiche(false); setUpdateMonetization(false); setUpdatePrice(false); setUpdateEmail(false); setUpdateImage(false);
      setNiche(''); setPrice(''); setContactEmail(''); setImageFile(null); setImagePreview(null);

    } catch (error: any) {
      console.error(error);
      alert("Erro na atualização em massa: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edição em Massa</h2>
            <p className="text-sm text-gray-500">Aplicando alterações em <span className="font-bold text-black">{selectedCount}</span> itens selecionados.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-8 space-y-6">
            
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs text-yellow-800 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4" />
                Marque a caixa ao lado do campo para confirmar a alteração. Campos não marcados serão ignorados.
            </div>

            {/* Nicho */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${updateNiche ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'}`}>
                <input 
                    type="checkbox" 
                    checked={updateNiche} 
                    onChange={(e) => setUpdateNiche(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-grow">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                        <Tag className="w-4 h-4" /> Alterar Nicho
                    </label>
                    <select 
                        disabled={!updateNiche}
                        value={niche}
                        onChange={(e) => setNiche(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm disabled:opacity-50"
                    >
                        <option value="">Selecione...</option>
                        {PRESET_NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {/* Monetização e Preço */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${updateMonetization ? 'border-green-500 bg-green-50/50' : 'border-gray-200'}`}>
                    <input 
                        type="checkbox" 
                        checked={updateMonetization} 
                        onChange={(e) => setUpdateMonetization(e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-grow">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> Tipo Monetização
                        </label>
                        <select 
                            disabled={!updateMonetization}
                            value={monetizationType}
                            onChange={(e) => setMonetizationType(e.target.value as any)}
                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm disabled:opacity-50"
                        >
                            <option value="NONE">Gratuito</option>
                            <option value="DONATION">Doação</option>
                            <option value="PAID">Pago (Venda)</option>
                        </select>
                    </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${updatePrice ? 'border-green-500 bg-green-50/50' : 'border-gray-200'}`}>
                    <input 
                        type="checkbox" 
                        checked={updatePrice} 
                        onChange={(e) => setUpdatePrice(e.target.checked)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <div className="flex-grow">
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                        <input 
                            type="number"
                            disabled={!updatePrice}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm disabled:opacity-50"
                        />
                    </div>
                </div>
            </div>

            {/* Email */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${updateEmail ? 'border-purple-500 bg-purple-50/50' : 'border-gray-200'}`}>
                <input 
                    type="checkbox" 
                    checked={updateEmail} 
                    onChange={(e) => setUpdateEmail(e.target.checked)}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                />
                <div className="flex-grow">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" /> Email de Contato
                    </label>
                    <input 
                        type="email"
                        disabled={!updateEmail}
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contato@exemplo.com"
                        className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm disabled:opacity-50"
                    />
                </div>
            </div>

            {/* Imagem */}
            <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${updateImage ? 'border-orange-500 bg-orange-50/50' : 'border-gray-200'}`}>
                <input 
                    type="checkbox" 
                    checked={updateImage} 
                    onChange={(e) => setUpdateImage(e.target.checked)}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                />
                <div className="flex-grow">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Adicionar Imagem de Referência
                    </label>
                    <div className="flex gap-4 items-center">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={!updateImage}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                            Selecionar Arquivo
                        </button>
                        <span className="text-xs text-gray-400">{imageFile ? imageFile.name : 'Nenhum arquivo selecionado'}</span>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                    />
                    {imagePreview && (
                        <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-gray-300">
                            <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                        </div>
                    )}
                </div>
            </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-black font-medium transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={loading}
            className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Aplicar Alterações
          </button>
        </div>

      </div>
    </div>
  );
};
