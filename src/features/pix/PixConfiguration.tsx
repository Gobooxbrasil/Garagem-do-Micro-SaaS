
import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Save, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  ShieldAlert, 
  Building2, 
  User, 
  Hash, 
  Loader2,
  RefreshCw,
  Copy
} from 'lucide-react';
import { useUserPix, useSavePix, useDeletePix, PixData } from '../../hooks/use-pix';
import { validatePixKey, formatPixKey } from '../../lib/pix-validation';
import { generatePixPayload } from '../../lib/pix-utils';
import QRCode from 'qrcode';

interface PixConfigurationProps {
  userId: string;
}

export const PixConfiguration: React.FC<PixConfigurationProps> = ({ userId }) => {
  const { data: existingPix, isLoading } = useUserPix(userId);
  const saveMutation = useSavePix();
  const deleteMutation = useDeletePix();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    key: '',
    type: 'email',
    beneficiary: '',
    bank: ''
  });
  
  const [previewQrCode, setPreviewQrCode] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Carregar dados existentes
  useEffect(() => {
    if (existingPix && existingPix.pix_key) {
      setFormData({
        key: existingPix.pix_key,
        type: existingPix.pix_key_type || 'email',
        beneficiary: existingPix.pix_name || '',
        bank: existingPix.pix_bank || ''
      });
      setIsEditing(false);
    } else {
      setIsEditing(true); // Se não tem PIX, abre modo edição
    }
  }, [existingPix]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => {
          const newData = { ...prev, [name]: value };
          // Auto-format key se for CPF/Phone
          if (name === 'key') {
              newData.key = formatPixKey(value, prev.type);
          }
          if (name === 'type') {
              // Limpa formatação ao mudar tipo
              newData.key = ''; 
          }
          return newData;
      });
      setValidationError(null);
      setPreviewQrCode(null);
  };

  const handleTestQrCode = async () => {
      if (!formData.key || !formData.beneficiary) {
          setValidationError("Preencha Chave e Nome para testar.");
          return;
      }
      if (!validatePixKey(formData.key, formData.type)) {
          setValidationError(`Formato de chave inválido para ${formData.type.toUpperCase()}`);
          return;
      }

      const payload = generatePixPayload({
          key: formData.key,
          name: formData.beneficiary
      });

      try {
          const url = await QRCode.toDataURL(payload);
          setPreviewQrCode(url);
          setValidationError(null);
      } catch (e) {
          console.error(e);
          setValidationError("Erro ao gerar QR Code");
      }
  };

  const handleSave = async () => {
      if (!validatePixKey(formData.key, formData.type)) {
          setValidationError(`Chave PIX inválida.`);
          return;
      }
      if (!formData.beneficiary || !formData.bank) {
          setValidationError("Preencha todos os campos obrigatórios.");
          return;
      }

      saveMutation.mutate({
          userId,
          key: formData.key,
          type: formData.type,
          beneficiary: formData.beneficiary,
          bank: formData.bank
      }, {
          onSuccess: () => {
              setIsEditing(false);
              setPreviewQrCode(null);
          }
      });
  };

  const handleDelete = async () => {
      if (confirm("Tem certeza que deseja remover sua chave PIX? Você deixará de receber pagamentos.")) {
          deleteMutation.mutate(userId);
          setFormData({ key: '', type: 'email', beneficiary: '', bank: '' });
          setIsEditing(true);
      }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;

  // MODO VISUALIZAÇÃO
  if (!isEditing && existingPix?.pix_key) {
      return (
          <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 h-full flex flex-col animate-in fade-in">
               <div className="flex justify-between items-start mb-6">
                    <h3 className="text-lg font-bold text-apple-text flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-emerald-500" /> PIX Configurado
                    </h3>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Ativo
                    </span>
               </div>

               <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex-grow space-y-4">
                   <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm text-emerald-600">
                           <Building2 className="w-6 h-6" />
                       </div>
                       <div>
                           <p className="text-xs text-gray-400 uppercase font-bold">Banco</p>
                           <p className="font-bold text-gray-800">{existingPix.pix_bank}</p>
                       </div>
                   </div>
                   
                   <div className="h-px bg-gray-200 w-full"></div>

                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <p className="text-xs text-gray-400 uppercase font-bold mb-1">Beneficiário</p>
                           <p className="text-sm font-medium text-gray-700">{existingPix.pix_name}</p>
                       </div>
                       <div>
                           <p className="text-xs text-gray-400 uppercase font-bold mb-1">Chave ({existingPix.pix_key_type})</p>
                           <p className="text-sm font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 inline-block">
                               {existingPix.pix_key}
                           </p>
                       </div>
                   </div>

                   {existingPix.pix_qr_code && (
                       <div className="mt-4 flex flex-col items-center">
                           <p className="text-xs text-gray-400 uppercase font-bold mb-2">QR Code Atual</p>
                           <img src={existingPix.pix_qr_code} alt="QR Code" className="w-32 h-32 mix-blend-multiply border border-gray-200 rounded-lg" />
                       </div>
                   )}
               </div>

               <div className="flex gap-3 mt-6">
                   <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 text-sm"
                   >
                       <Edit2 className="w-4 h-4" /> Editar
                   </button>
                   <button 
                        onClick={handleDelete}
                        disabled={deleteMutation.isPending}
                        className="flex-1 bg-red-50 text-red-600 py-3 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-sm border border-red-100"
                   >
                       {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                       Remover
                   </button>
               </div>
          </div>
      );
  }

  // MODO EDIÇÃO / CRIAÇÃO
  return (
    <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 h-full flex flex-col animate-in fade-in">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-apple-text flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" /> Configuração Pix
            </h3>
            {existingPix?.pix_key && (
                <button onClick={() => setIsEditing(false)} className="text-xs font-medium text-gray-500 hover:text-black underline">
                    Cancelar
                </button>
            )}
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Privacidade:</strong> Sua chave Pix não será exibida publicamente. Apenas o <strong>QR Code</strong> e o nome do beneficiário serão mostrados no momento do pagamento.
            </p>
        </div>

        <div className="space-y-4 flex-grow">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label>
                    <select 
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-apple-blue outline-none"
                    >
                        <option value="cpf">CPF</option>
                        <option value="email">Email</option>
                        <option value="phone">Telefone</option>
                        <option value="random">Aleatória</option>
                        <option value="cnpj">CNPJ</option>
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chave Pix</label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            name="key"
                            value={formData.key}
                            onChange={handleChange}
                            placeholder={formData.type === 'email' ? 'exemplo@email.com' : 'Sua chave'}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-apple-text focus:bg-white focus:border-apple-blue outline-none font-mono text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Beneficiário</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input 
                            type="text"
                            name="beneficiary" 
                            value={formData.beneficiary}
                            onChange={handleChange}
                            placeholder="Nome Completo"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:bg-white focus:border-apple-blue outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Banco</label>
                    <input 
                        type="text" 
                        name="bank"
                        value={formData.bank}
                        onChange={handleChange}
                        placeholder="Ex: Nubank, Inter"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-apple-blue outline-none"
                    />
                </div>
            </div>

            {/* ERROR MESSAGE */}
            {validationError && (
                <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> {validationError}
                </div>
            )}
            
            {/* PREVIEW */}
            {previewQrCode && (
                 <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col items-center animate-in zoom-in duration-300">
                     <p className="text-xs font-bold text-gray-400 uppercase mb-2">Preview do QR Code</p>
                     <img src={previewQrCode} alt="QR Code" className="w-32 h-32 mix-blend-multiply border border-gray-200 rounded-lg bg-white p-1" />
                     <p className="text-[10px] text-gray-400 mt-2 text-center max-w-[200px]">Este QR Code será exibido para seus apoiadores.</p>
                 </div>
            )}
        </div>
        
        <div className="pt-6 border-t border-gray-100 mt-6 flex gap-3">
            {!previewQrCode ? (
                <button 
                    onClick={handleTestQrCode}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <RefreshCw className="w-4 h-4" /> Testar QR Code
                </button>
            ) : (
                <button 
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar e Receber
                </button>
            )}
        </div>
    </div>
  );
};