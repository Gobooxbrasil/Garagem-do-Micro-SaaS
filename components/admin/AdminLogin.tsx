


import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Authenticate
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Usuário não encontrado.");

      // 2. Check Admin Privileges
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.is_admin) {
        // Not admin? Logout immediately.
        await supabase.auth.signOut();
        throw new Error("Acesso Negado: Esta área é restrita a administradores.");
      }

      // Success
      onSuccess();

    } catch (err: any) {
      setError(err.message || "Falha na autenticação");
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
            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-950/50 border border-red-900/50 text-red-200 text-sm p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
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
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Painel'}
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
