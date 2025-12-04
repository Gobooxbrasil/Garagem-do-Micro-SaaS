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
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                                <Layers className="w-5 h-5 text-white" strokeWidth={2} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-lg font-bold text-gray-900">Garagem</span>
                                <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider -mt-1 hidden sm:block">
                                    DE MICRO SAAS
                                </span>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex items-center gap-3">
                            {!session && (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="hidden sm:block text-sm font-semibold text-gray-700 hover:text-black transition-colors"
                                >
                                    Entrar
                                </button>
                            )}
                            <button
                                onClick={handleCTA}
                                className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                                {session ? 'Dashboard' : 'Começar Grátis'}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-20 overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-gradient-to-b from-gray-100 to-transparent rounded-full blur-3xl opacity-60" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full px-4 py-2 mb-6">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                                Comunidade Ativa • +500 Builders
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Valide sua ideia{' '}
                            <br className="hidden sm:block" />
                            antes de desenvolver seu Micro SaaS
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                            A Garagem é o ecossistema definitivo para Indie Hackers brasileiros.{' '}
                            <span className="font-semibold text-gray-900">Valide ideias</span>, encontre sócios e lance seu Micro SaaS sem desperdiçar linhas de código.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <button
                                onClick={handleCTA}
                                className="w-full sm:w-auto group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-semibold text-base transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                Entrar na Garagem
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={handleCTA}
                                className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-4 rounded-full font-semibold text-base transition-all flex items-center justify-center gap-2"
                            >
                                Ver Projetos
                            </button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
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
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 sm:py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-12 sm:mb-16">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Tudo o que você precisa para lançar
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Não construa no escuro. A Garagem fornece as ferramentas para validar antes de codar.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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
                                className="group bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                            >
                                <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                                    <feature.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 sm:py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-black rounded-3xl p-8 sm:p-12 md:p-16 text-center overflow-hidden relative">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />

                        <div className="relative z-10">
                            {/* Header */}
                            <div className="mb-12">
                                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                                    Junte-se a construtores sérios
                                </h2>
                                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                                    A Garagem não é apenas um fórum. É um hub de negócios focado em resultados e receita recorrente (MRR).
                                </p>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                                {[
                                    { value: '500+', label: 'Builders Ativos' },
                                    { value: '1.2K+', label: 'Ideias Validadas' },
                                    { value: '87%', label: 'Taxa de Sucesso' },
                                    { value: 'R$ 142K', label: 'MRR Acumulado' }
                                ].map((stat, index) => (
                                    <div key={index}>
                                        <div className="text-4xl sm:text-5xl font-bold text-white mb-2">
                                            {stat.value}
                                        </div>
                                        <div className="text-sm text-gray-400 font-medium">
                                            {stat.label}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* CTA Button */}
                            <button
                                onClick={handleCTA}
                                className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:scale-105 inline-flex items-center gap-2"
                            >
                                {session ? 'Acessar Plataforma' : 'Começar Agora'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 sm:py-20 border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            Pronto para transformar sua ideia em realidade?
                        </h2>
                        <p className="text-lg text-gray-600 mb-8">
                            Milhares de founders já estão construindo o futuro. Não fique de fora.
                        </p>
                        <button
                            onClick={handleCTA}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-3"
                        >
                            Começar Gratuitamente
                            <ArrowRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <div className="flex flex-col items-center sm:items-start gap-2">
                            <div className="flex items-center gap-2">
                                <Layers className="w-6 h-6 text-black" />
                                <span className="font-bold text-lg">Garagem</span>
                            </div>
                            <p className="text-xs text-gray-500">Sistema em fase Beta (v0.2.0)</p>
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-gray-600">© 2024 Garagem de Micro SaaS</p>
                            <p className="text-xs text-gray-400 mt-1">Feito por Builders, para Builders</p>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Auth Modal */}
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};

export default LandingPage;
