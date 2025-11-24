
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile } from '../types';
import { PixConfiguration } from './pix/PixConfiguration';
import { 
  User, 
  Lock, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  LogOut
} from 'lucide-react';

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
    // Campos de pix são gerenciados pelo PixConfiguration agora
  });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
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
                    Salvar Dados
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
                 {/* Novo Componente Refatorado */}
                 <PixConfiguration userId={session.user.id} />
            </div>
        </div>
    </div>
  );
};

export default ProfileView;