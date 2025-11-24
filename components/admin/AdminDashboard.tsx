
import React, { useState } from 'react';
import { useAdminStats, useAdminLogs } from '../../hooks/use-admin';
import { Users, Lightbulb, Star, MessageSquare, ArrowUpRight, ArrowDownRight, Clock, Database, Loader2, CheckCircle } from 'lucide-react';
import { SEED_IDEAS } from '../../lib/seed-ideas';
import { supabase } from '../../lib/supabaseClient';

interface StatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: any;
    trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-zinc-50 rounded-lg border border-zinc-100">
                <Icon className="w-5 h-5 text-zinc-500" />
            </div>
            {trend && (
                <span className={`flex items-center text-xs font-bold ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <h3 className="text-2xl font-bold text-zinc-900 mb-1">{value}</h3>
        <p className="text-sm text-zinc-500 font-medium">{title}</p>
        {subtitle && <p className="text-xs text-zinc-400 mt-2">{subtitle}</p>}
    </div>
);

interface ActivityItemProps {
    log: any;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ log }) => {
    const getActionColor = (action: string) => {
        if (action.includes('blocked')) return 'bg-red-100 text-red-700';
        if (action.includes('unblocked')) return 'bg-green-100 text-green-700';
        if (action.includes('deleted')) return 'bg-red-50 text-red-500';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="flex items-center gap-4 py-4 border-b border-zinc-100 last:border-0">
            <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-xs font-bold text-zinc-500">
                {log.profiles?.full_name?.[0] || 'A'}
            </div>
            <div className="flex-grow">
                <p className="text-sm font-medium text-zinc-900">
                    <span className="font-bold">{log.profiles?.full_name || 'Admin'}</span> realizou uma ação
                </p>
                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleString()}
                </p>
            </div>
            <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                {log.action.replace('_', ' ')}
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const { data: stats, refetch: refetchStats } = useAdminStats();
    const { data: logs } = useAdminLogs();
    const [seeding, setSeeding] = useState(false);
    const [seedSuccess, setSeedSuccess] = useState(false);

    const handleSeedIdeas = async () => {
        if (!confirm(`Isso irá criar ${SEED_IDEAS.length} novas ideias vinculadas ao seu usuário atual. Continuar?`)) return;
        
        setSeeding(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Sem sessão ativa");

            const ideasToInsert = SEED_IDEAS.map(idea => ({
                ...idea,
                user_id: session.user.id,
                votes_count: Math.floor(Math.random() * 20), // Votos iniciais randômicos para parecer vivo
                is_building: false,
                short_id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                created_at: new Date().toISOString(),
                payment_type: 'free' // Default
            }));

            const { error } = await supabase.from('ideas').insert(ideasToInsert);
            if (error) throw error;

            setSeedSuccess(true);
            refetchStats();
            setTimeout(() => setSeedSuccess(false), 5000);
        } catch (err: any) {
            alert(`Erro na importação: ${err.message}`);
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Usuários Totais" 
                    value={stats?.total_users || 0} 
                    subtitle={`${stats?.new_users_week || 0} novos esta semana`}
                    icon={Users}
                    trend={12}
                />
                <StatCard 
                    title="Ideias Publicadas" 
                    value={stats?.total_ideas || 0} 
                    subtitle={`${stats?.total_showroom || 0} no Showroom`}
                    icon={Lightbulb}
                    trend={5}
                />
                <StatCard 
                    title="NPS Score" 
                    value={stats?.avg_nps_score?.toFixed(1) || "N/A"} 
                    subtitle={`${stats?.total_nps || 0} avaliações`}
                    icon={Star}
                />
                <StatCard 
                    title="Feedback Pendente" 
                    value={stats?.total_feedback || 0} 
                    subtitle="Sugestões da comunidade"
                    icon={MessageSquare}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-zinc-900 mb-6">Atividade Recente</h3>
                    <div className="space-y-1">
                        {!logs || logs.length === 0 ? (
                            <p className="text-zinc-500 text-sm">Nenhuma atividade registrada.</p>
                        ) : (
                            logs.map((log: any) => <ActivityItem key={log.id} log={log} />)
                        )}
                    </div>
                </div>

                {/* Quick Actions / System Status */}
                <div className="space-y-6">
                     <div className="bg-white rounded-xl border border-zinc-200 p-6 shadow-sm">
                         <h3 className="font-bold text-zinc-900 mb-4">Ferramentas de Desenvolvimento</h3>
                         <p className="text-xs text-zinc-500 mb-4">Use com cuidado. Ações em massa no banco de dados.</p>
                         
                         <button 
                            onClick={handleSeedIdeas}
                            disabled={seeding || seedSuccess}
                            className={`w-full py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${seedSuccess ? 'bg-green-100 text-green-700' : 'bg-zinc-900 text-white hover:bg-zinc-800'}`}
                         >
                             {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : seedSuccess ? <CheckCircle className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                             {seeding ? 'Importando...' : seedSuccess ? 'Sucesso!' : `Importar ${SEED_IDEAS.length} Ideias do PDF`}
                         </button>
                     </div>

                     <div className="bg-zinc-900 text-white rounded-xl p-6 shadow-lg">
                         <h3 className="font-bold mb-2">Status do Sistema</h3>
                         <div className="space-y-3">
                             <div className="flex justify-between text-sm">
                                 <span className="text-zinc-400">Database</span>
                                 <span className="text-green-400 font-bold">Online</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-zinc-400">Storage</span>
                                 <span className="text-green-400 font-bold">Online</span>
                             </div>
                             <div className="flex justify-between text-sm">
                                 <span className="text-zinc-400">Versão</span>
                                 <span className="text-white font-bold">v1.0.3</span>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
