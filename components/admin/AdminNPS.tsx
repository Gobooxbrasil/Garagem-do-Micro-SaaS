
import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Trash2, Star, Smile, Meh, Frown, TrendingUp, Users, Filter, MessageSquare } from 'lucide-react';
import { NPSResponse } from '../../types';

interface AdminNPSProps {
    session: any;
}

// Extender tipo para incluir dados do perfil (join)
interface NPSResponseWithProfile extends NPSResponse {
    profiles: {
        full_name: string;
        email: string;
        avatar_url?: string;
    };
}

const AdminNPS: React.FC<AdminNPSProps> = ({ session }) => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [scoreFilter, setScoreFilter] = useState<'all' | 'promoter' | 'passive' | 'detractor'>('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // --- DATA FETCHING ---
    const { data: responses, isLoading } = useQuery<NPSResponseWithProfile[]>({
        queryKey: ['admin-nps'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('nps_responses')
                .select('*, profiles(full_name, email, avatar_url)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data as NPSResponseWithProfile[];
        }
    });

    // --- MUTATIONS ---
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('nps_responses').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-nps'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
    });

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta avaliação NPS?')) {
            setIsDeleting(id);
            try {
                await deleteMutation.mutateAsync(id);
            } catch (error: any) {
                alert('Erro ao excluir: ' + error.message);
            } finally {
                setIsDeleting(null);
            }
        }
    };

    // --- CALCULATIONS ---
    const stats = useMemo(() => {
        if (!responses || responses.length === 0) return { nps: 0, promoters: 0, passives: 0, detractors: 0, total: 0 };
        
        const total = responses.length;
        const promoters = responses.filter(r => r.score >= 9).length;
        const passives = responses.filter(r => r.score >= 7 && r.score <= 8).length;
        const detractors = responses.filter(r => r.score <= 6).length;

        // NPS Formula: %Promoters - %Detractors
        const npsScore = ((promoters - detractors) / total) * 100;

        return {
            nps: Math.round(npsScore),
            promoters,
            passives,
            detractors,
            total
        };
    }, [responses]);

    // --- FILTERING ---
    const filteredData = useMemo(() => {
        if (!responses) return [];
        
        return responses.filter(item => {
            // Text Search
            const matchesSearch = 
                item.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                item.profiles?.email?.toLowerCase().includes(search.toLowerCase()) ||
                item.feedback?.toLowerCase().includes(search.toLowerCase());

            // Score Filter
            let matchesScore = true;
            if (scoreFilter === 'promoter') matchesScore = item.score >= 9;
            if (scoreFilter === 'passive') matchesScore = item.score >= 7 && item.score <= 8;
            if (scoreFilter === 'detractor') matchesScore = item.score <= 6;

            return matchesSearch && matchesScore;
        });
    }, [responses, search, scoreFilter]);

    const getScoreColor = (score: number) => {
        if (score >= 9) return 'text-green-600 bg-green-50 border-green-200';
        if (score >= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const getScoreIcon = (score: number) => {
        if (score >= 9) return <Smile className="w-4 h-4" />;
        if (score >= 7) return <Meh className="w-4 h-4" />;
        return <Frown className="w-4 h-4" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-zinc-100 rounded-lg"><TrendingUp className="w-5 h-5 text-zinc-600" /></div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${stats.nps > 0 ? 'bg-green-100 text-green-700' : stats.nps < 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                            Zona de {stats.nps >= 75 ? 'Excelência' : stats.nps >= 50 ? 'Qualidade' : stats.nps >= 0 ? 'Aperfeiçoamento' : 'Crítica'}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-4xl font-bold text-zinc-900">{stats.nps}</h3>
                        <p className="text-sm text-zinc-500 font-medium mt-1">NPS Score</p>
                    </div>
                    {/* Decorative bg chart */}
                    <div className="absolute right-0 bottom-0 opacity-5">
                        <Star className="w-32 h-32" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4 text-green-600">
                        <Smile className="w-5 h-5" /> <span className="font-bold text-sm uppercase">Promotores</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-zinc-900">{stats.promoters}</span>
                        <span className="text-xs text-zinc-400 mb-1.5">({stats.total > 0 ? Math.round((stats.promoters/stats.total)*100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-green-500 h-full" style={{ width: `${stats.total > 0 ? (stats.promoters/stats.total)*100 : 0}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4 text-yellow-600">
                        <Meh className="w-5 h-5" /> <span className="font-bold text-sm uppercase">Neutros</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-zinc-900">{stats.passives}</span>
                        <span className="text-xs text-zinc-400 mb-1.5">({stats.total > 0 ? Math.round((stats.passives/stats.total)*100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-yellow-500 h-full" style={{ width: `${stats.total > 0 ? (stats.passives/stats.total)*100 : 0}%` }}></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-4 text-red-600">
                        <Frown className="w-5 h-5" /> <span className="font-bold text-sm uppercase">Detratores</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-zinc-900">{stats.detractors}</span>
                        <span className="text-xs text-zinc-400 mb-1.5">({stats.total > 0 ? Math.round((stats.detractors/stats.total)*100) : 0}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                        <div className="bg-red-500 h-full" style={{ width: `${stats.total > 0 ? (stats.detractors/stats.total)*100 : 0}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por usuário ou feedback..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setScoreFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scoreFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        Todos
                    </button>
                    <button 
                        onClick={() => setScoreFilter('promoter')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${scoreFilter === 'promoter' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        <Smile className="w-4 h-4" /> Promotores
                    </button>
                    <button 
                        onClick={() => setScoreFilter('passive')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${scoreFilter === 'passive' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        <Meh className="w-4 h-4" /> Neutros
                    </button>
                    <button 
                        onClick={() => setScoreFilter('detractor')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${scoreFilter === 'detractor' ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                    >
                        <Frown className="w-4 h-4" /> Detratores
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-center">Nota</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Feedback</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Data</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>Carregando NPS...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-zinc-500">Nenhuma avaliação encontrada.</td></tr>
                            ) : filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-zinc-200 rounded-full overflow-hidden flex-shrink-0">
                                                {item.profiles?.avatar_url ? <img src={item.profiles.avatar_url} className="w-full h-full object-cover"/> : <Users className="w-4 h-4 m-2 text-zinc-400"/>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-900">{item.profiles?.full_name || 'Anônimo'}</p>
                                                <p className="text-xs text-zinc-400">{item.profiles?.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-sm border ${getScoreColor(item.score)}`}>
                                            {getScoreIcon(item.score)} {item.score}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.feedback ? (
                                            <p className="text-sm text-zinc-700 leading-relaxed max-w-md">{item.feedback}</p>
                                        ) : (
                                            <span className="text-xs text-zinc-300 italic">Sem comentário</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() + ' ' + new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(item.id!)} 
                                            disabled={isDeleting === item.id}
                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Avaliação"
                                        >
                                            {isDeleting === item.id ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4"/>}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminNPS;
