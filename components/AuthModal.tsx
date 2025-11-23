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
  const [rememberMe, setRememberMe] = useState(true); // Novo estado para "Manter conectado"
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

        const { error } = await supabase.auth.signUp({
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
        if (error) throw error;
        setSuccessMsg('Conta criada! Verifique seu email para confirmar.');
      } 
      
      else if (mode === 'RECOVERY') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // Redireciona de volta pro site
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

  // --- UI COMPONENTS ---

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
            <p><strong>1. Aceitação:</strong> Ao utilizar a Garagem do Micro SaaS, você concorda com estes termos.</p>
            <p><strong>2. Conteúdo:</strong> Ideias e Projetos postados são de responsabilidade de seus autores. Respeite a propriedade intelectual.</p>
            <p><strong>3. Conduta:</strong> Não toleramos spam, discurso de ódio ou conteúdo malicioso. Contas violadoras serão banidas.</p>
            <p><strong>4. Dados:</strong> Seus dados (email, nome) são usados apenas para autenticação e funcionamento da plataforma. Não vendemos dados.</p>
            <p><strong>5. Isenção:</strong> A plataforma é um hub de conexão. Não garantimos o sucesso financeiro de nenhuma ideia listada aqui.</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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
        <div className="mb-6 text-center">
          {mode === 'LOGIN' && (
             <>
                <h2 className="text-2xl font-bold text-apple-text">Bem-vindo de volta</h2>
                <p className="text-sm text-gray-500 mt-1">Acesse a oficina para continuar.</p>
             </>
          )}
          {mode === 'SIGNUP' && (
             <>
                <h2 className="text-2xl font-bold text-apple-text">Junte-se à Garagem</h2>
                <p className="text-sm text-gray-500 mt-1">Crie sua conta gratuita.</p>
             </>
          )}
          {mode === 'RECOVERY' && (
             <>
                <h2 className="text-2xl font-bold text-apple-text">Recuperar Senha</h2>
                <p className="text-sm text-gray-500 mt-1">Enviaremos um link para você.</p>
             </>
          )}
        </div>

        {/* Status Messages */}
        {error && (
            <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {error}
            </div>
        )}
        {successMsg && (
            <div className="mb-4 bg-green-50 text-green-700 text-sm p-3 rounded-xl border border-green-100 flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> {successMsg}
            </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          
          {/* Name Field (Signup Only) */}
          {mode === 'SIGNUP' && (
            <div className="space-y-1 animate-in slide-in-from-left-4 duration-300">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                <div className="relative">
                <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input 
                    type="text" 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-apple-text focus:bg-white focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all"
                    placeholder="João Silva"
                />
                </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-apple-text focus:bg-white focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          {/* Password Field (Not for Recovery) */}
          {mode !== 'RECOVERY' && (
            <div className="space-y-1 animate-in fade-in">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Senha</label>
                    {mode === 'LOGIN' && (
                        <button 
                            type="button" 
                            onClick={() => switchMode('RECOVERY')}
                            className="text-xs text-apple-blue hover:underline"
                        >
                            Esqueceu?
                        </button>
                    )}
                </div>
                <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input 
                    type="password" 
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-apple-text focus:bg-white focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 outline-none transition-all"
                    placeholder="••••••••"
                />
                </div>
            </div>
          )}

          {/* Keep Connected (Login Only) */}
          {mode === 'LOGIN' && (
            <div className="flex items-center gap-2 pt-1 pb-2 animate-in fade-in">
                <div className="relative flex items-center">
                    <input 
                        type="checkbox" 
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 transition-all checked:border-apple-blue checked:bg-apple-blue"
                    />
                    <Check className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white w-3 h-3 opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <label htmlFor="remember" className="text-xs text-gray-500 cursor-pointer select-none">Manter conectado</label>
            </div>
          )}

          {/* Terms Checkbox (Signup Only) */}
          {mode === 'SIGNUP' && (
              <div className="flex items-start gap-3 py-2 animate-in slide-in-from-left-4 duration-300 delay-100">
                  <div className="relative flex items-center">
                    <input 
                        type="checkbox" 
                        id="terms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 transition-all checked:border-apple-blue checked:bg-apple-blue"
                    />
                    <div className="pointer-events-none absolute top-2/4 left-2/4 -translate-x-2/4 -translate-y-2/4 text-white opacity-0 transition-opacity peer-checked:opacity-100">
                        <Check className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <label htmlFor="terms" className="text-xs text-gray-500 leading-tight">
                      Li e concordo com os <button type="button" onClick={() => setShowTermsText(true)} className="text-apple-blue font-bold hover:underline flex items-center gap-1 inline-flex"><FileText className="w-3 h-3" /> Termos de Uso</button> e Políticas de Privacidade da Garagem.
                  </label>
              </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-apple-blue hover:bg-apple-blueHover text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 mt-2 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                    {mode === 'LOGIN' && 'Entrar na Garagem'}
                    {mode === 'SIGNUP' && 'Criar Conta'}
                    {mode === 'RECOVERY' && 'Enviar Link'}
                </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 text-center border-t border-gray-100 pt-4">
          {mode === 'LOGIN' && (
             <p className="text-sm text-gray-500">
                Ainda não tem conta?
                <button onClick={() => switchMode('SIGNUP')} className="text-apple-blue font-bold ml-1 hover:underline">
                  Cadastre-se
                </button>
             </p>
          )}
          
          {mode === 'SIGNUP' && (
             <p className="text-sm text-gray-500">
                Já tem uma conta?
                <button onClick={() => switchMode('LOGIN')} className="text-apple-blue font-bold ml-1 hover:underline">
                  Faça Login
                </button>
             </p>
          )}

          {mode === 'RECOVERY' && (
              <button onClick={() => switchMode('LOGIN')} className="text-gray-500 text-sm hover:text-black flex items-center gap-1 mx-auto">
                  <ArrowLeft className="w-3 h-3" /> Voltar para Login
              </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;