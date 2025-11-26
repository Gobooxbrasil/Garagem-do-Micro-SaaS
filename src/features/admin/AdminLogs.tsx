
import React, { useState, useMemo } from 'react';
import { useAdminLogs } from '../../hooks/use-admin';
import { Search, Download, ShieldAlert, UserX, UserCheck, Shield, FileText, Trash2, CheckCircle, AlertTriangle, Terminal, Clock, ChevronDown } from 'lucide-react';

interface AdminLogsProps {
    session: any; // Prop mantida para consistência, embora logs venham do hook
}

const AdminLogs: React.FC<AdminLogsProps> = () => {
    const { data: logs, isLoading } = useAdminLogs();
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('all');

    // Mapeamento de Ações para Ícones e Cores
    const getActionStyle = (action: string) => {
        switch (action) {
            case 'user_blocked':
                return { icon: UserX, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Usuário Bloqueado' };
            case 'user_unblocked':
                return { icon: UserCheck, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Usuário Desbloqueado' };
            case 'user_deleted':
                return { icon: Trash2, color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300', label: 'Usuário Excluído' };
            case 'user_promoted_admin':
                return { icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', label: 'Promovido a Admin' };
            case 'user_demoted_admin':
                return { icon: ShieldAlert, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', label: 'Removido de Admin' };
            default:
                return { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: action.replace(/_/g, ' ') };
        }
    };

    // Filtragem
    const filteredLogs = useMemo(() => {
        if (!logs) return [];
        return logs.filter(log => {
            const searchLower = search.toLowerCase();
            const matchesSearch = 
                log.action.toLowerCase().includes(searchLower) ||
                log.profiles?.full_name?.toLowerCase().includes(searchLower) ||
                (log.target_id && log.target_id.includes(searchLower));

            const matchesFilter = actionFilter === 'all' || log.action === actionFilter;

            return matchesSearch && matchesFilter;
        });
    }, [logs, search, actionFilter]);

    // Exportar CSV
    const handleExportCSV = () => {
        if (!filteredLogs.length) return;

        const headers = ["Data", "Admin", "Acao", "Alvo ID", "Detalhes"];
        const rows = filteredLogs.map(log => [
            new Date(log.created_at).toLocaleString(),
            log.profiles?.full_name || 'Sistema',
            log.action,
            log.target_id || '-',
            JSON.stringify(log.details || {}).replace(/"/g, '""') // Escape quotes
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(",") + "\n" 
            + rows.map(e => e.map(cell => `"${cell}"`).join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `system_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header & Controls */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="relative w-full xl:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por admin, ação ou ID..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="appearance-none bg-zinc-50 border border-zinc-200 rounded-lg pl-4 pr-10 py-2 text-sm font-medium focus:outline-none focus:border-zinc-400 cursor-pointer"
                        >
                            <option value="all">Todas as Ações</option>
                            <option value="user_blocked">Bloqueios</option>
                            <option value="user_deleted">Exclusões</option>
                            <option value="user_promoted_admin">Admin Promoções</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                    </div>

                    <button 
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
                    >
                        <Download className="w-4 h-4" /> Exportar CSV
                    </button>
                </div>
            </div>

            {/* Log Feed */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-700 text-sm flex items-center gap-2">
                        <Terminal className="w-4 h-4" /> Registro de Auditoria
                    </h3>
                    <span className="text-xs text-zinc-400">
                        Mostrando {filteredLogs.length} registros recentes
                    </span>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin mb-3"></div>
                        <p>Carregando logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center text-zinc-400 italic">
                        Nenhum registro encontrado com os filtros atuais.
                    </div>
                ) : (
                    <div className="divide-y divide-zinc-100">
                        {filteredLogs.map((log) => {
                            const style = getActionStyle(log.action);
                            const Icon = style.icon;
                            
                            return (
                                <div key={log.id} className="p-4 hover:bg-zinc-50 transition-colors flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                                    {/* Icon Column */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${style.bg} ${style.color} ${style.border}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>

                                    {/* Main Info */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="font-bold text-zinc-900 text-sm">
                                                {log.profiles?.full_name || 'Admin Desconhecido'}
                                            </span>
                                            <span className="text-zinc-400 text-xs">•</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${style.bg} ${style.color}`}>
                                                {style.label}
                                            </span>
                                        </div>
                                        
                                        <div className="text-sm text-zinc-600 flex flex-wrap gap-x-4 gap-y-1">
                                            {/* Mostra detalhes do JSON se existirem */}
                                            {log.details && Object.keys(log.details).length > 0 ? (
                                                <span className="font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700 break-all">
                                                    {JSON.stringify(log.details).replace(/["{}]/g, '').replace(/:/g, ': ')}
                                                </span>
                                            ) : (
                                                <span className="text-zinc-400 italic text-xs">Sem detalhes adicionais</span>
                                            )}
                                            
                                            {/* Target ID se relevante */}
                                            {log.target_id && (
                                                <span className="text-xs text-zinc-400 flex items-center gap-1">
                                                    Target ID: <span className="font-mono">{log.target_id.substring(0,8)}...</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Date Column */}
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 sm:text-right whitespace-nowrap">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(log.created_at).toLocaleDateString()} 
                                        <span className="hidden sm:inline mx-1">|</span>
                                        {new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <p>
                    <strong>Nota de Segurança:</strong> Os logs do sistema são imutáveis. Eles servem como registro legal de todas as ações administrativas tomadas na plataforma para garantir a integridade e auditoria do SaaS.
                </p>
            </div>
        </div>
    );
};

export default AdminLogs;
