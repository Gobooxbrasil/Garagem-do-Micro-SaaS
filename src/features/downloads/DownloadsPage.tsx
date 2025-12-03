import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Download as DownloadType } from '../../types';
import { Download, FileText, Search, X, Info } from 'lucide-react';
import { ActionLoader } from '../../components/ui/LoadingStates';

const DownloadsPage: React.FC = () => {
    const [downloads, setDownloads] = useState<DownloadType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCard, setExpandedCard] = useState<string | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchDownloads = async () => {
            const { data, error } = await supabase
                .from('downloads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) console.error('Error fetching downloads:', error);
            else setDownloads(data || []);
            setLoading(false);
        };
        fetchDownloads();
    }, []);

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setExpandedCard(null);
            }
        };

        if (expandedCard) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [expandedCard]);

    // Filter downloads based on search
    const filteredDownloads = downloads.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleExpanded = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedCard(expandedCard === id ? null : id);
    };

    if (loading) return <ActionLoader message="Carregando arquivos..." />;

    return (
        <div className="max-w-5xl mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-10 text-center">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-3">Arquivos & Recursos</h1>
                <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-6">
                    Materiais exclusivos, templates e ferramentas para acelerar sua jornada Micro SaaS.
                </p>

                {/* Search Bar */}
                <div className="max-w-md mx-auto relative">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar arquivos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        )}
                    </div>
                    {searchTerm && (
                        <p className="text-sm text-gray-500 mt-2">
                            {filteredDownloads.length} {filteredDownloads.length === 1 ? 'resultado' : 'resultados'}
                        </p>
                    )}
                </div>
            </div>

            {filteredDownloads.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">
                        {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum arquivo disponível'}
                    </h3>
                    <p className="text-gray-500 mt-1">
                        {searchTerm ? 'Tente buscar com outros termos.' : 'Volte em breve para conferir novos materiais.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDownloads.map((item) => (
                        <div
                            key={item.id}
                            className="group relative"
                        >
                            {/* Main Card */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden h-full flex flex-col">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50 group-hover:scale-110 transition-transform"></div>

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                        <button
                                            onClick={(e) => toggleExpanded(item.id, e)}
                                            className={`p-1.5 rounded-full transition-all ${expandedCard === item.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600'
                                                }`}
                                            title="Ver mais informações"
                                        >
                                            <Info className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2 flex-grow">
                                    {item.title}
                                </h3>

                                <p className="text-gray-500 text-sm mb-6 line-clamp-2 min-h-[40px]">
                                    {item.description || 'Sem descrição disponível.'}
                                </p>

                                <a
                                    href={item.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors group-hover:shadow-lg group-hover:shadow-blue-500/30 mt-auto"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar Agora
                                </a>
                            </div>

                            {/* Expanded Info Modal - Positioned to the side */}
                            {expandedCard === item.id && (
                                <div
                                    ref={tooltipRef}
                                    className="absolute z-50 top-0 left-full ml-4 w-80 pointer-events-auto animate-in fade-in slide-in-from-left-2 duration-200"
                                >
                                    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 relative">
                                        <button
                                            onClick={(e) => toggleExpanded(item.id, e)}
                                            className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-gray-400" />
                                        </button>

                                        <div className="flex items-start gap-3 mb-3 pr-6">
                                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <h4 className="font-bold text-gray-900 text-base leading-tight mb-1">
                                                    {item.title}
                                                </h4>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(item.created_at).toLocaleDateString('pt-BR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {item.description || 'Sem descrição disponível.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DownloadsPage;
