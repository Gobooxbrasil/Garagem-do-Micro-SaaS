import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AdminSubview } from '../../types';
import {
  LayoutDashboard,
  Users,
  Lightbulb,
  Rocket,
  Star,
  MessageSquare,
  ClipboardList,
  Settings,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
  Bell,
  Download
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import AdminUsers from './AdminUsers';
import AdminIdeas from './AdminIdeas';
import AdminShowroom from './AdminShowroom';
import AdminNPS from './AdminNPS';
import AdminFeedback from './AdminFeedback';
import AdminLogs from './AdminLogs';
import AdminSettings from './AdminSettings';
import AdminNotifications from './AdminNotifications';
import AdminDownloads from './AdminDownloads';

// Placeholders for other components
const Placeholder = ({ title }: { title: string }) => (
  <div className="p-8 text-center text-gray-500">
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p>Módulo em desenvolvimento.</p>
  </div>
);

interface AdminLayoutProps {
  currentView: AdminSubview;
  onNavigate: (view: AdminSubview) => void;
  onExit: () => void;
  session: any;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ currentView, onNavigate, onExit, session }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!session?.user) {
        onExit();
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

      if (data?.is_admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        onExit(); // Redirect if not admin
      }
    };
    checkAdmin();
  }, [session]);

  if (isAdmin === null) return <div className="h-screen flex items-center justify-center bg-zinc-950 text-white">Verificando permissões...</div>;
  if (isAdmin === false) return null;

  const menuItems = [
    { id: 'DASHBOARD' as AdminSubview, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'USERS' as AdminSubview, label: 'Usuários', icon: Users },
    { id: 'IDEAS' as AdminSubview, label: 'Ideias', icon: Lightbulb },
    { id: 'SHOWROOM' as AdminSubview, label: 'Showroom', icon: Rocket },
    { id: 'DOWNLOADS' as AdminSubview, label: 'Arquivos', icon: Download },
    { id: 'NOTIFICATIONS' as AdminSubview, label: 'Notificações', icon: Bell },
    { id: 'NPS' as AdminSubview, label: 'Avaliações NPS', icon: Star },
    { id: 'FEEDBACK' as AdminSubview, label: 'Feedback', icon: MessageSquare },
    { id: 'LOGS' as AdminSubview, label: 'Logs do Sistema', icon: ClipboardList },
    { id: 'SETTINGS' as AdminSubview, label: 'Configurações', icon: Settings },
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD': return <AdminDashboard />;
      case 'USERS': return <AdminUsers session={session} />;
      case 'IDEAS': return <AdminIdeas session={session} />;
      case 'SHOWROOM': return <AdminShowroom session={session} />;
      case 'DOWNLOADS': return <AdminDownloads />;
      case 'NPS': return <AdminNPS session={session} />;
      case 'FEEDBACK': return <AdminFeedback session={session} />;
      case 'LOGS': return <AdminLogs session={session} />;
      case 'SETTINGS': return <AdminSettings />;
      case 'NOTIFICATIONS': return <AdminNotifications session={session} />;
      default: return <Placeholder title={menuItems.find(i => i.id === currentView)?.label || 'Admin'} />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex font-sans text-zinc-900">

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-zinc-950 text-zinc-400 border-r border-zinc-800 fixed h-full z-20">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-black font-bold">G</div>
          <span className="text-white font-bold text-lg tracking-tight">Admin Panel</span>
        </div>

        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentView === item.id ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-900 hover:text-white'}`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button onClick={onExit} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-zinc-900 hover:text-white transition-colors">
            <ExternalLink className="w-4 h-4" /> Ver Site
          </button>
          <button onClick={async () => { await supabase.auth.signOut(); onExit(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 bg-zinc-950 z-30 flex items-center justify-between px-4 border-b border-zinc-800">
        <span className="text-white font-bold">Admin Panel</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white p-2">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-zinc-950 z-20 pt-20 px-4 space-y-2 md:hidden">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${currentView === item.id ? 'bg-zinc-800 text-white' : 'text-zinc-400'}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
          <button onClick={onExit} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 mt-4 border-t border-zinc-800">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow md:ml-72 pt-16 md:pt-0 min-h-screen bg-zinc-50">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h1 className="text-xl font-bold text-zinc-900">{menuItems.find(i => i.id === currentView)?.label}</h1>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-zinc-200">
              <div className="text-right">
                <p className="text-sm font-bold text-zinc-900">{session.user.user_metadata.full_name || 'Admin'}</p>
                <p className="text-xs text-zinc-500">Super Admin</p>
              </div>
              <div className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
                {session.user.user_metadata.avatar_url ? <img src={session.user.user_metadata.avatar_url} className="w-full h-full rounded-full object-cover" /> : <span className="font-bold text-zinc-400">A</span>}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;