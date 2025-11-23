
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { ViewState, Idea, Project, Notification } from './types';
import { INITIAL_IDEAS, INITIAL_PROJECTS } from './constants';
import IdeaCard from './components/IdeaCard';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import NewIdeaModal from './components/NewIdeaModal';
import IdeaDetailModal from './components/IdeaDetailModal';
import AuthModal from './components/AuthModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import LandingPage from './components/LandingPage';
import ProfileView from './components/ProfileView'; 
import { useIdeas, useUserInteractions, useProjects, useNotifications } from './hooks/use-ideas-cache';
import { useVoteIdea, useToggleFavorite, useAddImprovement, useJoinInterest } from './hooks/use-mutations';
import { usePrefetch } from './hooks/use-prefetch';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from './lib/cache-keys';
import { IdeasListSkeleton, ActionLoader } from './components/ui/LoadingStates';

import { 
  Layers, 
  Plus, 
  LayoutGrid, 
  List as ListIcon, 
  ChevronDown,
  Lightbulb,
  LogOut,
  UserCircle,
  Search,
  Heart,
  User,
  Bell,
  Flame
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ type: 'LANDING' });
  const queryClient = useQueryClient();
  
  // React Query Hooks
  const { data: rawIdeas, isLoading: ideasLoading } = useIdeas();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: userInteractions } = useUserInteractions(session?.user?.id);
  const { data: notificationsData } = useNotifications(session?.user?.id);
  
  // Mutations
  const voteMutation = useVoteIdea();
  const favMutation = useToggleFavorite();
  const improvementMutation = useAddImprovement();
  const joinMutation = useJoinInterest();
  const { prefetchIdeaDetail } = usePrefetch();

  // MODAL STATES
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // DELETE CONFIRMATION STATE
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // FILTER & VIEW STATES
  const [selectedNiche, setSelectedNiche] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [ideasViewMode, setIdeasViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showMostVotedOnly, setShowMostVotedOnly] = useState(false); 
  const [showMyIdeasOnly, setShowMyIdeasOnly] = useState(false);

  // ================= MIDDLEWARE LOGIC (AUTH GUARD) =================
  // Se tentar acessar páginas protegidas sem sessão, joga pra Landing/Auth
  useEffect(() => {
      if (!isAuthChecking) {
          const protectedTypes = ['IDEAS', 'SHOWROOM', 'PROJECT_DETAIL', 'PROFILE'];
          if (!session && protectedTypes.includes(viewState.type)) {
              setViewState({ type: 'LANDING' });
              setIsAuthModalOpen(true);
          }
      }
  }, [viewState.type, session, isAuthChecking]);

  // ================= URL ROUTING LOGIC (SHARE LINKS) =================
  useEffect(() => {
      // Check for ?idea=ID in URL on mount
      const params = new URLSearchParams(window.location.search);
      const sharedIdeaId = params.get('idea');
      if (sharedIdeaId) {
          setSelectedIdeaId(sharedIdeaId);
          // Limpa URL
          window.history.replaceState({}, '', window.location.pathname);
      }
  }, []);


  // Merging Data with User Interactions locally for display
  const ideas = useMemo(() => {
     if (!rawIdeas) return [];
     if (!session) return rawIdeas;

     return rawIdeas.map(idea => ({
         ...idea,
         hasVoted: userInteractions?.votes.has(idea.id),
         isFavorite: userInteractions?.favorites.has(idea.id),
         isInterested: userInteractions?.interests.has(idea.id)
     }));
  }, [rawIdeas, userInteractions, session]);

  const selectedIdea = useMemo(() => {
     return ideas.find(i => i.id === selectedIdeaId) || null;
  }, [ideas, selectedIdeaId]);

  // ================= EFFECT: AUTH SETUP =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
         setViewState({ type: 'IDEAS' });
         fetchUserAvatar(session.user.id);
      }
    }).finally(() => {
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          setViewState(prev => prev.type === 'LANDING' ? { type: 'IDEAS' } : prev);
          fetchUserAvatar(session.user.id);
      } else {
          setViewState({ type: 'LANDING' });
          setUserAvatar(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setShowProfileMenu(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      queryClient.clear(); // Limpa cache ao sair
      setViewState({ type: 'LANDING' });
      setShowProfileMenu(false);
  };

  const fetchUserAvatar = async (userId: string) => {
      try {
          const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
          if (data?.avatar_url) setUserAvatar(data.avatar_url);
      } catch (error) { console.error(error); }
  };

  const markNotificationAsRead = async (id: string) => {
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.notifications.unread(session?.user?.id) });
  };

  const unreadCount = notificationsData?.filter(n => !n.read).length || 0;

  // ================= ACTIONS =================
  const requireAuth = () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleUpvote = (id: string) => {
    if (!requireAuth()) return;
    voteMutation.mutate({ ideaId: id, userId: session.user.id });
  };

  const handleToggleFavorite = (id: string) => {
    if (!requireAuth()) return;
    const idea = ideas.find(i => i.id === id);
    if(idea) {
        favMutation.mutate({ ideaId: id, userId: session.user.id, isFavorite: !!idea.isFavorite });
    }
  };

  const handleInterested = async (id: string) => {
    if (!requireAuth()) return;
    joinMutation.mutate({ ideaId: id, userId: session.user.id });
  };

  const handleAddImprovement = async (id: string, content: string, parentId?: string) => {
      if (!requireAuth()) return;
      await improvementMutation.mutateAsync({ ideaId: id, userId: session.user.id, content, parentId });
  };

  const handleAddIdea = async (ideaData: any) => {
    if (!requireAuth()) return;
    const paymentType = ideaData.monetization_type === 'PAID' ? 'paid' : 
                        ideaData.monetization_type === 'DONATION' ? 'donation' : 'free';

    const { error } = await supabase.from('ideas').insert({
      ...ideaData,
      payment_type: paymentType,
      user_id: session.user.id,
      votes_count: 0,
      is_building: false,
      // Gerar short_id simples
      short_id: Math.random().toString(36).substring(2, 8).toUpperCase()
    }); 

    if (!error) {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
      setShowMyIdeasOnly(true);
    } else {
        alert(`Erro: ${error.message}`);
    }
  };

  const handleRequestPdr = async (ideaId: string, ownerId: string, ideaTitle: string, message: string) => {
      if (!requireAuth()) return;
      await supabase.from('notifications').insert({
          recipient_id: ownerId,
          sender_id: session.user.id,
          sender_email: session.user.email,
          type: 'PDR_REQUEST',
          payload: { idea_id: ideaId, idea_title: ideaTitle, message: message }
      });
  };

  const handleAddProject = async (newProjectData: any) => {
    if (!requireAuth()) return;
    const { error } = await supabase.from('projects').insert({
      ...newProjectData,
      user_id: session.user.id,
      images: newProjectData.images 
    });

    if (!error) {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.projects.list() });
        setViewState({ type: 'SHOWROOM' });
    } else {
        alert(`Erro: ${error.message}`);
    }
  };

  const handleAddReview = async (projectId: string, reviewData: any) => {
    if (!requireAuth()) return;
    const { error } = await supabase.from('reviews').insert({
        project_id: projectId,
        ...reviewData,
        user_id: session.user.id
    });
    if (!error) {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.projects.list() });
    }
  };

  const niches = useMemo(() => {
    if (!rawIdeas) return ['Todos'];
    const allNiches = rawIdeas.map(i => i.niche);
    return ['Todos', ...Array.from(new Set(allNiches))];
  }, [rawIdeas]);

  const filteredIdeas = useMemo(() => {
    let result = [...ideas];
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(idea => 
            idea.title.toLowerCase().includes(q) || 
            idea.pain.toLowerCase().includes(q) ||
            idea.solution.toLowerCase().includes(q)
        );
    }
    if (showFavoritesOnly) {
        result = result.filter(idea => idea.isFavorite);
    }
    if (showMostVotedOnly) {
        result.sort((a, b) => b.votes_count - a.votes_count);
    } else if (sortBy === 'votes') {
        result.sort((a, b) => b.votes_count - a.votes_count);
    } else {
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    if (showMyIdeasOnly && session?.user) {
        result = result.filter(idea => idea.user_id === session.user.id);
    }
    if (selectedNiche !== 'Todos') {
      result = result.filter(idea => idea.niche === selectedNiche);
    }
    
    return result;
  }, [ideas, selectedNiche, sortBy, searchQuery, showFavoritesOnly, showMyIdeasOnly, showMostVotedOnly, session]);

  const promptDeleteIdea = (id: string) => {
      if (!requireAuth()) return;
      setIdeaToDelete(id);
  };

  const confirmDeleteIdea = async () => {
      const id = ideaToDelete;
      if (!id || !session) return;
      setIdeaToDelete(null); 
      try {
          const { error } = await supabase.from('ideas').delete().eq('id', id);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
          if (selectedIdeaId === id) setSelectedIdeaId(null);
      } catch (error: any) {
          alert(`Falha ao excluir: ${error.message}`);
      }
  };

  // --- RENDER RETURN ---
  if (viewState.type === 'LANDING') {
    return (
      <>
        <LandingPage 
          onEnter={() => {
              if(session) setViewState({ type: 'IDEAS' });
              else setIsAuthModalOpen(true);
          }} 
          onLogin={() => setIsAuthModalOpen(true)} 
          isLoggedIn={!!session} 
        />
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg font-sans text-apple-text selection:bg-apple-blue selection:text-white pb-20">
      
      {/* Global Loader for actions */}
      {voteMutation.isPending && <ActionLoader message="Computando voto..." />}
      {joinMutation.isPending && <ActionLoader message="Registrando interesse..." />}
      
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
             className="flex items-center gap-3 cursor-pointer group"
             onClick={() => setViewState({ type: 'IDEAS' })}
          >
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Layers className="text-white w-5 h-5" strokeWidth={2} />
            </div>
            <span className="text-lg font-bold tracking-tight hidden md:inline">Garagem <span className="text-gray-400 font-normal text-xs uppercase tracking-widest ml-1">de Micro SaaS</span></span>
          </div>

          <div className="flex items-center gap-4">
             {/* Navigation Tabs (Desktop) */}
             <div className="hidden md:flex bg-gray-100/50 p-1 rounded-full mr-4 border border-gray-200/50">
                <button 
                    onClick={() => setViewState({ type: 'IDEAS' })}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewState.type === 'IDEAS' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    Ideias
                </button>
                <button 
                    onClick={() => setViewState({ type: 'SHOWROOM' })}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${viewState.type === 'SHOWROOM' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    Showroom
                </button>
             </div>

             {/* Notifications */}
             <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-gray-400 hover:text-black transition-colors relative"
                 >
                     <Bell className="w-5 h-5" />
                     {unreadCount > 0 && (
                         <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                     )}
                 </button>
                 
                 {showNotifications && (
                     <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                         <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                             <span className="text-xs font-bold text-gray-500 uppercase">Notificações</span>
                             {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
                         </div>
                         <div className="max-h-80 overflow-y-auto custom-scrollbar">
                             {!notificationsData || notificationsData.length === 0 ? (
                                 <div className="p-8 text-center text-gray-400 text-sm">Nenhuma notificação.</div>
                             ) : (
                                 notificationsData.map(notif => (
                                     <div 
                                        key={notif.id} 
                                        onClick={() => markNotificationAsRead(notif.id)}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                     >
                                         <div className="flex items-start gap-3">
                                             <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                             <div>
                                                 <p className="text-xs text-gray-400 mb-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                                                 <p className="text-sm text-gray-700">
                                                     {notif.type === 'NEW_VOTE' && `Novo voto na sua ideia.`}
                                                     {notif.type === 'NEW_INTEREST' && `Novo interessado no seu projeto!`}
                                                     {notif.type === 'NEW_DONATION' && `💰 Você recebeu uma doação!`}
                                                     {notif.type === 'PIX_REQUEST' && notif.payload?.message}
                                                     {notif.type === 'SYSTEM' && notif.payload?.message}
                                                     {/* Fallback for other types */}
                                                     {!['NEW_VOTE', 'NEW_INTEREST', 'NEW_DONATION', 'SYSTEM', 'PIX_REQUEST'].includes(notif.type) && 'Nova interação.'}
                                                 </p>
                                                 {notif.type === 'PIX_REQUEST' && (
                                                     <button onClick={() => setViewState({type: 'PROFILE'})} className="mt-2 text-xs bg-black text-white px-3 py-1 rounded-md">Configurar Pix</button>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                 ))
                             )}
                         </div>
                     </div>
                 )}
             </div>

             {/* Auth/Profile Dropdown */}
             {session ? (
                 <div className="relative" ref={profileMenuRef}>
                     <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="flex items-center gap-3 pl-3 border-l border-gray-200 group"
                     >
                         <div className="hidden sm:block text-right">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Logado como</p>
                            <p className="text-sm font-bold text-apple-text group-hover:text-apple-blue transition-colors">
                                {session.user.user_metadata?.full_name?.split(' ')[0] || 'Usuário'}
                            </p>
                         </div>
                         <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm group-hover:border-apple-blue transition-all">
                             {userAvatar ? (
                                 <img src={userAvatar} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-gray-400">
                                     <User className="w-5 h-5" />
                                 </div>
                             )}
                         </div>
                         <ChevronDown className="w-4 h-4 text-gray-400" />
                     </button>

                     {showProfileMenu && (
                         <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                             <button 
                                onClick={() => { setViewState({ type: 'PROFILE' }); setShowProfileMenu(false); }}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"
                             >
                                <User className="w-4 h-4" /> Ver Perfil
                             </button>
                             <div className="h-px bg-gray-100"></div>
                             <button 
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                             >
                                <LogOut className="w-4 h-4" /> Sair
                             </button>
                         </div>
                     )}
                 </div>
             ) : (
                 <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-black/10"
                 >
                    Entrar
                 </button>
             )}
          </div>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <main className="pt-24 px-6 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
        
        {/* --- VIEW: PROFILE --- */}
        {viewState.type === 'PROFILE' && session && (
            <ProfileView session={session} onLogout={handleLogout} />
        )}

        {/* --- VIEW: PROJECT DETAIL --- */}
        {viewState.type === 'PROJECT_DETAIL' && (
            <ProjectDetail 
                project={projectsData?.find(p => p.id === viewState.projectId)!} 
                onBack={() => setViewState({ type: 'SHOWROOM' })}
                onAddReview={handleAddReview}
            />
        )}

        {/* --- VIEW: IDEAS --- */}
        {viewState.type === 'IDEAS' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                    <div>
                        <h1 className="text-4xl font-bold text-apple-text tracking-tight mb-2">Explorar Ideias</h1>
                        <p className="text-gray-500 text-lg font-light">Descubra oportunidades validadas pela comunidade.</p>
                    </div>
                    <button 
                        onClick={() => {
                            if (requireAuth()) setIsIdeaModalOpen(true);
                        }}
                        className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Lightbulb className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Nova Ideia
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    
                    {/* SIDEBAR FILTERS (Column 1) */}
                    <aside className="lg:col-span-1 space-y-10">
                        {/* Search */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pesquisar</h3>
                            <div className="relative group">
                                <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-apple-blue transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Palavras-chave..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-apple-blue/10 focus:border-apple-blue outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Filters */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filtros</h3>
                            <div className="space-y-2">
                                <button 
                                    onClick={() => { setShowMostVotedOnly(!showMostVotedOnly); setShowFavoritesOnly(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${showMostVotedOnly ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <Flame className={`w-4 h-4 ${showMostVotedOnly ? 'fill-orange-600' : ''}`} /> 
                                    Mais Votados
                                </button>

                                <button 
                                    onClick={() => { if(requireAuth()) { setShowFavoritesOnly(!showFavoritesOnly); setShowMostVotedOnly(false); } }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${showFavoritesOnly ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-600 hover:bg-gray-100'}`}
                                >
                                    <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} /> 
                                    Meus Favoritos
                                </button>
                            </div>
                        </div>

                        {/* My Projects */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Meus Projetos</h3>
                            <button 
                                onClick={() => { if(requireAuth()) setShowMyIdeasOnly(!showMyIdeasOnly); }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${showMyIdeasOnly ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <UserCircle className="w-4 h-4" /> 
                                Minhas Publicações
                            </button>
                        </div>

                        {/* Categories */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Categorias</h3>
                            <div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {niches.map(n => (
                                    <button 
                                        key={n} 
                                        onClick={() => setSelectedNiche(n)} 
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${selectedNiche === n ? 'bg-white font-bold text-black shadow-sm border border-gray-100' : 'text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900'}`}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* MAIN GRID (Column 2-4) */}
                    <div className="lg:col-span-3">
                        
                        {/* Controls Bar */}
                        <div className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm flex flex-wrap items-center justify-between mb-8 sticky top-20 z-30">
                            <span className="text-sm text-gray-500 font-medium ml-4 hidden sm:inline-block">Mostrando <strong className="text-black">{filteredIdeas.length}</strong> resultados</span>
                            
                            <div className="flex items-center gap-2 ml-auto">
                                <button 
                                     onClick={() => setSortBy(prev => prev === 'newest' ? 'votes' : 'newest')}
                                     className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-xl text-sm font-bold text-gray-600 transition-colors"
                                >
                                     {sortBy === 'newest' ? 'Mais Recentes' : 'Mais Votados'}
                                     <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                                
                                <div className="h-6 w-px bg-gray-200 mx-2"></div>

                                <div className="flex bg-gray-100/80 p-1 rounded-xl">
                                    <button onClick={() => setIdeasViewMode('grid')} className={`p-2 rounded-lg transition-all ${ideasViewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <LayoutGrid className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setIdeasViewMode('list')} className={`p-2 rounded-lg transition-all ${ideasViewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                                        <ListIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Grid */}
                        {ideasLoading ? (
                            <IdeasListSkeleton />
                        ) : (
                            <div className={`grid gap-6 ${ideasViewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {filteredIdeas.map((idea) => (
                                    <IdeaCard 
                                        key={idea.id} 
                                        idea={idea} 
                                        onUpvote={handleUpvote}
                                        onToggleFavorite={handleToggleFavorite}
                                        onDelete={promptDeleteIdea}
                                        viewMode={ideasViewMode}
                                        onClick={(idea) => {
                                            setSelectedIdeaId(idea.id);
                                            prefetchIdeaDetail(idea.id); // Prefetch on click/select
                                        }}
                                        currentUserId={session?.user?.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- VIEW: SHOWROOM --- */}
        {viewState.type === 'SHOWROOM' && (
            <>
               <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h1 className="text-3xl font-bold text-apple-text tracking-tight mb-1">Showroom de MVPs</h1>
                        <p className="text-gray-500 text-sm">Projetos reais construídos pela comunidade.</p>
                    </div>
                    <button 
                        onClick={() => {
                            if (requireAuth()) setIsProjectModalOpen(true);
                        }}
                        className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Publicar Projeto
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {projectsLoading ? (
                         <IdeasListSkeleton />
                    ) : (
                        projectsData?.map(project => (
                            <ProjectCard 
                                key={project.id} 
                                project={project} 
                                onClick={(id) => setViewState({ type: 'PROJECT_DETAIL', projectId: id })}
                            />
                        ))
                    )}
                </div>
            </>
        )}

      </main>

      {/* --- MODALS --- */}
      <NewIdeaModal 
        isOpen={isIdeaModalOpen} 
        onClose={() => setIsIdeaModalOpen(false)} 
        onSave={handleAddIdea}
      />
      
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSave={handleAddProject}
      />

      <IdeaDetailModal
        idea={selectedIdea}
        currentUserId={session?.user?.id}
        currentUserData={{ 
            name: session?.user?.user_metadata?.full_name || 'Usuário',
            avatar: userAvatar || undefined
        }}
        onClose={() => setSelectedIdeaId(null)}
        onUpvote={handleUpvote}
        onToggleFavorite={handleToggleFavorite}
        onRequestPdr={handleRequestPdr}
        onJoinTeam={handleInterested}
        onAddImprovement={handleAddImprovement}
        refreshData={() => queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(selectedIdeaId!) })}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />

      <DeleteConfirmationModal
          isOpen={!!ideaToDelete}
          onClose={() => setIdeaToDelete(null)}
          onConfirm={confirmDeleteIdea}
      />

    </div>
  );
};

export default App;
