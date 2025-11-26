
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle, User, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Auto-login se já tiver sessão válida de admin
  useEffect(() => {
    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
             const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
             if (data?.is_admin) {
                 onSuccess();
             }
        }
    };
    checkSession();
  }, [onSuccess]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isSignUp) {
          // --- FLUXO DE CADASTRO ---
          if (password.length < 6) throw new Error("A senha deve ter no mínimo 6 caracteres.");
          
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName }
            }
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error("Erro ao criar usuário.");

          // Garantir criação do perfil
          const { error: profileError } = await supabase.from('profiles').upsert({
             id: authData.user.id,
             full_name: fullName,
             email: email,
             updated_at: new Date().toISOString()
          });

          if (profileError) console.warn("Aviso de perfil:", profileError.message);

          setSuccessMsg("Conta criada com sucesso! Solicite permissão de administrador ao proprietário do sistema.");
          setIsSignUp(false); // Volta para login
          setPassword('');

      } else {
          // --- FLUXO DE LOGIN ---
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
          });

          if (authError) throw authError;
          if (!authData.user) throw new Error("Usuário não encontrado.");

          // Verificar permissões
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', authData.user.id)
            .single();

          if (profileError) throw profileError;

          if (!profile?.is_admin) {
            await supabase.auth.signOut();
            throw new Error("Acesso Negado: Sua conta não tem permissão de administrador.");
          }

          // Sucesso
          onSuccess();
      }

    } catch (err: any) {
      setError(err.message || "Falha na operação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans text-zinc-100">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center mb-10">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-zinc-800 shadow-2xl">
                <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Garagem Admin</h1>
            <p className="text-zinc-500">Acesso restrito à moderação</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
            <div className="flex justify-center mb-6 border-b border-zinc-800 pb-4">
                <button 
                    onClick={() => { setIsSignUp(false); setError(null); setSuccessMsg(null); }}
                    className={`pb-2 px-4 text-sm font-bold transition-colors ${!isSignUp ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Entrar
                </button>
                <button 
                    onClick={() => { setIsSignUp(true); setError(null); setSuccessMsg(null); }}
                    className={`pb-2 px-4 text-sm font-bold transition-colors ${isSignUp ? 'text-white border-b-2 border-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                    Criar Conta
                </button>
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
                {error && (
                    <div className="bg-red-950/50 border border-red-900/50 text-red-200 text-sm p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>
                )}
                
                {successMsg && (
                    <div className="bg-green-950/50 border border-green-900/50 text-green-200 text-sm p-4 rounded-xl flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{successMsg}</span>
                    </div>
                )}

                {isSignUp && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Nome Completo</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 w-5 h-5 text-zinc-600" />
                            <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={isSignUp}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
                                placeholder="Seu Nome"
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Email</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 w-5 h-5 text-zinc-600" />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
                            placeholder="admin@garagem.com"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider ml-1">Senha</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-zinc-600" />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-zinc-700 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-white text-black font-bold py-3.5 rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Cadastrar Admin' : 'Entrar no Painel')}
                    {!loading && isSignUp && <ArrowRight className="w-4 h-4" />}
                </button>
            </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8">
            Sistema seguro v1.0.3 &copy; Garagem de Micro SaaS
        </p>

      </div>
    </div>
  );
};

export default AdminLogin;
