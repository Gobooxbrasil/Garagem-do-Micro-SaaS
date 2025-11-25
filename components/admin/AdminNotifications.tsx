

import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Bell, 
  Globe, 
  Save, 
  Loader2, 
  CheckCircle, 
  Megaphone, 
  AlertTriangle, 
  Info, 
  Search,
  Send,
  User,
  X,
  Users,
  Link as LinkIcon,
  Trash2
} from 'lucide-react';

interface AdminNotificationsProps {
  session: any;
}

const TEMPLATES = [
    { 
        label: "Manutenção Programada", 
        text: "⚠️ Manutenção: O sistema ficará indisponível dia XX/XX das 22h às 00h para melhorias." 
    },
    { 
        label: "Recesso de Suporte", 
        text: "ℹ️ Aviso: Nosso time de suporte estará em recesso no feriado. Retornamos dia XX/XX." 
    },
    { 
        label: "Nova Funcionalidade", 
        text: "🚀 Novidade: O módulo de Roadmap acaba de ser lançado! Confira no menu lateral." 
    },
    {
        label: "Instabilidade",
        text: "⚠️ Estamos cientes da instabilidade no acesso. Nossa equipe já está atuando na correção."
    }
];

const AdminNotifications: React.FC<AdminNotificationsProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'global' | 'push'>('global');
  
  // --- GLOBAL BANNER STATE ---
  const [globalAnnouncement, setGlobalAnnouncement] = useState('');
  const [settingsId, setSettingsId] = useState<number | null>(null); // Armazena o ID da config
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [globalMsg, setGlobalMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // --- PUSH NOTIFICATION STATE ---
  const [targetType, setTargetType] = useState<'all' | 'specific'>('specific');
  const [pushMessage, setPushMessage] = useState('');
  const [pushLink, setPushLink] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [searchingUser, setSearchingUser] = useState(false);
  const [sendingPush, setSendingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Load Global Settings
  useEffect(() => {
    const loadSettings = async () => {
        setLoadingGlobal(true);
        try {
            // Pega a primeira linha que encontrar (Singleton)
            const { data } = await supabase.from('platform_settings').select('id, global_announcement').limit(1).single();
            if (data) {
                setGlobalAnnouncement(data.global_announcement || '');
                setSettingsId(data.id);
            }
        } catch (err) {
            // Silent fail
        } finally {
            setLoadingGlobal(false);
        }
    };
    loadSettings();
  }, []);

  // Search Users Logic
  useEffect(() => {
      const searchUsers = async () => {
          if (userSearch.length < 3) {
              setFoundUsers([]);
              return;
          }
          setSearchingUser(true);
          const { data } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .or(`full_name.ilike.%${userSearch}%,email.ilike.%${userSearch}%`)
            .limit(5);
          
          setFoundUsers(data || []);
          setSearchingUser(false);
      };

      const timeoutId = setTimeout(searchUsers, 500);
      return () => clearTimeout(timeoutId);
  }, [userSearch]);

  // --- HANDLERS ---

  const handleSaveGlobal = async () => {
      setSavingGlobal(true);
      setGlobalMsg(null);
      try {
          let error;
          if (settingsId) {
              // Update existing
              const res = await supabase
                .from('platform_settings')
                .update({ 
                    global_announcement: globalAnnouncement,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', settingsId);
              error = res.error;
          } else {
              // Insert new (should be handled by initial SQL but failsafe)
              const res = await supabase
                .from('platform_settings')
                .insert({ 
                    global_announcement: globalAnnouncement,
                    updated_at: new Date().toISOString() 
                })
                .select('id')
                .single();
              
              if (res.data) setSettingsId(res.data.id);
              error = res.error;
          }

          if (error) throw error;
          setGlobalMsg({ type: 'success', text: 'Banner atualizado com sucesso!' });
      } catch (error: any) {
          setGlobalMsg({ type: 'error', text: 'Erro ao salvar: ' + error.message });
      } finally {
          setSavingGlobal(false);
      }
  };

  const handleClearGlobal = async () => {
      setGlobalAnnouncement('');
      setSavingGlobal(true);
      try {
          if (settingsId) {
              await supabase.from('platform_settings').update({ global_announcement: '' }).eq('id', settingsId);
              setGlobalMsg({ type: 'success', text: 'Banner removido.' });
          }
      } catch(e) {
          console.error(e);
      } finally {
          setSavingGlobal(false);
      }
  };

  const handleSendPush = async () => {
      if (!pushMessage) {
          setPushStatus({ type: 'error', text: 'Digite uma mensagem.' });
          return;
      }
      if (targetType === 'specific' && !selectedUser) {
          setPushStatus({ type: 'error', text: 'Selecione um usuário.' });
          return;
      }

      setSendingPush(true);
      setPushStatus(null);

      try {
          const payload = {
              message: pushMessage,
              link: pushLink || undefined
          };

          if (targetType === 'specific') {
              await supabase.from('notifications').insert({
                  recipient_id: selectedUser.id,
                  sender_id: session.user.id,
                  type: 'SYSTEM',
                  payload
              });
              setPushStatus({ type: 'success', text: `Enviado para ${selectedUser.full_name}` });
          } else {
              // BULK SEND STRATEGY (Client-side batching)
              const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
              
              if (count && count > 1000) {
                  if(!confirm(`Atenção: Você está prestes a enviar notificações para ${count} usuários. Isso pode levar alguns instantes. Continuar?`)) {
                      setSendingPush(false);
                      return;
                  }
              }

              let page = 0;
              const pageSize = 100;
              let hasMore = true;
              let totalSent = 0;

              while (hasMore) {
                  const { data: users } = await supabase
                    .from('profiles')
                    .select('id')
                    .range(page * pageSize, (page + 1) * pageSize - 1);

                  if (!users || users.length === 0) {
                      hasMore = false;
                      break;
                  }

                  const notifications = users.map(u => ({
                      recipient_id: u.id,
                      sender_id: session.user.id,
                      type: 'SYSTEM',
                      payload
                  }));

                  const { error } = await supabase.from('notifications').insert(notifications);
                  if (error) throw error;

                  totalSent += users.length;
                  page++;
              }
              
              setPushStatus({ type: 'success', text: `Enviado para ${totalSent} usuários com sucesso!` });
          }

          // Reset form
          setPushMessage('');
          setPushLink('');
          
      } catch (error: any) {
          setPushStatus({ type: 'error', text: 'Erro no envio: ' + error.message });
      } finally {
          setSendingPush(false);
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
        
        {/* Tabs */}
        <div className="flex space-x-4 bg-white p-1 rounded-xl border border-zinc-200 shadow-sm w-fit">
            <button
                onClick={() => setActiveTab('global')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'global' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
                <Globe className="w-4 h-4" /> Banner Global
            </button>
            <button
                onClick={() => setActiveTab('push')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'push' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}`}
            >
                <Bell className="w-4 h-4" /> Notificação Push
            </button>
        </div>

        {/* --- GLOBAL BANNER TAB --- */}
        {activeTab === 'global' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 mb-1 flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-blue-600" /> Configurar Aviso
                        </h3>
                        <p className="text-sm text-zinc-500 mb-6">Este texto aparecerá fixado no topo de todas as páginas do sistema.</p>

                        {globalMsg && (
                            <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${globalMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                {globalMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                {globalMsg.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            <textarea 
                                value={globalAnnouncement}
                                onChange={(e) => setGlobalAnnouncement(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                                placeholder="Digite o aviso aqui..."
                            />
                            
                            <div className="flex gap-3 justify-end">
                                {globalAnnouncement && (
                                    <button 
                                        onClick={handleClearGlobal}
                                        disabled={savingGlobal}
                                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Limpar
                                    </button>
                                )}
                                <button 
                                    onClick={handleSaveGlobal}
                                    disabled={savingGlobal || loadingGlobal}
                                    className="bg-zinc-900 hover:bg-black text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
                                >
                                    {savingGlobal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Publicar Aviso
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm opacity-75 hover:opacity-100 transition-opacity">
                        <h4 className="text-xs font-bold text-zinc-400 uppercase mb-4">Preview Visual</h4>
                        <div className="border border-zinc-200 rounded-lg overflow-hidden">
                            {globalAnnouncement ? (
                                <div className="bg-indigo-600 text-white px-4 py-3 text-sm font-medium text-center flex items-center justify-center gap-2">
                                    <Info className="w-4 h-4" /> {globalAnnouncement}
                                </div>
                            ) : (
                                <div className="bg-gray-100 text-gray-400 px-4 py-3 text-sm font-medium text-center border-b border-gray-200">
                                    (Sem aviso ativo)
                                </div>
                            )}
                            <div className="bg-zinc-50 h-32 flex items-center justify-center text-zinc-300 text-sm font-mono">
                                [Conteúdo do Site]
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Templates */}
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm h-fit">
                    <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" /> Templates Rápidos
                    </h3>
                    <div className="space-y-3">
                        {TEMPLATES.map((tpl, idx) => (
                            <button
                                key={idx}
                                onClick={() => setGlobalAnnouncement(tpl.text)}
                                className="w-full text-left p-3 rounded-xl border border-zinc-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
                            >
                                <p className="text-xs font-bold text-zinc-700 group-hover:text-blue-700 mb-1">{tpl.label}</p>
                                <p className="text-[10px] text-zinc-500 line-clamp-2">{tpl.text}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- PUSH NOTIFICATION TAB --- */}
        {activeTab === 'push' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-1 flex items-center gap-2">
                            <Send className="w-5 h-5 text-purple-600" /> Enviar Notificação
                        </h3>
                        <p className="text-sm text-zinc-500">Envie alertas direto para a área de notificações do usuário.</p>
                    </div>

                    {pushStatus && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${pushStatus.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {pushStatus.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {pushStatus.text}
                        </div>
                    )}

                    {/* Target Selector */}
                    <div className="flex gap-4">
                        <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetType === 'specific' ? 'border-purple-500 bg-purple-50' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                            <input type="radio" checked={targetType === 'specific'} onChange={() => setTargetType('specific')} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${targetType === 'specific' ? 'border-purple-600' : 'border-zinc-400'}`}>
                                {targetType === 'specific' && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                            </div>
                            <span className="text-sm font-bold text-zinc-700">Usuário Específico</span>
                        </label>
                        <label className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${targetType === 'all' ? 'border-purple-500 bg-purple-50' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                            <input type="radio" checked={targetType === 'all'} onChange={() => setTargetType('all')} className="hidden" />
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${targetType === 'all' ? 'border-purple-600' : 'border-zinc-400'}`}>
                                {targetType === 'all' && <div className="w-2 h-2 rounded-full bg-purple-600" />}
                            </div>
                            <span className="text-sm font-bold text-zinc-700">Todos os Usuários</span>
                        </label>
                    </div>

                    {/* User Search (If Specific) */}
                    {targetType === 'specific' && (
                        <div className="space-y-2 relative">
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Buscar Usuário</label>
                            
                            {selectedUser ? (
                                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-700 font-bold">
                                            {selectedUser.full_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-zinc-900">{selectedUser.full_name}</p>
                                            <p className="text-xs text-zinc-500">{selectedUser.email}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-purple-100 rounded-full text-purple-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
                                    <input 
                                        type="text" 
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        placeholder="Nome ou email..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                    {searchingUser && <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-zinc-400" />}
                                    
                                    {/* Dropdown Results */}
                                    {foundUsers.length > 0 && !selectedUser && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-lg z-10 overflow-hidden">
                                            {foundUsers.map(u => (
                                                <button
                                                    key={u.id}
                                                    onClick={() => { setSelectedUser(u); setUserSearch(''); setFoundUsers([]); }}
                                                    className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 text-left transition-colors border-b border-zinc-50 last:border-0"
                                                >
                                                    <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500">
                                                        <User className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-zinc-800">{u.full_name}</p>
                                                        <p className="text-xs text-zinc-400">{u.email}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Message Content */}
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block">Mensagem</label>
                            <textarea 
                                value={pushMessage}
                                onChange={(e) => setPushMessage(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none"
                                placeholder="Ex: Olá! Vimos que você se interessou pelo projeto X..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase ml-1 mb-1 block flex items-center gap-1"><LinkIcon className="w-3 h-3"/> Link (Opcional)</label>
                            <input 
                                type="text"
                                value={pushLink}
                                onChange={(e) => setPushLink(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-100">
                        <button 
                            onClick={handleSendPush}
                            disabled={sendingPush}
                            className="w-full bg-zinc-900 hover:bg-black text-white py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {sendingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {targetType === 'all' ? 'Disparar para Todos' : 'Enviar Notificação'}
                        </button>
                    </div>
                </div>

                {/* Instructions / Info */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 h-fit">
                    <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
                        <Info className="w-5 h-5" /> Sobre Notificações
                    </h4>
                    <ul className="space-y-3 text-sm text-blue-700">
                        <li className="flex gap-2">
                            <span className="font-bold">•</span>
                            O envio para "Todos os Usuários" pode levar alguns segundos para ser processado dependendo do tamanho da base.
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">•</span>
                            Se incluir um link, o usuário será redirecionado ao clicar na notificação.
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold">•</span>
                            Use essa função com moderação para não gerar spam e perder a atenção dos usuários.
                        </li>
                    </ul>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminNotifications;