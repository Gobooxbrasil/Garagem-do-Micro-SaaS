import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import {
    ArrowRight,
    Layers,
    Zap,
    Users,
    Rocket,
    CheckCircle2,
    BarChart3,
    Shield,
    MessageSquare,
    TrendingUp
} from 'lucide-react';
import AuthModal from '../features/auth/AuthModal';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    const handleCTA = () => {
        if (session) {
            navigate('/ideas');
        } else {
            setIsAuthModalOpen(true);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-apple-text selection:bg-apple-blue selection:text-white">

            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="w-11 h-11 bg-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Layers className="text-white w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold tracking-tight text-gray-900">Garagem</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] mt-1">
                                DE MICRO SAAS
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!session && (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="hidden sm:block text-sm font-semibold text-gray-600 hover:text-black transition-colors"
                            >
                                Entrar
                            </button>
                        )}
                        <button
                            onClick={handleCTA}
                            className="bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-black/10 hover:shadow-black/20 flex items-center gap-2"
                        >
                            {session ? 'Dashboard' : 'Começar Grátis'}
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
                {/* Background */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 sm:h-[600px] bg-gradient-to-b from-gray-50 to-transparent rounded-full blur-3xl -z-10 opacity-60"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Comunidade Ativa • +500 Builders</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 sm:mb-8 leading-tight bg-gradient-to-b from-black to-gray-600 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-8 duration-1000 px-4">
                        Valide sua ideia <br className="hidden sm:block" />antes de codar
                    </h1>

                    {/* Subheadline */}
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-500 font-light mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100 px-4">
                        A Garagem é o ecossistema definitivo para Indie Hackers brasileiros. <span className="text-black font-medium">Valide ideias</span>, encontre sócios e lance seu Micro SaaS sem desperdiçar linhas de código.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-4">
                        <button
                            onClick={handleCTA}
                            className="w-full sm:w-auto group bg-apple-blue hover:bg-apple-blueHover text-white px-8 py-4 rounded-full font-semibold text-base sm:text-lg transition-all transform hover:scale-105 shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center justify-center gap-2"
                        >
                            <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                            Entrar na Garagem
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={handleCTA}
                            className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-full font-semibold text-base sm:text-lg transition-all flex items-center justify-center gap-2"
                        >
                            Ver Projetos
                        </button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-sm text-gray-500 px-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>100% Gratuito</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Sem Cartão</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>Acesso Imediato</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-24 bg-apple-bg border-t border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6">
                    <div className="text-center mb-12 sm:mb-20">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-apple-text">
                            Tudo o que você precisa para lançar
                        </h2>
                        <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
                            Não construa no escuro. A Garagem fornece as ferramentas para validar antes de codar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {[
                            {
                                icon: Zap,
                                title: 'Validação Rápida',
                                description: 'Poste sua ideia e receba feedback imediato da comunidade. Descubra se existe demanda antes de escrever a primeira linha de código.',
                                color: 'text-yellow-600',
                                bg: 'bg-yellow-50'
                            },
                            {
                                icon: Users,
                                title: 'Showroom & Feedback',
                                description: 'Lance seu MVP no Showroom. Receba reviews detalhados, encontre bugs críticos e consiga seus primeiros early adopters.',
                                color: 'text-purple-600',
                                bg: 'bg-purple-50'
                            },
                            {
                                icon: BarChart3,
                                title: 'Métricas Reais',
                                description: 'Acompanhe votos, interesse e engajamento em tempo real. Saiba exatamente qual feature construir em seguida.',
                                color: 'text-green-600',
                                bg: 'bg-green-50'
                            },
                            {
                                icon: MessageSquare,
                                title: 'Roadmap Colaborativo',
                                description: 'Deixe sua comunidade votar e sugerir melhorias. Construa o que realmente importa para seus usuários.',
                                color: 'text-blue-600',
                                bg: 'bg-blue-50'
                            },
                            {
                                icon: TrendingUp,
                                title: 'Crescimento Orgânico',
                                description: 'Aproveite a rede de founders para crescer organicamente. Marketing boca-a-boca acelerado.',
                                color: 'text-orange-600',
                                bg: 'bg-orange-50'
                            },
                            {
                                icon: Shield,
                                title: 'Ambiente Seguro',
                                description: 'Moderação ativa e comunidade respeitosa. Suas ideias estão seguras e protegidas.',
                                color: 'text-indigo-600',
                                bg: 'bg-indigo-50'
                            }
                        ].map((feature, index) => (
                            <div
                                key={index}
                                className="group bg-white p-6 sm:p-8 rounded-3xl shadow-soft border border-gray-100 hover:shadow-hover hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
                            >
                                <div className={`w-12 h-12 sm:w-14 sm:h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${feature.color} group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-apple-text">{feature.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 sm:py-24 px-4 sm:px-6">
                <div className="max-w-5xl mx-auto bg-black rounded-3xl sm:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50"></div>

                    <div className="relative z-10 space-y-8 sm:space-y-12">
                        <div className="space-y-4 sm:space-y-6">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">
                                Junte-se a construtores sérios
                            </h2>
                            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
                                A Garagem não é apenas um fórum. É um hub de negócios focado em resultados e receita recorrente (MRR).
                            </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-12 py-6 sm:py-8">
                            {[
                                { value: '500+', label: 'Builders Ativos' },
                                { value: '1.2K+', label: 'Ideias Validadas' },
                                { value: '87%', label: 'Taxa de Sucesso' },
                                { value: 'R$ 142K', label: 'MRR Acumulado' }
                            ].map((stat, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs sm:text-sm text-gray-400 font-medium">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleCTA}
                            className="bg-white text-black px-8 py-4 rounded-full font-bold text-base sm:text-lg hover:bg-gray-100 transition-all shadow-xl hover:scale-105 flex items-center gap-2 mx-auto"
                        >
                            {session ? 'Acessar Plataforma' : 'Começar Agora'}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-gray-200">
                <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-apple-text leading-tight">
                        Pronto para transformar sua ideia em realidade?
                    </h2>
                    <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
                        Milhares de founders já estão construindo o futuro. Não fique de fora.
                    </p>
                    <button
                        onClick={handleCTA}
                        className="bg-apple-blue hover:bg-apple-blueHover text-white px-10 py-5 rounded-full font-bold text-lg sm:text-xl shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-3 mx-auto"
                    >
                        Começar Gratuitamente
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 py-8 sm:py-12 px-4 sm:px-6">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col items-center sm:items-start gap-2">
                        <div className="flex items-center gap-2">
                            <Layers className="w-6 h-6 text-black" />
                            <span className="font-bold text-lg">Garagem</span>
                        </div>
                        <p className="text-xs text-gray-500">Sistema em fase Beta (v0.2.0)</p>
                    </div>
                    <div className="text-sm text-gray-500 text-center">
                        <p>© 2024 Garagem de Micro SaaS</p>
                        <p className="text-xs text-gray-400 mt-1">Feito por Builders, para Builders</p>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default LandingPage;
