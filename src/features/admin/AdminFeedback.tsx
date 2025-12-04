
import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Loader2, Trash2, MessageSquare, CheckCircle2, Circle, Clock, AlertCircle, Filter, ArrowUp } from 'lucide-react';
import { Feedback, FeedbackStatus, FeedbackType } from '../../types';
import { StatusBadge } from '../roadmap/StatusBadge';
import { TypeBadge } from '../roadmap/TypeBadge';

interface AdminFeedbackProps {
    session: any;
}

// Tipo estendido para incluir perfil
interface FeedbackWithProfile extends Omit<Feedback, 'profiles'> {
    profiles?: {
        full_name: string;
        email: string;
        avatar_url?: string;
    };
}

const AdminFeedback: React.FC<AdminFeedbackProps> = ({ session }) => {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<FeedbackStatus | 'all'>('all');
    const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // --- DATA FETCHING ---
    const { data: feedbacks, isLoading } = useQuery<FeedbackWithProfile[]>({
        queryKey: ['admin-feedback'],
        queryFn: async () => {
            // Usando a view ou tabela base fazendo join
            const { data, error } = await supabase
                .from('feedbacks')
                .select('*, profiles(full_name, email, avatar_url)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as FeedbackWithProfile[];
        }
    });

    // --- MUTATIONS ---

    // Update Status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: FeedbackStatus }) => {
            const { error } = await supabase
                .from('feedbacks')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
            // Invalida cache público também
            queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
        }
    });

    // Delete
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // Primeiro remove votos e comentários (se não tiver cascade no banco)
            await supabase.from('feedback_votes').delete().eq('feedback_id', id);
            await supabase.from('feedback_comments').delete().eq('feedback_id', id);

            const { error } = await supabase.from('feedbacks').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-feedback'] });
            queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
        }
    });

    const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
        setIsUpdating(id);
        try {
            await updateStatusMutation.mutateAsync({ id, status: newStatus });
        } catch (error: any) {
            alert('Erro ao atualizar status: ' + error.message);
        } finally {
            setIsUpdating(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este feedback? Todos os votos e comentários serão perdidos.')) {
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

    // --- FILTERING ---
    const filteredData = useMemo(() => {
        if (!feedbacks) return [];

        return feedbacks.filter(item => {
            const matchesSearch =
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase()) ||
                item.profiles?.full_name?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesType = typeFilter === 'all' || item.type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [feedbacks, search, statusFilter, typeFilter]);

    const stats = useMemo(() => {
        if (!feedbacks) return { total: 0, pending: 0, planned: 0, completed: 0 };
        return {
            total: feedbacks.length,
            pending: feedbacks.filter(f => f.status === 'pending').length,
            planned: feedbacks.filter(f => f.status === 'planned' || f.status === 'in_progress').length,
            completed: feedbacks.filter(f => f.status === 'completed').length
        };
    }, [feedbacks]);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">

            {/* Stats Summary */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-lg"><MessageSquare className="w-5 h-5 text-gray-600" /></div>
                    <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-gray-500 uppercase font-bold">Total</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-orange-50 rounded-lg"><Clock className="w-5 h-5 text-orange-600" /></div>
                    <div><p className="text-2xl font-bold">{stats.pending}</p><p className="text-xs text-gray-500 uppercase font-bold">Pendentes</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg"><Circle className="w-5 h-5 text-blue-600" /></div>
                    <div><p className="text-2xl font-bold">{stats.planned}</p><p className="text-xs text-gray-500 uppercase font-bold">Em Andamento</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-green-50 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
                    <div><p className="text-2xl font-bold">{stats.completed}</p><p className="text-xs text-gray-500 uppercase font-bold">Entregues</p></div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Buscar feedback..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
                <div className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-zinc-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        >
                            <option value="all">Todos os Status</option>
                            <option value="pending">Pendente</option>
                            <option value="planned">Planejado</option>
                            <option value="in_progress">Em Progresso</option>
                            <option value="completed">Concluído</option>
                            <option value="rejected">Rejeitado</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="bg-zinc-50 border border-zinc-200 rounded-lg py-2 px-3 text-sm focus:outline-none"
                        >
                            <option value="all">Todos os Tipos</option>
                            <option value="feature">Feature</option>
                            <option value="bug">Bug</option>
                            <option value="improvement">Melhoria</option>
                            <option value="other">Outro</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Feedback</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Tipo</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Status (Editar)</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Engajamento</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Autor</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />Carregando Roadmap...</td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-zinc-500">Nenhum item encontrado.</td></tr>
                            ) : filteredData.map((item) => (
                                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-zinc-900 line-clamp-1 mb-1">{item.title}</p>
                                        <p className="text-xs text-zinc-500 line-clamp-2 max-w-xs">{item.description}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <TypeBadge type={item.type} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="relative">
                                            {isUpdating === item.id && <div className="absolute right-2 top-2"><Loader2 className="w-3 h-3 animate-spin text-zinc-400" /></div>}
                                            <select
                                                value={item.status}
                                                onChange={(e) => handleStatusChange(item.id, e.target.value as FeedbackStatus)}
                                                className={`appearance-none pl-3 pr-8 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider cursor-pointer border focus:outline-none focus:ring-2 focus:ring-offset-1 ${item.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        item.status === 'in_progress' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                            item.status === 'planned' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                                item.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    'bg-gray-100 text-gray-600 border-gray-200'
                                                    }`}
                                            >
                                                <option value="pending">Pendente</option>
                                                <option value="planned">Planejado</option>
                                                <option value="in_progress">Em Progresso</option>
                                                <option value="completed">Concluído</option>
                                                <option value="rejected">Rejeitado</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4 text-xs font-medium text-zinc-600">
                                            <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded"><ArrowUp className="w-3 h-3" /> {item.votes_count}</span>
                                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {item.comments_count || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-zinc-200 overflow-hidden flex-shrink-0">
                                                {item.profiles?.avatar_url ? <img src={item.profiles.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-zinc-500">{item.profiles?.full_name?.[0]}</div>}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-700">{item.profiles?.full_name || 'Anônimo'}</span>
                                                <span className="text-[10px] text-zinc-400">{new Date(item.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            disabled={isDeleting === item.id}
                                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Item"
                                        >
                                            {isDeleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

export default AdminFeedback;
