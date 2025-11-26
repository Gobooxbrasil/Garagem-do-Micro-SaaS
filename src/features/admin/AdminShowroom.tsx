
import React, { useState, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useIdeas } from '../../hooks/use-ideas-cache';
import { Search, Loader2, Trash2, Edit2, Plus, ExternalLink, Square, CheckSquare, Rocket, Target, Megaphone, Image as ImageIcon, ChevronLeft, ChevronRight, Pencil, User, Mail } from 'lucide-react';
import NewProjectModal from '../ideas/NewProjectModal';
import { BulkEditModal } from './BulkEditModal';
import { Idea } from '../../types';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '../../lib/cache-keys';

interface AdminShowroomProps {
    session: any;
}

const AdminShowroom: React.FC<AdminShowroomProps> = ({ session }) => {
    const [search, setSearch] = useState('');
    // Busca apenas itens do showroom
    const { data: projects, isLoading } = useIdeas({ search, onlyShowroom: true });
    const queryClient = useQueryClient();

    // States de Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Idea | null>(null);

    // States de Paginação e Seleção
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    // Lógica de Paginação
    const paginatedData = useMemo(() => {
        if (!projects) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return projects.slice(startIndex, startIndex + itemsPerPage);
    }, [projects, currentPage, itemsPerPage]);

    const totalPages = projects ? Math.ceil(projects.length / itemsPerPage) : 0;

    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const handleSelectAll = () => {
        if (paginatedData.every(p => selectedIds.has(p.id))) {
            const newSelected = new Set(selectedIds);
            paginatedData.forEach(p => newSelected.delete(p.id));
            setSelectedIds(newSelected);
        } else {
            const newSelected = new Set(selectedIds);
            paginatedData.forEach(p => newSelected.add(p.id));
            setSelectedIds(newSelected);
        }
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleEdit = (project: Idea) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este projeto do Showroom?')) {
            setIsDeleting(id);
            try {
                // Cascade Delete Manual
                await Promise.all([
                    supabase.from('idea_votes').delete().eq('idea_id', id),
                    supabase.from('idea_interested').delete().eq('idea_id', id),
                    supabase.from('idea_improvements').delete().eq('idea_id', id),
                    supabase.from('idea_transactions').delete().eq('idea_id', id),
                    supabase.from('favorites').delete().eq('idea_id', id),
                    supabase.from('reviews').delete().eq('project_id', id), 
                    supabase.from('notifications').delete().match({ 'payload->idea_id': id })
                ]);

                const { error } = await supabase.from('ideas').delete().eq('id', id);
                if (error) throw error;

                queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
                setSelectedIds(prev => {
                    const next = new Set(prev);
                    next.delete(id);
                    return next;
                });
            } catch (error: any) {
                console.error("Erro ao excluir:", error);
                alert('Erro ao excluir: ' + error.message);
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleBulkDelete = async () => {
        const count = selectedIds.size;
        if (count === 0) return;
        const ids = Array.from(selectedIds);

        if (confirm(`Tem certeza que deseja excluir ${count} projetos selecionados?`)) {
            setIsBulkDeleting(true);
            try {
                await Promise.all([
                    supabase.from('idea_votes').delete().in('idea_id', ids),
                    supabase.from('idea_interested').delete().in('idea_id', ids),
                    supabase.from('favorites').delete().in('idea_id', ids),
                    supabase.from('reviews').delete().in('project_id', ids)
                ]);

                const { error } = await supabase.from('ideas').delete().in('id', ids);
                if (error) throw error;

                queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
                setSelectedIds(new Set());
            } catch (error: any) {
                alert('Erro ao excluir itens: ' + error.message);
            } finally {
                setIsBulkDeleting(false);
            }
        }
    };

    const handleBulkUpdate = async (updates: any) => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        const { error } = await supabase
            .from('ideas')
            .update(updates)
            .in('id', ids);

        if (error) throw error;

        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
        setSelectedIds(new Set());
        alert('Projetos atualizados com sucesso!');
    };

    const handleSave = async (projectData: any) => {
        if (projectData.id) {
            const { error } = await supabase.from('ideas').update(projectData).eq('id', projectData.id);
            if (error) alert('Erro ao atualizar: ' + error.message);
        } else {
            const { error } = await supabase.from('ideas').insert({
                ...projectData,
                user_id: session.user.id,
                votes_count: 0,
                is_showroom: true,
                short_id: Math.random().toString(36).substring(2, 8).toUpperCase()
            });
            if (error) alert('Erro ao criar: ' + error.message);
        }
        setIsModalOpen(false);
        setEditingProject(null);
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
    };

    const isAllSelected = paginatedData.length > 0 && paginatedData.every(p => selectedIds.has(p.id));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header Actions */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar projeto, nicho ou link..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {selectedIds.size > 0 && (
                        <>
                            <button 
                                onClick={() => setIsBulkEditModalOpen(true)}
                                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-sm font-bold transition-all flex items-center gap-2 animate-in fade-in zoom-in"
                            >
                                <Pencil className="w-4 h-4" /> Editar ({selectedIds.size})
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={isBulkDeleting}
                                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-bold transition-all flex items-center gap-2 animate-in fade-in zoom-in"
                            >
                                {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Apagar ({selectedIds.size})
                            </button>
                        </>
                    )}
                    
                    <button 
                        onClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                        className="px-4 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Novo Projeto
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <button onClick={handleSelectAll} className="text-zinc-400 hover:text-zinc-600 flex items-center justify-center">
                                        {isAllSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Projeto</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Criador</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Objetivo</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Categoria</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Engajamento</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                            ) : paginatedData.map((project) => {
                                const isSelected = selectedIds.has(project.id);
                                const hasImage = project.showroom_image || (project.images && project.images[0]);

                                return (
                                    <tr key={project.id} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-zinc-50'}`}>
                                        <td className="px-4 py-4">
                                            <button onClick={() => handleSelectOne(project.id)} className={`flex items-center justify-center ${isSelected ? 'text-blue-600' : 'text-zinc-300 hover:text-zinc-500'}`}>
                                                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0 relative">
                                                    {hasImage ? (
                                                        <img src={hasImage} className="w-full h-full object-cover" alt="Capa" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-300"><Rocket className="w-5 h-5" /></div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-zinc-900 line-clamp-1">{project.title}</p>
                                                    <a href={project.showroom_link} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate max-w-[200px]">
                                                        {project.showroom_link || 'Sem link'} <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 overflow-hidden flex-shrink-0">
                                                    {project.creator_avatar ? (
                                                        <img src={project.creator_avatar} className="w-full h-full object-cover" alt={project.creator_name || 'User'} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                            <User className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-zinc-900">{project.creator_name || 'Anônimo'}</span>
                                                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                                                        <Mail className="w-3 h-3" />
                                                        <span className="truncate max-w-[150px]" title={project.creator_email || project.user_id}>
                                                            {project.creator_email || project.user_id?.substring(0, 8) + '...'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {project.showroom_objective === 'feedback' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase border border-indigo-100">
                                                    <Target className="w-3 h-3" /> Feedback
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase border border-emerald-100">
                                                    <Megaphone className="w-3 h-3" /> Showcase
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-1 rounded uppercase whitespace-nowrap">{project.niche}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-zinc-700">{project.votes_count} Votos</span>
                                                <span className="text-[10px] text-zinc-400">{new Date(project.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEdit(project)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                                                <button 
                                                    onClick={() => handleDelete(project.id)} 
                                                    disabled={isDeleting === project.id}
                                                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    {isDeleting === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4"/>}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedData.length === 0 && !isLoading && (
                                <tr><td colSpan={7} className="p-8 text-center text-zinc-400 text-sm">Nenhum projeto encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Paginação */}
                <div className="border-t border-zinc-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-zinc-50">
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                        <span>Mostrar</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-white border border-zinc-300 rounded-lg text-xs py-1 px-2 focus:outline-none focus:border-zinc-500"
                        >
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>por página</span>
                        <span className="mx-2 text-zinc-300">|</span>
                        <span>Total: {projects?.length || 0}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-medium text-zinc-700 px-2">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 rounded-lg border border-zinc-300 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Reutiliza NewProjectModal para edição completa do showroom */}
            <NewProjectModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave}
                initialData={editingProject}
            />

            {/* Reutiliza BulkEditModal (já suporta campos de showroom como imagem e monetização) */}
            <BulkEditModal 
                isOpen={isBulkEditModalOpen}
                onClose={() => setIsBulkEditModalOpen(false)}
                selectedCount={selectedIds.size}
                onSave={handleBulkUpdate}
            />
        </div>
    );
};

export default AdminShowroom;
