
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { 
  User, 
  Lock, 
  Camera, 
  QrCode, 
  Save, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Copy,
  ShieldAlert,
  Building2,
  LogOut
} from 'lucide-react';

// =========================================================
// PIX PAYLOAD GENERATOR (BR CODE)
// =========================================================
const generatePixPayload = (key: string, name: string, txId: string = '***') => {
  const DEFAULT_CITY = 'SAO PAULO';
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };
  const cleanName = name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  const cleanCity = DEFAULT_CITY.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  
  let payload = 
    formatField('00', '01') +
    formatField('26', formatField('00', 'br.gov.bcb.pix') + formatField('01', key)) +
    formatField('52', '0000') +
    formatField('53', '986') +
    formatField('58', 'BR') +
    formatField('59', cleanName) +
    formatField('60', cleanCity) +
    formatField('62', formatField('05', txId));

  payload += '6304';
  
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) { crc = (crc << 1) ^ polynomial; } 
      else { crc = crc << 1; }
    }
  }
  return payload + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};


interface ProfileViewProps {
  session: any;
  onLogout?: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ session, onLogout }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    id: session.user.id,
    full_name: '',
    email: session.user.email || '',
    pix_key: '',
    pix_key_type: 'email',
    pix_name: '',
    pix_bank: ''
  });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pixPayload, setPixPayload] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (data) {
                setProfile({
                    ...data,
                    email: session.user.email
                });
            } else if (error && error.code === 'PGRST116') {
                setProfile(prev => ({
                    ...prev,
                    full_name: session.user.user_metadata.full_name || ''
                }));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    fetchProfile();
  }, [session]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMsg(null);
    try {
        const updates = {
            id: session.user.id,
            full_name: profile.full_name,
            pix_key: profile.pix_key,
            pix_key_type: profile.pix_key_type,
            pix_name: profile.pix_name,
            pix_bank: profile.pix_bank,
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('profiles').upsert(updates);
        if (error) throw error;
        setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
        setMsg({ type: 'error', text: `Erro: ${error.message}` });
    } finally {
        setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${session.user.id}-${Math.random()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const { error: updateError } = await supabase.from('profiles').upsert({ id: session.user.id, avatar_url: publicUrl, updated_at: new Date().toISOString() });
        if (updateError) throw updateError;
        setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
        setMsg({ type: 'success', text: 'Foto atualizada!' });
    } catch (error: any) {
        alert(error.message);
    } finally {
        setUploading(false);
    }
  };

  const handleChangePassword = async () => {
      if (!oldPassword || !newPassword) return;
      setLoading(true);
      try {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: oldPassword });
          if (signInError) throw new Error("A senha antiga está incorreta.");
          const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
          if (updateError) throw updateError;
          setMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
          setNewPassword('');
          setOldPassword('');
      } catch (err: any) {
          alert(err.message);
      } finally {
          setLoading(false);
      }
  };

  const handleGenerateQrCode = () => {
      if (!profile.pix_key || !profile.pix_name) {
          alert("Preencha Chave e Nome para gerar o QR Code.");
          return;
      }
      const payload = generatePixPayload(profile.pix_key, profile.pix_name);
      setPixPayload(payload);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
            <div className="relative group">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-100 bg-gray-200">
                    {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User className="w-12 h-12" />
                        </div>
                    )}
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-apple-blue text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
                >
                    <Camera className="w-4 h-4" />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>
            
            <div className="flex-grow text-center md:text-left space-y-2">
                <h1 className="text-3xl font-bold text-apple-text">{profile.full_name || 'Usuário Sem Nome'}</h1>
                <p className="text-gray-500 font-light">{profile.email}</p>
                <div className="flex items-center justify-center md:justify-start gap-2 pt-2">
                   {msg && (
                       <div className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {msg.type === 'success' ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                           {msg.text}
                       </div>
                   )}
                </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto">
                <button 
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-black/10 transition-all text-sm w-full"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                </button>
                {onLogout && (
                    <button 
                        onClick={onLogout}
                        className="bg-red-50 hover:bg-red-100 text-red-600 px-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all text-sm w-full"
                    >
                        <LogOut className="w-4 h-4" /> Sair da Conta
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: PERSONAL & SECURITY */}
            <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
                    <h3 className="text-lg font-bold text-apple-text mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" /> Dados Pessoais
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                            <input 
                                type="text" 
                                value={profile.full_name}
                                onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-apple-text focus:bg-white focus:border-apple-blue outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100">
                    <h3 className="text-lg font-bold text-apple-text mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-gray-400" /> Segurança
                    </h3>
                    <div className="space-y-6">
                        <div className="p-5 bg-gray-50 rounded-xl border border-gray-200">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1 block mb-3">Trocar Senha</label>
                            <div className="space-y-3">
                                <input 
                                    type="password" 
                                    placeholder="Senha Antiga"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-apple-blue outline-none"
                                />
                                <input 
                                    type="password" 
                                    placeholder="Nova Senha"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-apple-blue outline-none"
                                />
                                <button 
                                    onClick={handleChangePassword}
                                    disabled={!newPassword || !oldPassword}
                                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-bold text-xs disabled:opacity-50 transition-colors"
                                >
                                    Atualizar Senha
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: PIX & QR CODE */}
            <div className="space-y-8">
                 <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-apple-text flex items-center gap-2">
                            <QrCode className="w-5 h-5 text-emerald-500" /> Configuração Pix
                        </h3>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                            Receber
                        </span>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
                        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Privacidade:</strong> Sua chave Pix não será exibida publicamente. Apenas o <strong>QR Code</strong> será mostrado.
                        </p>
                    </div>

                    <div className="space-y-4 flex-grow">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Tipo</label>
                                <select 
                                    value={profile.pix_key_type}
                                    onChange={(e) => setProfile(prev => ({ ...prev, pix_key_type: e.target.value as any }))}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-apple-blue outline-none"
                                >
                                    <option value="cpf">CPF</option>
                                    <option value="email">Email</option>
                                    <option value="phone">Telefone</option>
                                    <option value="random">Aleatória</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Chave Pix</label>
                                <input 
                                    type="text" 
                                    value={profile.pix_key}
                                    onChange={(e) => setProfile(prev => ({ ...prev, pix_key: e.target.value }))}
                                    placeholder="Sua chave"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-apple-text focus:bg-white focus:border-apple-blue outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome do Beneficiário</label>
                                <input 
                                    type="text" 
                                    value={profile.pix_name}
                                    onChange={(e) => setProfile(prev => ({ ...prev, pix_name: e.target.value }))}
                                    placeholder="Seu Nome"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-apple-blue outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Banco</label>
                                <input 
                                    type="text" 
                                    value={profile.pix_bank || ''}
                                    onChange={(e) => setProfile(prev => ({ ...prev, pix_bank: e.target.value }))}
                                    placeholder="Ex: Nubank"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-apple-blue outline-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-gray-100 mt-6">
                        <button 
                            onClick={handleGenerateQrCode}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            <QrCode className="w-5 h-5" /> Testar QR Code
                        </button>

                        {pixPayload && (
                            <div className="mt-6 bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col items-center animate-in zoom-in duration-300">
                                <h4 className="text-sm font-bold text-gray-600 mb-4">Seu QR Code Pix</h4>
                                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                                    <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`} 
                                        alt="Pix QR Code" 
                                        className="w-40 h-40 mix-blend-multiply"
                                    />
                                </div>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(pixPayload);
                                        alert("Código Copia e Cola copiado!");
                                    }}
                                    className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:bg-gray-200 py-2 rounded-lg transition-colors"
                                >
                                    <Copy className="w-3 h-3" /> Copiar Código "Copia e Cola"
                                </button>
                            </div>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default ProfileView;
