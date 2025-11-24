
import React from 'react';
import { 
  ArrowRight, 
  Layers, 
  Zap, 
  Users, 
  Rocket, 
  ShieldCheck, 
  BarChart3,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface LandingPageProps {
  onEnter: () => void;
  onLogin: () => void;
  isLoggedIn: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onEnter, onLogin, isLoggedIn }) => {
  return (
    <div className="min-h-screen bg-white font-sans text-apple-text selection:bg-apple-blue selection:text-white">
      
      {/* Navbar Simplificada */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="text-white w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex flex-col justify-center">
                <span className="text-lg font-bold tracking-tight leading-none">Garagem</span>
                <span className="text-[9px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-1.5 rounded self-start mt-0.5">
                    VERSÃO ALPHA
                </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             {!isLoggedIn && (
                <button 
                    onClick={onLogin} 
                    className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
                >
                    Login
                </button>
             )}
             <button 
                onClick={onEnter}
                className="bg-black text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2"
             >
                {isLoggedIn ? 'Acessar Dashboard' : 'Começar Agora'}
                <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
            <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-1.5 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Comunidade Ativa</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight bg-gradient-to-b from-black to-gray-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000">
                Do Bloco de Notas <br /> ao Primeiro Exit.
            </h1>
            
            <p className="text-xl text-gray-500 font-light mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                A Garagem é o ecossistema definitivo para Indie Hackers brasileiros. Valide ideias, encontre sócios e lance seu Micro SaaS sem desperdiçar linhas de código.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                <button 
                    onClick={onEnter}
                    className="w-full sm:w-auto bg-apple-blue hover:bg-apple-blueHover text-white px-8 py-4 rounded-full font-semibold text-lg transition-all transform hover:scale-105 shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2"
                >
                    <Rocket className="w-5 h-5" />
                    Entrar na Garagem
                </button>
                <button 
                    onClick={onEnter}
                    className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-colors"
                >
                    Ver Projetos
                </button>
            </div>
            
            <div className="mt-12 flex items-center justify-center gap-8 text-gray-400 grayscale opacity-60">
               {/* Fake Logos for Social Proof */}
               <div className="flex items-center gap-2 font-bold text-lg"><Zap className="w-5 h-5" /> IndieTech</div>
               <div className="flex items-center gap-2 font-bold text-lg"><Layers className="w-5 h-5" /> StackOverflow</div>
               <div className="flex items-center gap-2 font-bold text-lg"><Users className="w-5 h-5" /> ProductHunt</div>
            </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-blue-50 to-transparent rounded-full blur-3xl -z-10 opacity-60"></div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-apple-bg border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-apple-text">Tudo o que você precisa para lançar.</h2>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                    Não construa no escuro. A Garagem fornece as ferramentas para validar antes de codar.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 hover:shadow-hover transition-all duration-300">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-apple-blue">
                        <Zap className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Validação Rápida</h3>
                    <p className="text-gray-500 leading-relaxed">
                        Poste sua ideia e receba feedback imediato da comunidade. Descubra se existe demanda antes de escrever a primeira linha de código.
                    </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 hover:shadow-hover transition-all duration-300">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600">
                        <Users className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Showroom & Feedback</h3>
                    <p className="text-gray-500 leading-relaxed">
                        Lance seu MVP no Showroom. Receba reviews detalhados, encontre bugs críticos e consiga seus primeiros early adopters.
                    </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-white p-8 rounded-3xl shadow-soft border border-gray-100 hover:shadow-hover transition-all duration-300">
                    <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-6 text-green-600">
                        <BarChart3 className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">Métricas Reais</h3>
                    <p className="text-gray-500 leading-relaxed">
                        Acompanhe votos, interesse e engajamento em tempo real. Saiba exatamente qual feature construir em seguida.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* Stats / Trust */}
      <section className="py-24 px-6">
         <div className="max-w-5xl mx-auto bg-black rounded-[3rem] p-12 md:p-20 text-center md:text-left relative overflow-hidden">
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="space-y-6 max-w-md">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        Junte-se a construtores sérios.
                    </h2>
                    <p className="text-gray-400 text-lg">
                        A Garagem não é apenas um fórum. É um hub de negócios focado em resultados e receita recorrente (MRR).
                    </p>
                    <ul className="space-y-3 text-gray-300">
                        <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" /> 100% Focado em SaaS Brasileiro
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" /> Ambiente seguro e moderado
                        </li>
                        <li className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-400" /> Conexão direta com Founders
                        </li>
                    </ul>
                    <button onClick={onLogin} className="mt-4 bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors inline-block">
                        Criar Conta Gratuita
                    </button>
                </div>
                
                {/* Abstract Chart Graphic */}
                <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 w-full max-w-sm transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                            <div className="text-xs text-gray-500 uppercase font-bold">MRR Acumulado</div>
                            <div className="text-2xl font-bold text-white">R$ 142.000,00</div>
                        </div>
                        <div className="text-green-400 text-sm font-bold bg-green-900/30 px-2 py-1 rounded">+12%</div>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                        {[40, 65, 45, 80, 55, 90, 100].map((h, i) => (
                            <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-apple-blue rounded-t-sm opacity-80 hover:opacity-100 transition-opacity"></div>
                        ))}
                    </div>
                </div>
             </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <Layers className="w-6 h-6 text-black" />
                    <span className="font-bold text-lg">Garagem</span>
                </div>
                 <div className="flex items-center gap-2 text-gray-500 mt-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-medium">Sistema em fase Alpha (v0.1.0)</span>
                </div>
            </div>
            <div className="text-sm text-gray-500 text-center md:text-right">
                <p>© 2023 Garagem de Micro SaaS. Feito por Builders.</p>
                <p className="text-xs text-gray-400 mt-1">Funcionalidades em teste. Use com moderação.</p>
            </div>
            <div className="flex gap-6">
                <a href="#" className="text-gray-400 hover:text-black transition-colors"><ShieldCheck className="w-5 h-5" /></a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
