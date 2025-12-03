import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Download } from '../../types';
import { Plus, Trash2, Edit2, ExternalLink, Save, X } from 'lucide-react';

const AdminDownloads: React.FC = () => {
    const [downloads, setDownloads] = useState<Download[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Download | null>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchDownloads();
    }, []);

    const fetchDownloads = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('downloads')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching downloads:', error);
        else setDownloads(data || []);
        setLoading(false);
    };

    const handleOpenModal = (item?: Download) => {
        if (item) {
            setEditingItem(item);
            setTitle(item.title);
            setDescription(item.description || '');
            setFileUrl(item.file_url);
        } else {
            setEditingItem(null);
            setTitle('');
            setDescription('');
            setFileUrl('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            title,
            description,
            file_url: fileUrl,
            updated_at: new Date().toISOString()
        };

        let error;
        if (editingItem) {
            const { error: updateError } = await supabase
                .from('downloads')
                .update(payload)
                .eq('id', editingItem.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('downloads')
                .insert(payload);
            error = insertError;
        }

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            setIsModalOpen(false);
            fetchDownloads();
        }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este arquivo?')) return;

        const { error } = await supabase.from('downloads').delete().eq('id', id);
        if (error) alert('Erro ao excluir: ' + error.message);
        else fetchDownloads();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-zinc-800">Gerenciar Arquivos</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-zinc-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-800 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Novo Arquivo
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-zinc-50 border-b border-zinc-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Título</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Link</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase">Data</th>
                            <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Carregando...</td></tr>
                        ) : downloads.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-zinc-500">Nenhum arquivo cadastrado.</td></tr>
                        ) : (
                            downloads.map(item => (
                                <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-medium text-zinc-900">{item.title}</p>
                                        {item.description && <p className="text-xs text-zinc-500 truncate max-w-xs">{item.description}</p>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 text-sm">
                                            Link <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-zinc-500">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                            <h3 className="font-bold text-zinc-900">{editingItem ? 'Editar Arquivo' : 'Novo Arquivo'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                    placeholder="Ex: E-book de Marketing"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição (Opcional)</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all h-24 resize-none"
                                    placeholder="Breve descrição do conteúdo..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Link do Arquivo (URL)</label>
                                <input
                                    type="url"
                                    required
                                    value={fileUrl}
                                    onChange={e => setFileUrl(e.target.value)}
                                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
                                    placeholder="https://drive.google.com/..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-black text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-800 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : <><Save className="w-4 h-4" /> Salvar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDownloads;
