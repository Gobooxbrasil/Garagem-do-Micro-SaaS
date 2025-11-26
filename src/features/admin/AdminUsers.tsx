
import React, { useState } from 'react';
import { useAdminUsers, useBlockUser, useUnblockUser, useToggleAdmin, useDeleteUser, useAdminUserDetails } from '../../hooks/use-admin';
import { Search, Shield, Ban, CheckCircle, Trash2, Loader2, X, ShieldCheck, Eye, Calendar, Mail, MessageSquare, Flame, Layers, AlertTriangle } from 'lucide-react';

interface AdminUsersProps {
    session: any;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ session }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'blocked' | 'admin'>('all');
    const { data: users, isLoading } = useAdminUsers(search, filter);
    
    // Actions State
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [blockReason, setBlockReason] = useState('');
    
    // Mutations
    const blockMutation = useBlockUser();
    const unblockMutation = useUnblockUser();
    const toggleAdminMutation = useToggleAdmin();
    const deleteMutation = useDeleteUser();

    // Details Hook
    const { data: userDetails, isLoading: detailsLoading } = useAdminUserDetails(detailsModalOpen ? selectedUser?.id : null);

    const handleBlock = () => {
        if (!selectedUser || !blockReason) return;
        blockMutation.mutate({ 
            userId: selectedUser.id, 
            reason: blockReason, 
            adminId: session.user.id 
        }, {
            onSuccess: () => {
                setBlockModalOpen(false);
                setBlockReason('');
                setSelectedUser(null);
            }
        });
    };

    const handleUnblock = (userId: string) => {
        if (confirm('Tem certeza que deseja desbloquear este usuário?')) {
            unblockMutation.mutate({ userId, adminId: session.user.id });
        }
    };

    const handleToggleAdmin = (user: any) => {
        const action = user.is_admin ? 'remover' : 'conceder';
        if (confirm(`Tem certeza que deseja ${action} permissão de ADMINISTRADOR para ${user.full_name}?`)) {
            toggleAdminMutation.mutate({ 
                userId: user.id, 
                isAdmin: !user.is_admin, 
                adminId: session.user.id 
            });
        }
    };

    const handleDelete = (user: any) => {
        const confirmMsg = `ATENÇÃO: Você está prestes a excluir ${user.full_name}.\n\nIsso removerá o perfil e o acesso à plataforma. Os dados históricos (ideias, votos) podem permanecer órfãos dependendo da estrutura do banco.\n\nDeseja continuar?`;
        if (confirm(confirmMsg)) {
            deleteMutation.mutate({ userId: user.id, adminId: session.user.id });
        }
    };

    const openDetails = (user: any) => {
        setSelectedUser(user);
        setDetailsModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {['all', 'active', 'blocked', 'admin'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors whitespace-nowrap ${filter === f ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                        >
                            {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : f === 'blocked' ? 'Bloqueados' : 'Admins'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar nome ou email..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Email / Contato</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Cadastro</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-zinc-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>Carregando usuários...</td></tr>
                            ) : users?.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-zinc-500">Nenhum usuário encontrado.</td></tr>
                            ) : users?.map((user) => (
                                <tr key={user.id} className="hover:bg-zinc-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-zinc-200 rounded-full overflow-hidden border border-zinc-300">
                                                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">{user.full_name?.[0]}</div>}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-900">{user.full_name}</p>
                                                <p className="text-xs text-zinc-400 font-mono truncate max-w-[150px]" title={user.id}>ID: {user.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-zinc-600">
                                            <Mail className="w-3 h-3" />
                                            <span className="text-sm">{user.email}</span>
                                        </div>
                                        {user.pix_key && (
                                            <div className="mt-1 text-xs text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded inline-block">
                                                Pix Configurado
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {user.is_admin && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Admin</span>}
                                            {user.is_blocked ? (
                                                <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><Ban className="w-3 h-3"/> Bloqueado</span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Ativo</span>
                                            )}
                                        </div>
                                        {user.is_blocked && user.blocked_reason && (
                                            <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={user.blocked_reason}>{user.blocked_reason}</p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => openDetails(user)} 
                                                className="p-2 text-zinc-500 hover:bg-zinc-200 rounded-lg transition-colors" 
                                                title="Ver Detalhes e Histórico"
                                            >
                                                <Eye className="w-4 h-4"/>
                                            </button>

                                            <button 
                                                onClick={() => handleToggleAdmin(user)}
                                                className={`p-2 rounded-lg transition-colors ${user.is_admin ? 'text-purple-600 hover:bg-purple-100' : 'text-zinc-400 hover:bg-zinc-200'}`}
                                                title={user.is_admin ? "Remover Admin" : "Tornar Admin"}
                                            >
                                                <Shield className="w-4 h-4"/>
                                            </button>

                                            {user.is_blocked ? (
                                                <button onClick={() => handleUnblock(user.id)} className="p-2 text-green-600 hover:bg-green-100 rounded-lg" title="Desbloquear"><CheckCircle className="w-4 h-4"/></button>
                                            ) : (
                                                <button onClick={() => { setSelectedUser(user); setBlockModalOpen(true); }} className="p-2 text-orange-500 hover:bg-orange-100 rounded-lg" title="Bloquear Acesso"><Ban className="w-4 h-4"/></button>
                                            )}

                                            <button onClick={() => handleDelete(user)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg ml-2" title="Excluir Usuário (Cuidado!)"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Block Modal */}
            {blockModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white w-full max-w-md rounded-xl p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-zinc-900">Bloquear Usuário</h3>
                            <button onClick={() => setBlockModalOpen(false)}><X className="w-5 h-5 text-zinc-500"/></button>
                        </div>
                        <p className="text-sm text-zinc-500 mb-4">
                            Você está prestes a bloquear <strong>{selectedUser?.full_name}</strong>. Eles perderão acesso imediato à plataforma.
                        </p>
                        <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Motivo do Bloqueio</label>
                        <textarea 
                            value={blockReason} 
                            onChange={(e) => setBlockReason(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm focus:border-red-500 outline-none h-24 resize-none mb-6"
                            placeholder="Descreva o motivo (spam, comportamento, etc)..."
                        ></textarea>
                        <div className="flex gap-3">
                            <button onClick={() => setBlockModalOpen(false)} className="flex-1 py-2.5 rounded-lg border border-zinc-200 font-bold text-zinc-600 hover:bg-zinc-50">Cancelar</button>
                            <button 
                                onClick={handleBlock}
                                disabled={blockMutation.isPending || !blockReason}
                                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {blockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Ban className="w-4 h-4"/>}
                                Confirmar Bloqueio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {detailsModalOpen && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 flex justify-between items-start bg-zinc-50/50 rounded-t-2xl">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-zinc-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
                                    {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">{selectedUser.full_name?.[0]}</div>}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-zinc-900">{selectedUser.full_name}</h2>
                                    <p className="text-sm text-zinc-500 flex items-center gap-2">
                                        <Mail className="w-3 h-3"/> {selectedUser.email}
                                    </p>
                                    <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1 font-mono">
                                        ID: {selectedUser.id}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${selectedUser.is_blocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                            {selectedUser.is_blocked ? 'Bloqueado' : 'Ativo'}
                                        </span>
                                        {selectedUser.is_admin && <span className="bg-purple-100 text-purple-600 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Admin</span>}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setDetailsModalOpen(false)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-grow overflow-y-auto p-6 bg-zinc-50/30">
                            {detailsLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                                    <Loader2 className="w-8 h-8 animate-spin mb-2"/>
                                    <p>Carregando histórico...</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Stats Cards */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                                            <div className="flex justify-center mb-2 text-blue-500"><Layers className="w-5 h-5"/></div>
                                            <p className="text-2xl font-bold text-zinc-900">{userDetails?.created_projects.length || 0}</p>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Projetos Criados</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                                            <div className="flex justify-center mb-2 text-orange-500"><Flame className="w-5 h-5"/></div>
                                            <p className="text-2xl font-bold text-zinc-900">{userDetails?.votes_cast.length || 0}</p>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Votos Realizados</p>
                                        </div>
                                        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm text-center">
                                            <div className="flex justify-center mb-2 text-green-500"><MessageSquare className="w-5 h-5"/></div>
                                            <p className="text-2xl font-bold text-zinc-900">{userDetails?.comments_made.length || 0}</p>
                                            <p className="text-xs text-zinc-500 uppercase font-bold">Comentários</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Projects List */}
                                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-full">
                                            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                                                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                                                    <Layers className="w-4 h-4 text-zinc-400"/> Projetos do Usuário
                                                </h3>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto">
                                                {userDetails?.created_projects.length === 0 ? (
                                                    <p className="p-6 text-center text-sm text-zinc-400 italic">Nenhum projeto criado.</p>
                                                ) : (
                                                    <table className="w-full text-left text-sm">
                                                        <tbody className="divide-y divide-zinc-50">
                                                            {userDetails?.created_projects.map((idea: any) => (
                                                                <tr key={idea.id} className="hover:bg-zinc-50">
                                                                    <td className="px-4 py-3">
                                                                        <p className="font-medium text-zinc-900 line-clamp-1">{idea.title}</p>
                                                                        <p className="text-xs text-zinc-500">{new Date(idea.created_at).toLocaleDateString()}</p>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-right">
                                                                        <span className="text-xs font-bold text-orange-500 flex items-center justify-end gap-1">
                                                                            <Flame className="w-3 h-3"/> {idea.votes_count}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                )}
                                            </div>
                                        </div>

                                        {/* Activity Feed */}
                                        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden h-full">
                                            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                                                <h3 className="font-bold text-zinc-800 text-sm flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-zinc-400"/> Atividade Recente
                                                </h3>
                                            </div>
                                            <div className="max-h-[300px] overflow-y-auto p-4 space-y-4">
                                                {userDetails?.comments_made.length === 0 && userDetails?.votes_cast.length === 0 ? (
                                                    <p className="text-center text-sm text-zinc-400 italic">Nenhuma atividade recente.</p>
                                                ) : (
                                                    <>
                                                        {userDetails?.comments_made.map((comment: any) => (
                                                            <div key={comment.id} className="flex gap-3 text-sm">
                                                                <div className="mt-1"><MessageSquare className="w-4 h-4 text-blue-400"/></div>
                                                                <div>
                                                                    <p className="text-zinc-900">Comentou em <strong>{comment.ideas?.title || 'uma ideia'}</strong></p>
                                                                    <p className="text-xs text-zinc-500 italic line-clamp-1">"{comment.content}"</p>
                                                                    <p className="text-[10px] text-zinc-400 mt-1">{new Date(comment.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {userDetails?.votes_cast.map((vote: any) => (
                                                            <div key={vote.id} className="flex gap-3 text-sm">
                                                                <div className="mt-1"><Flame className="w-4 h-4 text-orange-400"/></div>
                                                                <div>
                                                                    <p className="text-zinc-900">Votou em <strong>{vote.ideas?.title || 'uma ideia'}</strong></p>
                                                                    <p className="text-[10px] text-zinc-400 mt-1">{new Date(vote.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-zinc-100 bg-zinc-50 rounded-b-2xl flex justify-between items-center">
                            <button onClick={() => handleDelete(selectedUser)} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4"/> Excluir Usuário Permanentemente
                            </button>
                            <button onClick={() => setDetailsModalOpen(false)} className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-black transition-colors">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
