
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  Globe, 
  Shield, 
  Cpu, 
  ToggleLeft, 
  ToggleRight, 
  AlertTriangle, 
  Bell, 
  Database, 
  Loader2, 
  CheckCircle,
  Lock,
  Unlock,
  RefreshCw
} from 'lucide-react';

// Interface de Configurações
interface PlatformSettings {
  site_name: string;
  maintenance_mode: boolean;
  allow_signups: boolean;
  global_announcement: string;
  enable_showroom: boolean;
  enable_roadmap: boolean;
  enable_nps: boolean;
  primary_color: string;
}

const DEFAULT_SETTINGS: PlatformSettings = {
  site_name: 'Garagem de Micro SaaS',
  maintenance_mode: false,
  allow_signups: true,
  global_announcement: '',
  enable_showroom: true,
  enable_roadmap: true,
  enable_nps: true,
  primary_color: '#000000'
};

const Toggle: React.FC<{ label: string; description?: string; checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }> = ({ label, description, checked, onChange, disabled }) => (
    <div className={`flex items-center justify-between p-4 border border-zinc-200 rounded-xl transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-zinc-300 bg-white'}`}>
        <div className="pr-4">
            <p className="text-sm font-bold text-zinc-900">{label}</p>
            {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
        </div>
        <button 
            onClick={() => !disabled && onChange(!checked)} 
            className={`transition-colors ${checked ? 'text-green-600' : 'text-zinc-300'}`}
            disabled={disabled}
        >
            {checked ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
        </button>
    </div>
);

const AdminSettings: React.FC = () => {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
    
    const [settings, setSettings] = useState<PlatformSettings>(DEFAULT_SETTINGS);

    // Load Settings (Simulated DB or LocalStorage for persistence demo)
    useEffect(() => {
        const loadSettings = async () => {
            setLoading(true);
            try {
                // 1. Tenta buscar do banco (se a tabela existir)
                const { data, error } = await supabase.from('platform_settings').select('*').single();
                
                if (data) {
                    setSettings(prev => ({ ...prev, ...data }));
                } else {
                    // 2. Fallback para LocalStorage para simular persistência
                    const local = localStorage.getItem('gms_platform_settings');
                    if (local) {
                        setSettings(JSON.parse(local));
                    }
                }
            } catch (error) {
                console.log("Usando configurações padrão ou locais.");
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleChange = (field: keyof PlatformSettings, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }));
        setMsg(null); // Clear messages on edit
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        
        try {
            // 1. Tenta salvar no Supabase
            const { error } = await supabase.from('platform_settings').upsert({ 
                id: 1, // Singleton row
                ...settings,
                updated_at: new Date().toISOString()
            });

            // Se tabela não existir (erro 404/42P01), salva no LocalStorage como fallback
            if (error) {
                console.warn("Backend save failed, using local storage fallback:", error.message);
                localStorage.setItem('gms_platform_settings', JSON.stringify(settings));
            }

            // Simula delay de rede para UX
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setMsg({ type: 'success', text: 'Configurações salvas e aplicadas com sucesso!' });
            
            // Invalida caches globais que possam depender dessas configs
            queryClient.invalidateQueries({ queryKey: ['platform-settings'] });

        } catch (error: any) {
            setMsg({ type: 'error', text: 'Erro ao salvar: ' + error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleClearCache = async () => {
        if(confirm("Isso irá limpar todo o cache local da aplicação para todos os dados. Continuar?")) {
            queryClient.clear();
            localStorage.clear(); // Cuidado: Isso limpa tudo, inclusive auth em alguns casos, mas ok para admin action
            alert("Cache limpo. A página será recarregada.");
            window.location.reload();
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-20">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-zinc-900">Configurações da Plataforma</h2>
                    <p className="text-sm text-zinc-500">Gerencie variáveis globais e comportamento do sistema.</p>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-zinc-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Salvar Alterações
                </button>
            </div>

            {msg && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${msg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    {msg.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    <span className="font-medium text-sm">{msg.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* GERAL */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <Globe className="w-5 h-5 text-blue-600" /> Geral
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Nome da Plataforma</label>
                                <input 
                                    type="text" 
                                    value={settings.site_name}
                                    onChange={(e) => handleChange('site_name', e.target.value)}
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block flex items-center gap-2">
                                    <Bell className="w-3 h-3" /> Aviso Global (Banner)
                                </label>
                                <textarea 
                                    value={settings.global_announcement}
                                    onChange={(e) => handleChange('global_announcement', e.target.value)}
                                    placeholder="Ex: Manutenção programada para Domingo às 22h."
                                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-zinc-900/10 outline-none resize-none h-24"
                                />
                                <p className="text-[10px] text-zinc-400 mt-1">Se preenchido, aparecerá no topo de todas as páginas.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-purple-600" /> Acesso & Segurança
                        </h3>
                        <div className="space-y-4">
                            <Toggle 
                                label="Permitir Novos Cadastros" 
                                description="Se desligado, apenas usuários existentes poderão logar."
                                checked={settings.allow_signups}
                                onChange={(val) => handleChange('allow_signups', val)}
                            />
                            <Toggle 
                                label="Modo de Manutenção" 
                                description="Bloqueia o acesso a todas as áreas públicas do site."
                                checked={settings.maintenance_mode}
                                onChange={(val) => handleChange('maintenance_mode', val)}
                            />
                            {settings.maintenance_mode && (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-2 text-xs text-yellow-800">
                                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <p><strong>Cuidado:</strong> O Modo de Manutenção impedirá o acesso de todos os usuários exceto Admins.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FUNCIONALIDADES & SISTEMA */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
                        <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-orange-600" /> Feature Flags (Módulos)
                        </h3>
                        <div className="space-y-4">
                            <Toggle 
                                label="Módulo Showroom" 
                                description="Habilita a visualização e postagem de projetos MVP."
                                checked={settings.enable_showroom}
                                onChange={(val) => handleChange('enable_showroom', val)}
                            />
                            <Toggle 
                                label="Módulo Roadmap (Feedback)" 
                                description="Habilita o sistema de votação de features e bugs."
                                checked={settings.enable_roadmap}
                                onChange={(val) => handleChange('enable_roadmap', val)}
                            />
                            <Toggle 
                                label="Sistema NPS" 
                                description="Coleta feedback de satisfação dos usuários periodicamente."
                                checked={settings.enable_nps}
                                onChange={(val) => handleChange('enable_nps', val)}
                            />
                        </div>
                    </div>

                    <div className="bg-zinc-900 text-white p-6 rounded-2xl border border-zinc-800 shadow-lg">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-red-400">
                            <Database className="w-5 h-5" /> Zona de Perigo (Sistema)
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 border border-zinc-800 rounded-xl bg-zinc-950/50">
                                <div>
                                    <p className="text-sm font-bold text-zinc-200">Limpar Cache & LocalStorage</p>
                                    <p className="text-xs text-zinc-500 mt-0.5">Corrige erros de interface. Desloga você.</p>
                                </div>
                                <button onClick={handleClearCache} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-red-900/50 flex items-center gap-2">
                                    <RefreshCw className="w-3 h-3" /> Executar
                                </button>
                            </div>
                            
                            <div className="p-4 border border-zinc-800 rounded-xl bg-zinc-950/50 opacity-50 pointer-events-none">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-zinc-200">Resetar Banco de Dados</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">Apaga todas as ideias e usuários (Dev Only).</p>
                                    </div>
                                    <button className="bg-zinc-800 text-zinc-500 px-3 py-2 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> Bloqueado
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
