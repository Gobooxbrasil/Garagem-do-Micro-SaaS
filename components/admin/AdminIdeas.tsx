
import React, { useState, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useIdeas } from '../../hooks/use-ideas-cache';
import { Search, Loader2, Trash2, Edit2, Plus, Upload, Download, CheckCircle, ChevronLeft, ChevronRight, Square, CheckSquare, FileSpreadsheet, AlertCircle, HelpCircle } from 'lucide-react';
import NewIdeaModal from '../NewIdeaModal';
import { Idea } from '../../types';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from '../../lib/cache-keys';
import Papa from 'papaparse';

interface AdminIdeasProps {
    session: any;
}

const AdminIdeas: React.FC<AdminIdeasProps> = ({ session }) => {
    const [search, setSearch] = useState('');
    const { data: ideas, isLoading } = useIdeas({ search });
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // States de Modal e Importação
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [importStatus, setImportStatus] = useState<{total: number, success: number} | null>(null);

    // States de Paginação e Seleção
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);

    // Lógica de Paginação
    const paginatedData = useMemo(() => {
        if (!ideas) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        return ideas.slice(startIndex, startIndex + itemsPerPage);
    }, [ideas, currentPage, itemsPerPage]);

    const totalPages = ideas ? Math.ceil(ideas.length / itemsPerPage) : 0;

    // Resetar página ao pesquisar
    React.useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    // Handlers de Seleção
    const handleSelectAll = () => {
        if (paginatedData.every(idea => selectedIds.has(idea.id))) {
            // Desmarcar todos da página atual
            const newSelected = new Set(selectedIds);
            paginatedData.forEach(idea => newSelected.delete(idea.id));
            setSelectedIds(newSelected);
        } else {
            // Marcar todos da página atual
            const newSelected = new Set(selectedIds);
            paginatedData.forEach(idea => newSelected.add(idea.id));
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

    const handleEdit = (idea: Idea) => {
        setEditingIdea(idea);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta ideia permanentemente?')) {
            await supabase.from('ideas').delete().eq('id', id);
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleBulkDelete = async () => {
        const count = selectedIds.size;
        if (count === 0) return;

        if (confirm(`Tem certeza que deseja excluir ${count} ideias selecionadas? Essa ação não pode ser desfeita.`)) {
            setIsBulkDeleting(true);
            try {
                const { error } = await supabase
                    .from('ideas')
                    .delete()
                    .in('id', Array.from(selectedIds));

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

    // --- LÓGICA DE IMPORTAÇÃO CSV ---

    const handleDownloadTemplate = () => {
        const headers = [
            "Titulo",
            "Nicho",
            "Dor",
            "Solucao",
            "Porque",
            "Modelo Preco",
            "Publico Alvo",
            "Estrategia Vendas",
            "PDR Tecnico",
            "Tipo Monetizacao",
            "Valor"
        ];
        
        const exampleRow = [
            "Exemplo de SaaS",
            "Produtividade",
            "Empresas perdem tempo com X...",
            "Um software que automatiza Y...",
            "Baixo custo de entrada e alta recorrência",
            "Assinatura Mensal",
            "Pequenas Empresas",
            "Ads e Outbound",
            "React + Node.js",
            "NONE",
            "0"
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(",") + "\n" 
            + exampleRow.map(field => `"${field}"`).join(",");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "modelo_importacao_ideias.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset value
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: async (results) => {
                try {
                    const rows = results.data;
                    
                    if (rows.length === 0) {
                        alert("O arquivo parece estar vazio ou o formato não foi reconhecido.");
                        setIsImporting(false);
                        return;
                    }

                    // Helper to normalize keys: remove accents, lowercase, remove special chars
                    const normalizeKey = (key: string) => key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

                    const rowsToInsert = rows.map((row: any) => {
                        // Find value by fuzzy key matching
                        const getValue = (searchKeys: string[]) => {
                            const foundKey = Object.keys(row).find(k => {
                                const normalizedK = normalizeKey(k);
                                return searchKeys.some(sk => normalizedK.includes(sk));
                            });
                            return foundKey ? row[foundKey]?.toString().trim() : "";
                        };

                        const monTypeRaw = getValue(['tipomonetizacao', 'monetizacao', 'tipo']).toUpperCase();
                        const monetization_type = ["PAID", "DONATION"].includes(monTypeRaw) ? monTypeRaw : "NONE";
                        const payment_type = monetization_type === 'PAID' ? 'paid' : monetization_type === 'DONATION' ? 'donation' : 'free';
                        
                        const priceRaw = getValue(['valor', 'price', 'custo']);
                        // Remove currency symbols, handle comma/dot
                        const priceClean = priceRaw.replace(/[^0-9.,]/g, '').replace(',', '.');
                        const price = parseFloat(priceClean) || 0;

                        return {
                            title: getValue(['titulo', 'title', 'nome']) || "Sem Título",
                            niche: getValue(['nicho', 'categoria', 'niche']) || "Outros",
                            pain: getValue(['dor', 'problema', 'pain']) || "",
                            solution: getValue(['solucao', 'solucao', 'solution', 'produto']) || "",
                            why: getValue(['porque', 'why', 'motivo']) || "",
                            pricing_model: getValue(['modelopreco', 'precificacao', 'pricing']) || "",
                            target: getValue(['publico', 'alvo', 'target']) || "",
                            sales_strategy: getValue(['estrategia', 'vendas', 'sales']) || "",
                            pdr: getValue(['pdr', 'tecnico', 'stack']) || "",
                            
                            monetization_type,
                            payment_type,
                            price,
                            
                            // Campos padrão
                            user_id: session.user.id,
                            votes_count: 0,
                            is_building: false,
                            short_id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                            created_at: new Date().toISOString()
                        };
                    });

                    // Insert in batches of 50
                    const batchSize = 50;
                    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
                        const batch = rowsToInsert.slice(i, i + batchSize);
                        const { error } = await supabase.from('ideas').insert(batch);
                        if (error) throw error;
                    }

                    setImportStatus({ total: rowsToInsert.length, success: rowsToInsert.length });
                    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
                    alert(`${rowsToInsert.length} projetos importados com sucesso!`);

                } catch (error: any) {
                    console.error(error);
                    alert("Erro ao processar planilha: " + (error.message || "Erro desconhecido"));
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                    setTimeout(() => setImportStatus(null), 5000);
                }
            },
            error: (error) => {
                console.error(error);
                alert("Erro ao ler o arquivo CSV: " + error.message);
                setIsImporting(false);
            }
        });
    };

    const isAllSelected = paginatedData.length > 0 && paginatedData.every(i => selectedIds.has(i.id));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* Header Actions */}
            <div className="flex flex-col xl:flex-row justify-between gap-4 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar por título, dor ou solução..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {selectedIds.size > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            disabled={isBulkDeleting}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-bold transition-all flex items-center gap-2 animate-in fade-in zoom-in"
                        >
                            {isBulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Apagar ({selectedIds.size})
                        </button>
                    )}
                    
                    {/* Botões de Importação CSV */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".csv,.txt" 
                    />
                    
                    <button 
                        onClick={handleDownloadTemplate}
                        className="px-4 py-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                        title="Baixar modelo CSV"
                    >
                        <Download className="w-4 h-4" />
                        Baixar Modelo
                    </button>

                    <button 
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-bold transition-all flex items-center gap-2 relative group"
                    >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                        Importar Planilha
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-black text-white text-[10px] rounded text-center z-50">
                            Suporta CSV com campos multi-linha e aspas (Excel)
                        </div>
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
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-bold">Sucesso!</span> {importStatus.success} projetos importados e processados.
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-zinc-50 border-b border-zinc-200">
                            <tr>
                                <th className="px-4 py-4 w-10">
                                    <button onClick={handleSelectAll} className="text-zinc-400 hover:text-zinc-600 flex items-center justify-center">
                                        {isAllSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Título / Problema</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Nicho</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-zinc-500"><Loader2 className="w-6 h-6 animate-spin mx-auto"/></td></tr>
                            ) : paginatedData.map((idea) => {
                                const isSelected = selectedIds.has(idea.id);
                                return (
                                    <tr key={idea.id} className={`transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-zinc-50'}`}>
                                        <td className="px-4 py-4">
                                            <button onClick={() => handleSelectOne(idea.id)} className={`flex items-center justify-center ${isSelected ? 'text-blue-600' : 'text-zinc-300 hover:text-zinc-500'}`}>
                                                {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-zinc-900 line-clamp-1">{idea.title}</p>
                                            <p className="text-xs text-zinc-500 truncate max-w-[350px]">{idea.pain}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-1 rounded uppercase whitespace-nowrap">{idea.niche}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-xs font-mono text-zinc-500 bg-zinc-100 px-1.5 rounded border border-zinc-200">
                                                    Votes: {idea.votes_count}
                                                </div>
                                                {idea.is_showroom && <span className="w-2 h-2 rounded-full bg-purple-500" title="No Showroom"></span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleEdit(idea)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(idea.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedData.length === 0 && !isLoading && (
                                <tr><td colSpan={5} className="p-8 text-center text-zinc-400 text-sm">Nenhuma ideia encontrada.</td></tr>
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
                        <span>Total: {ideas?.length || 0}</span>
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
