
import React, { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { SEED_IDEAS } from '../../lib/seed-ideas';
import { useIdeas } from '../../hooks/use-ideas-cache';
import { Search, Loader2, Trash2, Edit2, Plus, UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import NewIdeaModal from '../NewIdeaModal';
import { Idea } from '../../types';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '../../lib/cache-keys';

interface AdminIdeasProps {
    session: any;
}

const AdminIdeas: React.FC<AdminIdeasProps> = ({ session }) => {
    const [search, setSearch] = useState('');
    const { data: ideas, isLoading } = useIdeas({ search });
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<{total: number, success: number} | null>(null);

    const handleEdit = (idea: Idea) => {
        setEditingIdea(idea);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta ideia permanentemente?')) {
            await supabase.from('ideas').delete().eq('id', id);
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
        }
    };

    const handleSave = async (ideaData: any) => {
        if (ideaData.id) {
            // Update
            const { error } = await supabase.from('ideas').update(ideaData).eq('id', ideaData.id);
            if (error) alert('Erro ao atualizar: ' + error.message);
        } else {
            // Create
            const { error } = await supabase.from('ideas').insert({
                ...ideaData,
                user_id: session.user.id,
                votes_count: 0,
                is_building: false,
                short_id: Math.random().toString(36).substring(2, 8).toUpperCase()
            });
            if (error) alert('Erro ao criar: ' + error.message);
        }
        setIsModalOpen(false);
        setEditingIdea(null);
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
    };

    const handleImportSeed = async () => {
        if (!confirm(`Isso irá importar ${SEED_IDEAS.length} ideias do documento PDF original para o banco de dados. Continuar?`)) return;
        
        setIsImporting(true);
        let successCount = 0;

        // Batch processing
        try {
            // Preparar dados
            const rows = SEED_IDEAS.map(seed => ({
                title: seed.title,
                niche: seed.niche,
                pain: seed.pain,
                solution: seed.solution,
                why: seed.why,
                pricing_model: seed.pricing_model,
                target: seed.target,
                sales_strategy: seed.sales_strategy,
                pdr: seed.pdr,
                user_id: session.user.id, // Admin é o dono
                votes_count: 0,
                is_building: false,
                created_at: new Date().toISOString(),
                short_id: Math.random().toString(36).substring(2, 8).toUpperCase()
            }));

            const { error } = await supabase.from('ideas').insert(rows);
            
            if (error) throw error;
            successCount = rows.length;
            setImportStatus({ total: rows.length, success: successCount });
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });

        } catch (error: any) {
            alert('Erro na importação: ' + error.message);
        } finally {
            setIsImporting(false);
            setTimeout(() => setImportStatus(null), 5000);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar ideia..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleImportSeed}
                        disabled={isImporting}
                        className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        Importar Seed (PDF)
                    </button>
                    <button 
                        onClick={() => { setEditingIdea(null); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nova Ideia
                    </button>
                </div>
            </div>

            {importStatus && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">Sucesso!</span> {importStatus.success} ideias importadas do arquivo mestre.
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Título</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Nicho</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Votos</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {isLoading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                        ) : ideas?.map((idea) => (
                            <tr key={idea.id} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="text-sm font-bold text-zinc-900">{idea.title}</p>
                                    <p className="text-xs text-zinc-500 truncate max-w-[300px]">{idea.pain}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-1 rounded uppercase">{idea.niche}</span>
                                </td>
                                <td className="px-6 py-4 text-sm font-mono text-zinc-600">
                                    {idea.votes_count}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleEdit(idea)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                                        <button onClick={() => handleDelete(idea.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {ideas?.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-400 text-sm">Nenhuma ideia encontrada. Use o botão importar.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <NewIdeaModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave}
                initialData={editingIdea}
            />
        </div>
    );
};

export default AdminIdeas;
