
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { X, Mail, Lock, User, Loader2, ArrowLeft, ShieldCheck, FileText, Check } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = 'LOGIN' | 'SIGNUP' | 'RECOVERY';

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  
  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsText, setShowTermsText] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(false);
  };

  const switchMode = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    resetForm();
    setLoading(true);

    try {
      if (mode === 'LOGIN') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      } 
      
      else if (mode === 'SIGNUP') {
        if (!acceptTerms) {
          throw new Error("Você precisa aceitar os Termos de Uso para continuar.");
        }
        if (password.length < 6) {
            throw new Error("A senha deve ter no mínimo 6 caracteres.");
        }

        // 1. Criar usuário na Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              accepted_terms: true,
              accepted_terms_at: new Date().toISOString(),
            },
          },
        });
        
        if (authError) throw authError;

        // 2. SELF-HEALING: Criar perfil público imediatamente
        if (authData.user) {
            // Tentamos inserir. Se já existir (via trigger), o Supabase ignora ou retorna erro que tratamos.
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                full_name: fullName,
                email: email,
                updated_at: new Date().toISOString()
            });
            
            if (profileError) console.warn("Aviso de perfil:", profileError.message);
        }

        setSuccessMsg('Conta criada! Verifique seu email para confirmar.');
        setTimeout(() => switchMode('LOGIN'), 3000);
      } 
      
      else if (mode === 'RECOVERY') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });
        if (error) throw error;
        setSuccessMsg('Email de recuperação enviado. Verifique sua caixa de entrada.');
      }

    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderTermsModal = () => (
    <div className="absolute inset-0 bg-white z-20 p-6 rounded-3xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-apple-blue" /> Termos de Uso
            </h3>
            <button onClick={() => setShowTermsText(false)} className="p-2 bg-gray-100 rounded-full">
                <X className="w-4 h-4" />
            </button>
        </div>
        <div className="flex-grow overflow-y-auto text-sm text-gray-600 space-y-3 pr-2 custom-scrollbar border p-4 rounded-xl border-gray-100 bg-gray-50">
            <p><strong>1. Aceitação:</strong> Ao utilizar a Garagem de Micro SaaS, você concorda com estes termos.</p>
            <p><strong>2. Conteúdo:</strong> Ideias e Projetos postados são de responsabilidade de seus autores.</p>
            <p><strong>3. Conduta:</strong> Não toleramos spam, discurso de ódio ou conteúdo malicioso.</p>
            <p><strong>4. Dados:</strong> Seus dados são usados apenas para autenticação e funcionamento da plataforma.</p>
            <p><strong>5. Isenção:</strong> A plataforma é um hub de conexão. Não garantimos sucesso financeiro.</p>
        </div>
        <button 
            onClick={() => { setShowTermsText(false); setAcceptTerms(true); }}
            className="mt-4 w-full bg-apple-blue text-white py-3 rounded-xl font-medium"
        >
            Li e Concordo
        </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 relative border border-gray-200 overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Terms Overlay */}
        {showTermsText && renderTermsModal()}

        {/* Header */}
        <div className="mb-8 text-center">
          {mode === 'LOGIN' && (
             <>
                <h2 className="text-2xl font-bold text-apple-text">Bem-vindo de volta</h2>
                <p className="text-sm text-gray-500 mt-1">Acesse a oficina para continuar.</p>
             </>
          )}
          {mode === 'SIGNUP' && (
             <>
                <h2 className="text-2xl font-bold text-apple-text">Criar Conta</h2>
                <p className="text-sm text-gray-500 mt-1">Junte-se à comunidade de builders.</p>
             </>
          )}
          {mode === 'RECOVERY' && (
             <div className="flex flex-col items-center">
                <button onClick={() => switchMode('LOGIN')} className="self-start mb-4 text-gray-400 hover:text-black flex items-center gap-1 text-xs font-bold uppercase tracking-wide">
                    <ArrowLeft className="w-3 h-3" /> Voltar
                </button>
                <h2 className="text-2xl font-bold text-apple-text">Recuperar Senha</h2>
                <p className="text-sm text-gray-500 mt-1">Enviaremos um link para seu email.</p>
             </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Feedback Messages */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                <X className="w-4 h-4" /> {error}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                <Check className="w-4 h-4" /> {successMsg}
            </div>
          )}

          {mode === 'SIGNUP' && (
            <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Seu Nome Completo"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition-all"
                />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input 
                type="email" 
                placeholder="seu@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition-all"
            />
          </div>

          {mode !== 'RECOVERY' && (
            <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                    type="password" 
                    placeholder="Sua senha"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/10 transition-all"
                />
            </div>
          )}

          {mode === 'LOGIN' && (
             <div className="flex justify-end">
                 <button 
                    type="button" 
                    onClick={() => switchMode('RECOVERY')}
                    className="text-xs font-semibold text-apple-blue hover:underline"
                 >
                    Esqueceu a senha?
                 </button>
             </div>
          )}

          {mode === 'SIGNUP' && (
              <div className="flex items-start gap-2 pt-2">
                  <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        required
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-apple-blue focus:ring-apple-blue"
                      />
                  </div>
                  <div className="text-xs text-gray-500 leading-tight">
                      Eu aceito os <button type="button" onClick={() => setShowTermsText(true)} className="text-apple-blue font-bold hover:underline">Termos de Uso</button> e Política de Privacidade da Garagem.
                  </div>
              </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-black/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                mode === 'LOGIN' ? 'Entrar' : mode === 'SIGNUP' ? 'Criar Conta' : 'Enviar Link'
            )}
          </button>
        </form>

        {/* Footer Switcher */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            {mode === 'LOGIN' ? (
                <p className="text-sm text-gray-500">
                    Ainda não tem conta?{' '}
                    <button onClick={() => switchMode('SIGNUP')} className="text-apple-blue font-bold hover:underline">
                        Cadastre-se
                    </button>
                </p>
            ) : (
                <p className="text-sm text-gray-500">
                    Já tem uma conta?{' '}
                    <button onClick={() => switchMode('LOGIN')} className="text-apple-blue font-bold hover:underline">
                        Fazer Login
                    </button>
                </p>
            )}
        </div>

      </div>
    </div>
  );
};

export default AuthModal;
