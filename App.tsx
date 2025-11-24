
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { ViewState, Idea, FeedbackType, FeedbackStatus, ShowroomFilters as ShowroomFiltersType } from './types';
import IdeaCard from './components/IdeaCard';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import NewIdeaModal from './components/NewIdeaModal';
import IdeaDetailModal from './components/IdeaDetailModal';
import AuthModal from './components/AuthModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import LandingPage from './components/LandingPage';
import ProfileView from './components/ProfileView'; 
import { useIdeas, useUserInteractions, useNotifications } from './hooks/use-ideas-cache';
import { useVoteIdea, useToggleFavorite, useAddImprovement, useJoinInterest } from './hooks/use-mutations';
import { useFeedbackList, useUserFeedbackVotes } from './hooks/use-feedback';
import { usePrefetch } from './hooks/use-prefetch';
import { useQueryClient } from '@tanstack/react-query';
import { CACHE_KEYS } from './lib/cache-keys';
import { IdeasListSkeleton, ActionLoader } from './components/ui/LoadingStates';

// ROADMAP COMPONENTS
import { FeedbackCard } from './components/roadmap/FeedbackCard';
import { CreateFeedbackModal } from './components/roadmap/CreateFeedbackModal';
import { FeedbackDetailModal } from './components/roadmap/FeedbackDetailModal';
import { NPSModal } from './components/nps/NPSModal';

// SHOWROOM COMPONENTS
import { ShowroomFilters } from './components/showroom/ShowroomFilters';
import { ShowroomCard } from './components/showroom/ShowroomCard';
import { ShowroomListItem } from './components/showroom/ShowroomListItem';
import { EmptyState } from './components/showroom/EmptyState';

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
  Flame,
  AlertTriangle,
  Map,
  Filter,
  Rocket
} from 'lucide-react';

// --- CONFIGURAÇÃO DE DOMÍNIOS ---
const APP_DOMAIN = 'app.garagemdemicrosaas.com.br';
const MAIN_DOMAIN = 'garagemdemicrosaas.com.br';

const App: React.FC = () => {
  // Lógica de Domínio
  const hostname = window.location.hostname;
  // Considera "App Mode" se for o subdomínio 'app.' OU localhost (para desenvolvimento)
  const isAppMode = hostname.startsWith('app.') || hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  const [session, setSession] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Se estiver no modo App, inicia em IDEAS. Se for domínio principal, inicia em LANDING.
  const [viewState, setViewState] = useState<ViewState>({ type: isAppMode ? 'IDEAS' : 'LANDING' });
  
  const queryClient = useQueryClient();
  
  // -- IDEAS HOOKS --
  const { data: rawIdeas, isLoading: ideasLoading } = useIdeas({ userId: session?.user?.id });
  
  // -- SHOWROOM HOOKS --
  const [showroomSearch, setShowroomSearch] = useState('');
  const [showroomCategory, setShowroomCategory] = useState('Todos');
  const [showroomViewMode, setShowroomViewMode] = useState<'grid' | 'list'>('grid');
  const [showroomShowFavs, setShowroomShowFavs] = useState(false);
  const [showroomSort, setShowroomSort] = useState<'votes' | 'recent'>('votes');
  const [showroomMyProjects, setShowroomMyProjects] = useState(false);

  const { data: userInteractions } = useUserInteractions(session?.user?.id);
  const favoriteIds = useMemo(() => Array.from(userInteractions?.favorites || []), [userInteractions]);

  const { data: showroomProjects, isLoading: showroomLoading } = useIdeas({
      onlyShowroom: true,
      search: showroomSearch,
      category: showroomCategory,
      sortBy: showroomSort,
      showFavorites: showroomShowFavs,
      favoriteIds: favoriteIds,
      myProjects: showroomMyProjects,
      userId: session?.user?.id
  });

  const { data: notificationsData } = useNotifications(session?.user?.id);
  
  // Roadmap Hooks
  const [roadmapFilter, setRoadmapFilter] = useState<{type: FeedbackType | 'all', status: FeedbackStatus | 'all', sort: 'votes' | 'recent'}>({ type: 'all', status: 'all', sort: 'votes' });
  const { data: feedbacks, isLoading: feedbacksLoading } = useFeedbackList(roadmapFilter);
  const { data: userFeedbackVotes } = useUserFeedbackVotes(session?.user?.id);

  // Mutations
  const voteMutation = useVoteIdea();
  const favMutation = useToggleFavorite();
  const improvementMutation = useAddImprovement();
  const joinMutation = useJoinInterest();
  const { prefetchIdeaDetail } = usePrefetch();

  // MODAL STATES
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Idea | null>(null); // State for editing
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false); 
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // DELETE CONFIRMATION STATE
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  // FILTER & VIEW STATES (IDEAS TAB)
  const [selectedNiche, setSelectedNiche] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [ideasViewMode, setIdeasViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showMostVotedOnly, setShowMostVotedOnly] = useState(false); 
  const [showMyIdeasOnly, setShowMyIdeasOnly] = useState(false);

  useEffect(() => {
      // Se estiver no modo App, forçamos a verificação de auth para rotas protegidas
      if (isAppMode && !isAuthChecking) {
          const protectedTypes = ['IDEAS', 'SHOWROOM', 'PROJECT_DETAIL', 'PROFILE', 'ROADMAP'];
          if (!session && protectedTypes.includes(viewState.type)) {
              // No modo App, se não estiver logado, ainda mostramos IDEAS mas pedimos login ao interagir
              // ou podemos abrir o modal direto. Vamos manter em IDEAS.
              if (viewState.type !== 'IDEAS' && viewState.type !== 'SHOWROOM') {
                  setViewState({ type: 'IDEAS' });
              }
          }
      }
  }, [viewState.type, session, isAuthChecking, isAppMode]);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sharedIdeaId = params.get('idea');
      if (sharedIdeaId) {
          setSelectedIdeaId(sharedIdeaId);
          window.history.replaceState({}, '', window.location.pathname);
      }
  }, []);

  const ideas = useMemo(() => {
     if (!rawIdeas) return [];
     return rawIdeas.map(idea => ({
         ...idea,
         hasVoted: userInteractions?.votes.has(idea.id),
         isFavorite: userInteractions?.favorites.has(idea.id),
         isInterested: userInteractions?.interests.has(idea.id)
     }));
  }, [rawIdeas, userInteractions]);

  const hydratedShowroomProjects = useMemo(() => {
    if (!showroomProjects) return [];
    return showroomProjects.map(p => ({
        ...p,
        hasVoted: userInteractions?.votes.has(p.id),
        isFavorite: userInteractions?.favorites.has(p.id),
        isInterested: userInteractions?.interests.has(p.id)
    }));
  }, [showroomProjects, userInteractions]);

  const selectedIdea = useMemo(() => {
     const foundInIdeas = ideas.find(i => i.id === selectedIdeaId);
     if(foundInIdeas) return foundInIdeas;
     const foundInShowroom = hydratedShowroomProjects.find(i => i.id === selectedIdeaId);
     return foundInShowroom || null;
  }, [ideas, hydratedShowroomProjects, selectedIdeaId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
         // Se logado e no domínio principal, idealmente redirecionaria, 
         // mas vamos deixar o usuário navegar ou redirecionar manualmente.
         if (isAppMode && viewState.type === 'LANDING') {
             setViewState({ type: 'IDEAS' });
         }
         fetchUserAvatar(session.user.id);
      }
    }).finally(() => {
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          if (isAppMode && viewState.type === 'LANDING') setViewState({ type: 'IDEAS' });
          fetchUserAvatar(session.user.id);
      } else {
          // Se deslogar no App Mode, mantemos em IDEAS (público)
          if (!isAppMode) setViewState({ type: 'LANDING' });
          setUserAvatar(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isAppMode]);

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
      queryClient.clear();
      // Se deslogar, mantemos na tela atual ou redirecionamos para landing se não for app mode
      if (!isAppMode) setViewState({ type: 'LANDING' });
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

  const requireAuth = () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  // Redirecionamento para o App Domain
  const handleRedirectToApp = () => {
      window.location.href = `https://${APP_DOMAIN}`;
  };

  const handleUpvote = (id: string) => {
    if (!requireAuth()) return;
    voteMutation.mutate({ ideaId: id, userId: session.user.id });
  };

  const handleToggleFavorite = (id: string) => {
    if (!requireAuth()) return;
    const item = ideas.find(i => i.id === id) || hydratedShowroomProjects.find(i => i.id === id);
    if(item) {
        favMutation.mutate({ ideaId: id, userId: session.user.id, isFavorite: !!item.isFavorite });
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

  const handleSaveProject = async (projectData: any) => {
    if (!requireAuth()) return;
    
    // Check if updating or inserting
    if (projectData.id) {
        const { error } = await supabase.from('ideas').update({
            ...projectData,
            user_id: session.user.id
        }).eq('id', projectData.id);

        if (!error) {
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
            // Close details modal if open
            if(selectedIdeaId === projectData.id) {
                 queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(projectData.id) });
            }
        } else {
            alert(`Erro ao atualizar: ${error.message}`);
        }
    } else {
        const { error } = await supabase.from('ideas').insert({
            ...projectData,
            user_id: session.user.id,
            votes_count: 0,
            short_id: Math.random().toString(36).substring(2, 8).toUpperCase()
        });

        if (!error) {
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
            setViewState({ type: 'SHOWROOM' });
            setShowroomMyProjects(true);
        } else {
            alert(`Erro ao criar: ${error.message}`);
        }
    }
  };

  const handlePromoteIdea = (idea: Idea) => {
      setEditingProject(idea);
      setIsProjectModalOpen(true);
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

  // --- RENDERIZAÇÃO CONDICIONAL BASEADA NO DOMÍNIO ---

  // Se NÃO estiver no modo App (ou seja, estiver no domínio principal), mostramos a Landing Page
  if (!isAppMode && viewState.type === 'LANDING') {
    return (
      <>
        <LandingPage 
          onEnter={handleRedirectToApp} // Redireciona para o app.garagem...
          onLogin={handleRedirectToApp} // Redireciona para o app.garagem...
          isLoggedIn={!!session} 
        />
        {/* AuthModal aqui serve apenas se o usuário forçar, mas o ideal é redirecionar */}
        <AuthModal 
          isOpen={isAuthModalOpen} 
          onClose={() => setIsAuthModalOpen(false)} 
        />
      </>
    );
  }

  // Se estiver no Modo App, renderiza o sistema normal
  return (
    <div className="min-h-screen bg-apple-bg font-sans text-apple-text selection:bg-apple-blue selection:text-white pb-20 flex flex-col">
      
      {voteMutation.isPending && <ActionLoader message="Computando voto..." />}
      {joinMutation.isPending && <ActionLoader message="Registrando interesse..." />}
      
      {session && <NPSModal userId={session.user.id} />}

      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
             className="flex items-center gap-3 cursor-pointer group"
             onClick={() => setViewState({ type: 'IDEAS' })}
          >
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Layers className="text-white w-4 h-4" strokeWidth={2} />
            </div>
            <div className="flex flex-col justify-center">
                <span className="text-sm font-bold tracking-tight leading-none text-gray-900">
                    Garagem
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Alpha</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex bg-gray-100/50 p-1 rounded-full mr-4 border border-gray-200/50">
                <button 
                    onClick={() => setViewState({ type: 'IDEAS' })}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${viewState.type === 'IDEAS' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    <Lightbulb className="w-4 h-4" />
                    Ideias
                </button>
                <button 
                    onClick={() => setViewState({ type: 'SHOWROOM' })}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${viewState.type === 'SHOWROOM' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    <Rocket className="w-4 h-4" />
                    Showroom
                </button>
                <button 
                    onClick={() => setViewState({ type: 'ROADMAP' })}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${viewState.type === 'ROADMAP' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
                >
                    <Map className="w-4 h-4" /> Roadmap
                </button>
             </div>

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
      
      <main className="pt-24 px-6 max-w-7xl mx-auto flex-grow w-full">
        
        {viewState.type === 'PROFILE' && session && (
            <ProfileView session={session} onLogout={handleLogout} />
        )}

        {viewState.type === 'PROJECT_DETAIL' && (
            <ProjectDetail 
                project={{...hydratedShowroomProjects.find(p => p.id === viewState.projectId)!, name: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.title || '', description: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_description || '', tagline: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.niche || '', link_url: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_link || '', maker_id: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.creator_name || '', images: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_image ? [hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_image!] : [], reviews: [] } as any} 
                onBack={() => setViewState({ type: 'SHOWROOM' })}
                onAddReview={handleAddReview}
            />
        )}

        {viewState.type === 'ROADMAP' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                    <div>
                        <h1 className="text-3xl font-bold text-apple-text tracking-tight mb-2">Roadmap & Feedback</h1>
                        <p className="text-gray-500 text-lg font-light">Ajude a construir o futuro da plataforma.</p>
                    </div>
                    <button 
                        onClick={() => { if(requireAuth()) setIsFeedbackModalOpen(true); }}
                        className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Nova Sugestão
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <aside className="lg:col-span-1 space-y-8">
                         <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Filter className="w-3 h-3"/> Tipo</h3>
                            <div className="space-y-1">
                                {['all', 'bug', 'feature', 'improvement', 'other'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setRoadmapFilter(p => ({...p, type: t as any}))}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm capitalize transition-colors ${roadmapFilter.type === t ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {t === 'all' ? 'Todos' : t === 'feature' ? 'Features' : t === 'bug' ? 'Bugs' : t === 'improvement' ? 'Melhorias' : 'Outros'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Status</h3>
                            <div className="space-y-1">
                                {['all', 'pending', 'planned', 'in_progress', 'completed'].map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => setRoadmapFilter(p => ({...p, status: s as any}))}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm capitalize transition-colors ${roadmapFilter.status === s ? 'bg-white border border-gray-200 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {s === 'all' ? 'Todos' : s === 'in_progress' ? 'Em Progresso' : s === 'completed' ? 'Concluído' : s === 'pending' ? 'Pendente' : 'Planejado'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm text-gray-500"><strong>{feedbacks?.length || 0}</strong> sugestões encontradas</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setRoadmapFilter(p => ({...p, sort: 'votes'}))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roadmapFilter.sort === 'votes' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Mais Votados
                                </button>
                                <button 
                                    onClick={() => setRoadmapFilter(p => ({...p, sort: 'recent'}))}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roadmapFilter.sort === 'recent' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    Mais Recentes
                                </button>
                            </div>
                        </div>

                        {feedbacksLoading ? <IdeasListSkeleton /> : (
                            <div className="grid gap-4">
                                {feedbacks?.map(item => (
                                    <FeedbackCard 
                                        key={item.id} 
                                        feedback={item} 
                                        onClick={(id) => setSelectedFeedbackId(id)}
                                        hasVoted={userFeedbackVotes?.has(item.id) || false}
                                        onVote={(e) => { e.stopPropagation(); if(requireAuth()) voteMutation.mutate({ideaId: 'IGNORE', userId: session.user.id}); }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {viewState.type === 'IDEAS' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <aside className="lg:col-span-1 space-y-10">
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

                    <div className="lg:col-span-3">
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
                                            prefetchIdeaDetail(idea.id); 
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

        {viewState.type === 'SHOWROOM' && (
            <>
               <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                        <h1 className="text-3xl font-bold text-apple-text tracking-tight mb-1">Showroom de MVPs</h1>
                        <p className="text-gray-500 text-sm">Projetos reais construídos pela comunidade.</p>
                    </div>
                    <button 
                        onClick={() => {
                            if (requireAuth()) {
                                setEditingProject(null); // Clear editing state for new project
                                setIsProjectModalOpen(true);
                            }
                        }}
                        className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Publicar Projeto
                    </button>
                </div>

                <ShowroomFilters 
                    searchQuery={showroomSearch}
                    setSearchQuery={setShowroomSearch}
                    category={showroomCategory}
                    setCategory={setShowroomCategory}
                    viewMode={showroomViewMode}
                    setViewMode={setShowroomViewMode}
                    showFavorites={showroomShowFavs}
                    setShowFavorites={setShowroomShowFavs}
                    sortBy={showroomSort}
                    setSortBy={setShowroomSort}
                    myProjects={showroomMyProjects}
                    setMyProjects={setShowroomMyProjects}
                    requireAuth={requireAuth}
                />

                {showroomLoading ? (
                     <IdeasListSkeleton />
                ) : hydratedShowroomProjects.length === 0 ? (
                    <EmptyState 
                        onClearFilters={() => {
                            setShowroomSearch('');
                            setShowroomCategory('Todos');
                            setShowroomShowFavs(false);
                            setShowroomMyProjects(false);
                        }} 
                        onNewProject={() => { 
                            if (requireAuth()) {
                                setEditingProject(null);
                                setIsProjectModalOpen(true);
                            }
                        }}
                    />
                ) : (
                    <div className={`grid gap-6 ${showroomViewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                        {hydratedShowroomProjects.map(project => (
                             showroomViewMode === 'grid' ? (
                                <ShowroomCard 
                                    key={project.id} 
                                    project={project} 
                                    onClick={(p) => { 
                                        setSelectedIdeaId(p.id);
                                        prefetchIdeaDetail(p.id);
                                    }}
                                    onToggleFavorite={handleToggleFavorite}
                                    onVote={handleUpvote}
                                />
                             ) : (
                                <ShowroomListItem 
                                    key={project.id} 
                                    project={project}
                                    onClick={(p) => {
                                        setSelectedIdeaId(p.id);
                                        prefetchIdeaDetail(p.id);
                                    }}
                                    onToggleFavorite={handleToggleFavorite}
                                    onVote={handleUpvote}
                                />
                             )
                        ))}
                    </div>
                )}
            </>
        )}

      </main>

      <footer className="w-full bg-gray-50 border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center text-center gap-2">
            <div className="flex items-center gap-2 text-gray-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Sistema em Alpha (v0.1.0)</span>
            </div>
            <p className="text-[10px] text-gray-500 max-w-md leading-relaxed">
                A Garagem está em fase inicial de desenvolvimento. Funcionalidades podem mudar e bugs podem ocorrer. 
                Use com carinho e reporte problemas à comunidade.
            </p>
            <p className="text-[10px] text-gray-400 mt-2">© 2024 Garagem de Micro SaaS. Todos os direitos reservados.</p>
        </div>
      </footer>

      <NewIdeaModal 
        isOpen={isIdeaModalOpen} 
        onClose={() => setIsIdeaModalOpen(false)} 
        onSave={handleAddIdea}
      />
      
      <NewProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
            setIsProjectModalOpen(false);
            setEditingProject(null);
        }}
        onSave={handleSaveProject}
        initialData={editingProject}
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
        onPromoteIdea={handlePromoteIdea}
      />

      <CreateFeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        userId={session?.user?.id || ''}
      />

      <FeedbackDetailModal 
        feedbackId={selectedFeedbackId}
        onClose={() => setSelectedFeedbackId(null)}
        userId={session?.user?.id || ''}
        userHasVoted={selectedFeedbackId ? userFeedbackVotes?.has(selectedFeedbackId) || false : false}
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
