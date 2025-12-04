import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import {
    Layers, Lightbulb, Rocket, Map, Bell, User, LogOut, ShieldCheck, ChevronDown, Check, Trash2, MessageCircle, Info, Download
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useNotifications } from '../../hooks/use-ideas-cache';
import { CACHE_KEYS } from '../../lib/cache-keys';
import { useQueryClient } from '@tanstack/react-query';
import AuthModal from '../../features/auth/AuthModal';

export const Layout: React.FC = () => {
    const { session, userAvatar, signOut, isAdmin } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(null);

    const profileMenuRef = useRef<HTMLDivElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    const { data: notificationsData } = useNotifications(session?.user?.id);
    const unreadCount = notificationsData?.filter(n => !n.read).length || 0;

    // Fetch Announcement
    useEffect(() => {
        const fetchAnnouncement = async () => {
            try {
                const { data } = await supabase.from('platform_settings').select('global_announcement').limit(1).maybeSingle();
                setGlobalAnnouncement(data?.global_announcement || null);
            } catch (err) { setGlobalAnnouncement(null); }
        };
        fetchAnnouncement();
    }, []);

    // Click Outside Handlers
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setShowProfileMenu(false);
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await signOut();
        navigate('/');
        setShowProfileMenu(false);
    };

    const markNotificationAsRead = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.notifications.unread(session?.user?.id || '') });
    };

    const deleteNotification = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        await supabase.from('notifications').delete().eq('id', id);
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.notifications.unread(session?.user?.id || '') });
    };

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="min-h-screen bg-apple-bg font-sans text-apple-text selection:bg-apple-blue selection:text-white pb-20 flex flex-col">

            <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
                {globalAnnouncement && (
                    <div className="bg-indigo-600 text-white text-xs font-bold text-center py-2 px-4 relative z-50 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                        <Info className="w-3.5 h-3.5" />
                        {globalAnnouncement}
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/ideas')}>
                        <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Layers className="text-white w-6 h-6" strokeWidth={1.5} />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold tracking-tight text-gray-900">Garagem</span>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-[0.2em] mt-1">
                                DE MICRO SAAS
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex bg-gray-100/50 p-1 rounded-full mr-4 border border-gray-200/50">
                            <button onClick={() => navigate('/ideas')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/ideas') ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><Lightbulb className="w-4 h-4" />Ideias</button>
                            <button onClick={() => navigate('/showroom')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/showroom') ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><Rocket className="w-4 h-4" />Projetos</button>
                            <button onClick={() => navigate('/roadmap')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/roadmap') ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><Map className="w-4 h-4" /> Feedback</button>
                            <button onClick={() => navigate('/downloads')} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${isActive('/downloads') ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><Download className="w-4 h-4" /> Arquivos</button>
                        </div>

                        <div className="relative" ref={notificationRef}>
                            <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-gray-400 hover:text-black transition-colors relative">
                                <Bell className="w-5 h-5" />
                                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                            </button>
                            {showNotifications && (
                                <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Notificações</span>
                                        {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {!notificationsData || notificationsData.length === 0 ? <div className="p-8 text-center text-gray-400 text-sm">Nenhuma notificação.</div> : notificationsData.map(notif => (
                                            <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 items-start group ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                                <div className="flex-grow min-w-0">
                                                    <p className="text-xs text-gray-400 mb-1 flex justify-between">{new Date(notif.created_at).toLocaleDateString()}</p>
                                                    <p className="text-sm text-gray-700 line-clamp-2">{notif.type === 'NEW_VOTE' ? 'Novo voto na sua ideia.' : notif.payload?.message || 'Nova interação.'}</p>
                                                </div>
                                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                                    {!notif.read && <button onClick={(e) => markNotificationAsRead(notif.id, e)} className="p-1 hover:bg-green-100 text-green-600 rounded"><Check className="w-3 h-3" /></button>}
                                                    <button onClick={(e) => deleteNotification(notif.id, e)} className="p-1 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-3 h-3" /></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {session ? (
                            <div className="relative" ref={profileMenuRef}>
                                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-3 pl-3 border-l border-gray-200 group">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Logado como</p>
                                        <p className="text-sm font-bold text-apple-text group-hover:text-apple-blue transition-colors">{session.user.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}</p>
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-apple-blue transition-all">
                                        {userAvatar ? <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-5 h-5" /></div>}
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>

                                {showProfileMenu && (
                                    <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                        {isAdmin && (
                                            <button onClick={() => { navigate('/admin'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 flex items-center gap-2 font-bold text-zinc-800 border-b border-gray-100">
                                                <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin Panel
                                            </button>
                                        )}
                                        <button onClick={() => { navigate('/profile'); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"><User className="w-4 h-4" /> Ver Perfil</button>
                                        <div className="h-px bg-gray-100"></div>
                                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair</button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button onClick={() => setIsAuthModalOpen(true)} className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-black/10">Entrar</button>
                        )}
                    </div>
                </div>
            </nav>

            <main className="pt-24 px-6 max-w-7xl mx-auto flex-grow w-full">
                <Outlet />
            </main>

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </div>
    );
};
