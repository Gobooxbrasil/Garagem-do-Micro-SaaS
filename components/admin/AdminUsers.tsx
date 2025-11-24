
import React, { useState } from 'react';
import { useAdminUsers, useBlockUser, useUnblockUser, useToggleAdmin } from '../../hooks/use-admin';
import { Search, MoreHorizontal, Shield, Ban, CheckCircle, Trash2, Loader2, X, ShieldCheck, ShieldAlert } from 'lucide-react';

interface AdminUsersProps {
    session: any;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ session }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'blocked' | 'admin'>('all');
    const { data: users, isLoading } = useAdminUsers(search, filter);
    
    // Actions State
    const [blockModalOpen, setBlockModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [blockReason, setBlockReason] = useState('');
    
    const blockMutation = useBlockUser();
    const unblockMutation = useUnblockUser();
    const toggleAdminMutation = useToggleAdmin();

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

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Filters */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="flex gap-2">
                    {['all', 'active', 'blocked', 'admin'].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                        >
                            {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : f === 'blocked' ? 'Bloqueados' : 'Admins'}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar usuário..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Usuário</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Cadastro</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                        ) : users?.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-zinc-200 rounded-full overflow-hidden">
                                            {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-bold text-zinc-400">{user.full_name?.[0]}</div>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900">{user.full_name}</p>
                                            <p className="text-xs text-zinc-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {user.is_admin && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Admin</span>}
                                        {user.is_blocked ? (
                                            <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><Ban className="w-3 h-3"/> Bloqueado</span>
                                        ) : (
                                            <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Ativo</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-500">
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button 
                                            onClick={() => handleToggleAdmin(user)}
                                            className={`p-2 rounded-lg transition-colors ${user.is_admin ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'}`}
                                            title={user.is_admin ? "Remover Admin" : "Tornar Admin"}
                                        >
                                            {user.is_admin ? <ShieldCheck className="w-4 h-4"/> : <Shield className="w-4 h-4"/>}
                                        </button>

                                        {user.is_blocked ? (
                                            <button onClick={() => handleUnblock(user.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Desbloquear"><CheckCircle className="w-4 h-4"/></button>
                                        ) : (
                                            <button onClick={() => { setSelectedUser(user); setBlockModalOpen(true); }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Bloquear"><Ban className="w-4 h-4"/></button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
        </div>
    );
};

export default AdminUsers;
