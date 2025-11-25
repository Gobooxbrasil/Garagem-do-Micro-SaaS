




import React, { useState, useMemo, useEffect, useRef } from 'react';
import { supabase } from './lib/supabaseClient';
import { ViewState, Idea, FeedbackType, FeedbackStatus, ShowroomFilters as ShowroomFiltersType, Feedback, Notification } from './types';
import IdeaCard from './components/IdeaCard';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import NewIdeaModal from './components/NewIdeaModal';
import IdeaDetailModal from './components/IdeaDetailModal';
import AuthModal from './components/AuthModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import LandingPage from './components/LandingPage';
import ProfileView from './components/ProfileView'; 
import AdminLayout from './components/admin/AdminLayout'; 
import AdminLogin from './components/admin/AdminLogin'; // New Import
import { useIdeas, useUserInteractions, useNotifications, useIdeaDetail } from './hooks/use-ideas-cache';
import { useVoteIdea, useToggleFavorite, useAddImprovement, useJoinInterest } from './hooks/use-mutations';
import { useFeedbackList, useUserFeedbackVotes, useVoteFeedback } from './hooks/use-feedback';
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
  Rocket, 
  ShieldCheck, 
  Check, 
  Trash2, 
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';

const APP_DOMAIN = 'app.garagemdemicrosaas.com.br';
const MAIN_DOMAIN = 'garagemdemicrosaas.com.br';

const App: React.FC = () => {
  const hostname = window.location.hostname;
  const isLandingDomain = hostname === MAIN_DOMAIN || hostname === `www.${MAIN_DOMAIN}`;
  const isAdminDomain = hostname.startsWith('admin.');
  const isAppMode = !isLandingDomain;
  
  // URL Admin absoluta conforme solicitado para evitar erros de rota relativa
  const adminUrl = 'https://admin.garagemdemicrosaas.com.br';

  const [session, setSession] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Global Announcement State
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string | null>(null);

  // Initialize ViewState based on Domain or Path
  const [viewState, setViewState] = useState<ViewState>(() => {
    if (isAdminDomain || window.location.pathname.startsWith('/admin')) {
        // We don't know if they are logged in yet, so default to login check logic later
        // But initially, assume login screen if pure admin access
        return { type: 'ADMIN_LOGIN' };
    }
    // Se estiver no modo app, iniciamos em IDEAS, mas o useEffect de auth vai corrigir para LANDING se não tiver sessão
    return { type: isAppMode ? 'IDEAS' : 'LANDING' };
  });
  
  const queryClient = useQueryClient();
  const { data: rawIdeas, isLoading: ideasLoading } = useIdeas({ userId: session?.user?.id });
  
  // -- IDEAS STATE --
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('Todos');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showMostVotedOnly, setShowMostVotedOnly] = useState(false);
  const [showMyIdeasOnly, setShowMyIdeasOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'votes' | 'newest'>('newest');
  const [ideasViewMode, setIdeasViewMode] = useState<'grid' | 'list'>('grid');

  // -- PAGINATION STATE --
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // -- SHOWROOM HOOKS --
  const [showroomSearch, setShowroomSearch] = useState('');
  const [showroomCategory, setShowroomCategory] = useState('Todos');
  const [showroomViewMode, setShowroomViewMode] = useState<'grid' | 'list'>('grid');
  const [showroomShowFavs, setShowroomShowFavs] = useState(false);
  const [showroomSort, setShowroomSort] = useState<'votes' | 'recent'>('votes');
  const [showroomMyProjects, setShowroomMyProjects] = useState(false);

  const { data: userInteractions } = useUserInteractions(session?.user?.id);
  const favoriteIds = useMemo(() => Array.from(userInteractions?.favorites || []) as string[], [userInteractions]);

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
  const [roadmapFilter, setRoadmapFilter] = useState<{type: FeedbackType | 'all', status: FeedbackStatus | 'all', sort: 'votes' | 'recent'}>({ type: 'all', status: 'all', sort: 'votes' });
  const { data: feedbacks, isLoading: feedbacksLoading } = useFeedbackList(roadmapFilter);
  const { data: userFeedbackVotes } = useUserFeedbackVotes(session?.user?.id);

  const voteMutation = useVoteIdea();
  const feedbackVoteMutation = useVoteFeedback();
  const favMutation = useToggleFavorite();
  const improvementMutation = useAddImprovement();
  const joinMutation = useJoinInterest();
  const { prefetchIdeaDetail } = usePrefetch();

  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Idea | null>(null); 
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false); 
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const { data: fullIdeaData } = useIdeaDetail(selectedIdeaId || '');

  // CHECK FOR ADMIN PERMISSIONS
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  useEffect(() => {
      const checkAdmin = async () => {
          if (session?.user) {
              const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
              setCanAccessAdmin(!!data?.is_admin);
              
              // Logic to direct flow when on admin domain
              if (isAdminDomain) {
                  if (data?.is_admin) {
                      setViewState({ type: 'ADMIN', subview: 'DASHBOARD' });
                  } else {
                      setViewState({ type: 'ADMIN_LOGIN' });
                  }
              }
          } else {
              setCanAccessAdmin(false);
              if (isAdminDomain) {
                  setViewState({ type: 'ADMIN_LOGIN' });
              }
          }
      };
      
      if (!isAuthChecking) {
          checkAdmin();
      }
  }, [session, isAdminDomain, isAuthChecking]);

  // FETCH GLOBAL ANNOUNCEMENT
  useEffect(() => {
      const fetchAnnouncement = async () => {
          const { data } = await supabase.from('platform_settings').select('global_announcement').single();
          if (data?.global_announcement) {
              setGlobalAnnouncement(data.global_announcement);
          } else {
              setGlobalAnnouncement(null);
          }
      };
      fetchAnnouncement();
      // Simple polling for announcement updates (every 2 mins)
      const interval = setInterval(fetchAnnouncement, 120000);
      return () => clearInterval(interval);
  }, []);


  useEffect(() => {
      if (!isAuthChecking) {
          const protectedTypes = ['IDEAS', 'SHOWROOM', 'PROJECT_DETAIL', 'PROFILE', 'ROADMAP', 'ADMIN'];
          if (!session && protectedTypes.includes(viewState.type) && viewState.type !== 'ADMIN_LOGIN') {
              if (!isAdminDomain) {
                 setViewState({ type: 'LANDING' });
              } else {
                 setViewState({ type: 'ADMIN_LOGIN' });
              }
          }
      }
  }, [viewState.type, session, isAuthChecking, isAdminDomain]);

  useEffect(() => {
    const checkSecurityStatus = async () => {
        if (session?.user) {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('is_blocked, blocked_reason')
                .eq('id', session.user.id)
                .single();

            if ((error && error.code === 'PGRST116') || profile?.is_blocked) {
                await supabase.auth.signOut();
                setSession(null);
                setUserAvatar(null);
                
                if (profile?.is_blocked) {
                    alert(`ACESSO NEGADO\n\nSua conta foi suspensa.\nMotivo: ${profile.blocked_reason || 'Violação dos termos de uso.'}`);
                } else {
                    alert('Sua conta foi removida do sistema.');
                }
                
                if (!isAdminDomain) setViewState({ type: 'LANDING' });
                if (isAdminDomain) setViewState({ type: 'ADMIN_LOGIN' });
            }
        }
    };

    if (session) {
        checkSecurityStatus();
        const interval = setInterval(checkSecurityStatus, 15000);
        return () => clearInterval(interval);
    }
  }, [session, viewState.type, isAdminDomain]);

  useEffect(() => {
      if (session && !isAuthChecking && viewState.type === 'LANDING' && !isAdminDomain) {
          setViewState({ type: 'IDEAS' });
      }
  }, [session, isAuthChecking, viewState.type, isAdminDomain]);

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sharedIdeaId = params.get('idea');
      if (sharedIdeaId) {
          setSelectedIdeaId(sharedIdeaId);
          window.history.replaceState({}, '', window.location.pathname);
      }
  }, []);

  const ideas = useMemo<Idea[]>(() => {
     if (!rawIdeas) return [];
     return rawIdeas.map(idea => ({
         ...idea,
         hasVoted: userInteractions?.votes?.has(idea.id) || false,
         isFavorite: userInteractions?.favorites?.has(idea.id) || false,
         isInterested: userInteractions?.interests?.has(idea.id) || false
     }));
  }, [rawIdeas, userInteractions]);

  const hydratedShowroomProjects = useMemo<Idea[]>(() => {
    if (!showroomProjects) return [];
    return showroomProjects.map(p => ({
        ...p,
        hasVoted: userInteractions?.votes?.has(p.id) || false,
        isFavorite: userInteractions?.favorites?.has(p.id) || false,
        isInterested: userInteractions?.interests?.has(p.id) || false
    }));
  }, [showroomProjects, userInteractions]);

  const selectedIdeaListVersion = useMemo(() => {
     const foundInIdeas = ideas.find(i => i.id === selectedIdeaId);
     if(foundInIdeas) return foundInIdeas;
     const foundInShowroom = hydratedShowroomProjects.find(i => i.id === selectedIdeaId);
     return foundInShowroom || null;
  }, [ideas, hydratedShowroomProjects, selectedIdeaId]);

  const activeIdea = fullIdeaData || selectedIdeaListVersion;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
         fetchUserAvatar(session.user.id);
      }
    }).finally(() => {
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          fetchUserAvatar(session.user.id);
      } else {
          if (!isAdminDomain) setViewState({ type: 'LANDING' });
          if (isAdminDomain) setViewState({ type: 'ADMIN_LOGIN' });
          setUserAvatar(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [isAdminDomain]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
              setShowProfileMenu(false);
          }
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset Pagination on Filter Change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedNiche, showFavoritesOnly, showMyIdeasOnly, showMostVotedOnly, sortBy]);

  const handleLogout = async () => {
      await supabase.auth.signOut();
      queryClient.clear();
      if (!isAdminDomain) setViewState({ type: 'LANDING' });
      if (isAdminDomain) setViewState({ type: 'ADMIN_LOGIN' });
      setShowProfileMenu(false);
  };

  const fetchUserAvatar = async (userId: string) => {
      try {
          const { data } = await supabase.from('profiles').select('avatar_url').eq('id', userId).single();
          if (data?.avatar_url) setUserAvatar(data.avatar_url);
      } catch (error) { console.error(error); }
  };

  const markNotificationAsRead = async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      await supabase.from('notifications').update({ read: true }).eq('id', id);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.notifications.unread(session?.user?.id) });
  };

  const deleteNotification = async (id: string, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      await supabase.from('notifications').delete().eq('id', id);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.notifications.unread(session?.user?.id) });
  };

  const handleNotificationClick = async (notification: Notification) => {
      if (!notification.read) {
          await markNotificationAsRead(notification.id);
      }
      
      // Handle External Links
      if (notification.payload?.link) {
          window.open(notification.payload.link, notification.payload.link.startsWith('http') ? '_blank' : '_self');
          setShowNotifications(false);
          return;
      }

      // Handle Internal Ideas
      if (notification.payload?.idea_id) {
          setSelectedIdeaId(notification.payload.idea_id);
          prefetchIdeaDetail(notification.payload.idea_id);
          setTimeout(() => {
              setShowNotifications(false);
          }, 500);
      }
  };

  const unreadCount = notificationsData?.filter(n => !n.read).length || 0;

  const requireAuth = () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleLandingAction = () => {
      if (session) {
          setViewState({ type: 'IDEAS' });
          return;
      }
      if (isAppMode) {
          setIsAuthModalOpen(true);
      } else {
          window.location.href = `https://${APP_DOMAIN}`;
      }
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
        throw error; // Throw so modal knows it failed
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
    if (projectData.id) {
        const { error } = await supabase.from('ideas').update({
            ...projectData,
            user_id: session.user.id
        }).eq('id', projectData.id);
        if (!error) {
            queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.all });
            if(selectedIdeaId === projectData.id) {
                 queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(projectData.id) });
            }
        } else {
            alert(`Erro ao atualizar: ${error.message}`);
            throw error;
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
            throw error;
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

  const niches = useMemo<string[]>(() => {
    if (!rawIdeas) return ['Todos'];
    const allNiches = rawIdeas.map(i => i.niche);
    return ['Todos', ...Array.from(new Set(allNiches)) as string[]];
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

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredIdeas.length / itemsPerPage);
  const paginatedIdeas = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredIdeas.slice(start, start + itemsPerPage);
  }, [filteredIdeas, currentPage, itemsPerPage]);

  const getPageNumbers = () => {
      const delta = 1;
      const range = [];
      for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
          range.push(i);
      }
      if (currentPage - delta > 2) range.unshift('...');
      if (currentPage + delta < totalPages - 1) range.push('...');
      range.unshift(1);
      if (totalPages > 1) range.push(totalPages);
      return range;
  };

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

  if (viewState.type === 'ADMIN_LOGIN') {
      return <AdminLogin onSuccess={() => setViewState({ type: 'ADMIN', subview: 'DASHBOARD' })} />;
  }

  if (viewState.type === 'ADMIN') {
      return (
          <AdminLayout 
             currentView={viewState.subview} 
             onNavigate={(subview) => setViewState({ type: 'ADMIN', subview })}
             onExit={() => {
                if (isAdminDomain) {
                    setViewState({ type: 'ADMIN_LOGIN' });
                } else {
                    setViewState({ type: 'IDEAS' });
                }
             }}
             session={session}
          />
      );
  }

  if (viewState.type === 'LANDING' && !isAdminDomain) {
    return (
      <>
        <LandingPage 
          onEnter={handleLandingAction}
          onLogin={() => setIsAuthModalOpen(true)}
          isLoggedIn={!!session} 
        />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-apple-bg font-sans text-apple-text selection:bg-apple-blue selection:text-white pb-20 flex flex-col">
      
      {voteMutation.isPending && <ActionLoader message="Computando voto..." />}
      {joinMutation.isPending && <ActionLoader message="Registrando interesse..." />}
      
      {session && <NPSModal userId={session.user.id} />}

      <nav className="fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        
        {/* Global Announcement Banner */}
        {globalAnnouncement && (
            <div className="bg-indigo-600 text-white text-xs font-bold text-center py-2 px-4 relative z-50 flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                <Info className="w-3.5 h-3.5" />
                {globalAnnouncement}
            </div>
        )}

        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setViewState({ type: 'IDEAS' })}>
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
                <button onClick={() => setViewState({ type: 'IDEAS' })} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${viewState.type === 'IDEAS' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><Lightbulb className="w-4 h-4" />Ideias</button>
                <button onClick={() => setViewState({ type: 'SHOWROOM' })} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${viewState.type === 'SHOWROOM' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><Rocket className="w-4 h-4" />Showroom</button>
                <button onClick={() => setViewState({ type: 'ROADMAP' })} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${viewState.type === 'ROADMAP' ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}><Map className="w-4 h-4" /> Roadmap</button>
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
                                 <div 
                                    key={notif.id} 
                                    onClick={() => handleNotificationClick(notif)} 
                                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 items-start group ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                 >
                                     <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                     <div className="flex-grow min-w-0">
                                         <p className="text-xs text-gray-400 mb-1 flex justify-between">
                                            {new Date(notif.created_at).toLocaleDateString()}
                                         </p>
                                         <p className="text-sm text-gray-700 line-clamp-2">
                                            {notif.type === 'NEW_VOTE' && `Novo voto na sua ideia.`}
                                            {notif.type === 'NEW_INTEREST' && `Novo interessado no seu projeto!`}
                                            {notif.type === 'NEW_DONATION' && `💰 Você recebeu uma doação!`}
                                            {notif.type === 'PIX_REQUEST' && notif.payload?.message}
                                            {notif.type === 'NEW_IMPROVEMENT' && (
                                                <span className="flex flex-col gap-1">
                                                    <span className="font-bold flex items-center gap-1"><MessageCircle className="w-3 h-3 text-indigo-500"/> Comentário em "{notif.payload?.idea_title}"</span>
                                                    <span className="italic text-gray-500">"{notif.payload?.message}"</span>
                                                </span>
                                            )}
                                            {notif.type === 'SYSTEM' && notif.payload?.message}
                                            {!['NEW_VOTE', 'NEW_INTEREST', 'NEW_DONATION', 'SYSTEM', 'PIX_REQUEST', 'NEW_IMPROVEMENT'].includes(notif.type) && 'Nova interação.'}
                                         </p>
                                         {notif.type === 'PIX_REQUEST' && <span className="mt-2 text-xs bg-black text-white px-3 py-1 rounded-md inline-block">Configurar Pix</span>}
                                         {notif.payload?.link && <span className="mt-2 text-[10px] text-blue-600 font-bold flex items-center gap-1"><Rocket className="w-3 h-3"/> Ver Link</span>}
                                     </div>
                                     <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                         {!notif.read && (
                                             <button onClick={(e) => markNotificationAsRead(notif.id, e)} className="p-1 hover:bg-green-100 text-green-600 rounded" title="Marcar como lida">
                                                 <Check className="w-3 h-3" />
                                             </button>
                                         )}
                                         <button onClick={(e) => deleteNotification(notif.id, e)} className="p-1 hover:bg-red-100 text-red-600 rounded" title="Excluir">
                                             <Trash2 className="w-3 h-3" />
                                         </button>
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
                             {canAccessAdmin && (
                                 <button onClick={() => { setViewState({ type: 'ADMIN', subview: 'DASHBOARD' }); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-zinc-50 flex items-center gap-2 font-bold text-zinc-800 border-b border-gray-100">
                                    <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin Panel
                                 </button>
                             )}
                             <button onClick={() => { setViewState({ type: 'PROFILE' }); setShowProfileMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2"><User className="w-4 h-4" /> Ver Perfil</button>
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
        {viewState.type === 'PROFILE' && session && <ProfileView session={session} onLogout={handleLogout} />}
        {viewState.type === 'PROJECT_DETAIL' && <ProjectDetail project={{...hydratedShowroomProjects.find(p => p.id === viewState.projectId)!, name: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.title || '', description: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_description || '', tagline: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.niche || '', link_url: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_link || '', maker_id: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.creator_name || '', images: hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_image ? [hydratedShowroomProjects.find(p => p.id === viewState.projectId)?.showroom_image!] : [], reviews: [] } as any} onBack={() => setViewState({ type: 'SHOWROOM' })} onAddReview={handleAddReview} />}
        {viewState.type === 'ROADMAP' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                    <div><h1 className="text-3xl font-bold text-apple-text tracking-tight mb-2">Roadmap & Feedback</h1><p className="text-gray-500 text-lg font-light">Ajude a construir o futuro da plataforma.</p></div>
                    <button onClick={() => { if(requireAuth()) setIsFeedbackModalOpen(true); }} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 flex items-center gap-2"><Plus className="w-5 h-5" /> Nova Sugestão</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <aside className="lg:col-span-1 space-y-8">
                         <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Filter className="w-3 h-3"/> Tipo</h3><div className="space-y-1">{['all', 'bug', 'feature', 'improvement', 'other'].map(t => (<button key={t} onClick={() => setRoadmapFilter(p => ({...p, type: t as any}))} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm capitalize transition-colors ${roadmapFilter.type === t ? 'bg-black text-white font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>{t === 'all' ? 'Todos' : t === 'feature' ? 'Features' : t === 'bug' ? 'Bugs' : t === 'improvement' ? 'Melhorias' : 'Outros'}</button>))}</div></div>
                         <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Status</h3><div className="space-y-1">{['all', 'pending', 'planned', 'in_progress', 'completed'].map(s => (<button key={s} onClick={() => setRoadmapFilter(p => ({...p, status: s as any}))} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm capitalize transition-colors ${roadmapFilter.status === s ? 'bg-white border border-gray-200 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>{s === 'all' ? 'Todos' : s === 'in_progress' ? 'Em Progresso' : s === 'completed' ? 'Concluído' : s === 'pending' ? 'Pendente' : 'Planejado'}</button>))}</div></div>
                    </aside>
                    <div className="lg:col-span-3">
                        <div className="flex justify-between items-center mb-6"><span className="text-sm text-gray-500"><strong>{feedbacks?.length || 0}</strong> sugestões encontradas</span><div className="flex gap-2"><button onClick={() => setRoadmapFilter(p => ({...p, sort: 'votes'}))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roadmapFilter.sort === 'votes' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}>Mais Votados</button><button onClick={() => setRoadmapFilter(p => ({...p, sort: 'recent'}))} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${roadmapFilter.sort === 'recent' ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-gray-600'}`}>Mais Recentes</button></div></div>
                        {feedbacksLoading ? <IdeasListSkeleton /> : (<div className="grid gap-4">{feedbacks?.map((item: Feedback) => (<FeedbackCard key={item.id} feedback={item} onClick={(id) => setSelectedFeedbackId(id)} hasVoted={userFeedbackVotes?.has(item.id) || false} onVote={(e) => { e.stopPropagation(); if(requireAuth()) feedbackVoteMutation.mutate({feedbackId: item.id, userId: session.user.id, hasVoted: !!userFeedbackVotes?.has(item.id)}); }} />))}</div>)}
                    </div>
                </div>
            </div>
        )}

        {viewState.type === 'IDEAS' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-gray-100">
                    <div><h1 className="text-4xl font-bold text-apple-text tracking-tight mb-2">Explorar Ideias</h1><p className="text-gray-500 text-lg font-light">Descubra oportunidades para criar e ganhar dinheiro com Micro SaaS.</p></div>
                    <button onClick={() => { if (requireAuth()) setIsIdeaModalOpen(true); }} className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium shadow-xl shadow-black/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Nova Ideia</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <aside className="lg:col-span-1 space-y-10">
                        <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Pesquisar</h3><div className="relative group"><Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-400 group-focus-within:text-apple-blue transition-colors" /><input type="text" placeholder="Palavras-chave..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-gray-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-apple-blue/10 focus:border-apple-blue outline-none transition-all shadow-sm" /></div></div>
                        <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Filtros</h3><div className="space-y-2"><button onClick={() => { setShowMostVotedOnly(!showMostVotedOnly); setShowFavoritesOnly(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${showMostVotedOnly ? 'bg-orange-50 text-orange-600 shadow-sm border border-orange-100' : 'text-gray-600 hover:bg-gray-100'}`}><Flame className={`w-4 h-4 ${showMostVotedOnly ? 'fill-orange-600' : ''}`} /> Mais Votados</button><button onClick={() => { if(requireAuth()) { setShowFavoritesOnly(!showFavoritesOnly); setShowMostVotedOnly(false); } }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${showFavoritesOnly ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-600 hover:bg-gray-100'}`}><Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} /> Meus Favoritos</button></div></div>
                        <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Meus Projetos</h3><button onClick={() => { if(requireAuth()) setShowMyIdeasOnly(!showMyIdeasOnly); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${showMyIdeasOnly ? 'bg-black text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}><UserCircle className="w-4 h-4" /> Minhas Publicações</button></div>
                        
                        {/* Visualização & Ordenação */}
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Exibição</h3>
                            
                            {/* Contagem */}
                            <div className="mb-3 text-xs text-gray-500 font-medium px-1">
                                Encontrados: <strong className="text-apple-text">{filteredIdeas.length}</strong>
                            </div>

                            {/* Sort Switcher */}
                            <div className="mb-3">
                                 <button 
                                    onClick={() => setSortBy(prev => prev === 'newest' ? 'votes' : 'newest')} 
                                    className="w-full flex items-center justify-between bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    <span>{sortBy === 'newest' ? 'Recentes' : 'Populares'}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            {/* Grid/List Switcher */}
                            <div className="flex bg-gray-200/50 p-1 rounded-xl">
                                <button onClick={() => setIdeasViewMode('grid')} className={`flex-1 p-2 rounded-lg transition-all flex items-center justify-center ${ideasViewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                                    <LayoutGrid className="w-4 h-4" />
                                </button>
                                <button onClick={() => setIdeasViewMode('list')} className={`flex-1 p-2 rounded-lg transition-all flex items-center justify-center ${ideasViewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}>
                                    <ListIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Categorias</h3><div className="space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">{niches.map(n => (<button key={n} onClick={() => setSelectedNiche(n)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${selectedNiche === n ? 'bg-white font-bold text-black shadow-sm border border-gray-100' : 'text-gray-500 font-medium hover:bg-gray-50 hover:text-gray-900'}`}>{n}</button>))}</div></div>
                    </aside>
                    
                    <div className="lg:col-span-3 flex flex-col min-h-[600px]">
                        <div className="flex-grow">
                            {ideasLoading ? (<IdeasListSkeleton />) : (<div className={`grid gap-6 ${ideasViewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>{paginatedIdeas.map((idea) => (<IdeaCard key={idea.id} idea={idea} onUpvote={handleUpvote} onToggleFavorite={handleToggleFavorite} onDelete={promptDeleteIdea} viewMode={ideasViewMode} onClick={(idea) => { setSelectedIdeaId(idea.id); prefetchIdeaDetail(idea.id); }} currentUserId={session?.user?.id} />))}</div>)}
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {totalPages > 1 && (
                            <div className="flex flex-col md:flex-row justify-between items-center mt-12 pt-6 border-t border-gray-100 gap-4">
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    <span>Mostrar</span>
                                    <select 
                                        value={itemsPerPage}
                                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                        className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 font-bold text-black focus:border-apple-blue outline-none cursor-pointer"
                                    >
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                    <span>por página</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    
                                    {getPageNumbers().map((page, idx) => (
                                        typeof page === 'number' ? (
                                            <button 
                                                key={idx}
                                                onClick={() => setCurrentPage(page)}
                                                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                                                    currentPage === page 
                                                    ? 'bg-apple-blue text-white shadow-md border border-apple-blue' 
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span key={idx} className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>
                                        )
                                    ))}

                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 h-10 flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-bold"
                                    >
                                        Seguinte <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {viewState.type === 'SHOWROOM' && (
            <>
               <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div><h1 className="text-3xl font-bold text-apple-text tracking-tight mb-1">Showroom de MVPs</h1><p className="text-gray-500 text-sm">Projetos reais construídos pela comunidade.</p></div>
                    <button onClick={() => { if (requireAuth()) { setEditingProject(null); setIsProjectModalOpen(true); } }} className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-black/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"><Plus className="w-5 h-5" /> Publicar Projeto</button>
                </div>
                <ShowroomFilters searchQuery={showroomSearch} setSearchQuery={setShowroomSearch} category={showroomCategory} setCategory={setShowroomCategory} viewMode={showroomViewMode} setViewMode={setShowroomViewMode} showFavorites={showroomShowFavs} setShowFavorites={setShowroomShowFavs} sortBy={showroomSort} setSortBy={setShowroomSort} myProjects={showroomMyProjects} setMyProjects={setShowroomMyProjects} requireAuth={requireAuth} />
                {showroomLoading ? (<IdeasListSkeleton />) : hydratedShowroomProjects.length === 0 ? (<EmptyState onClearFilters={() => { setShowroomSearch(''); setShowroomCategory('Todos'); setShowroomShowFavs(false); setShowroomMyProjects(false); }} onNewProject={() => { if (requireAuth()) { setEditingProject(null); setIsProjectModalOpen(true); }}} />) : (<div className={`grid gap-6 ${showroomViewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>{hydratedShowroomProjects.map(project => ( showroomViewMode === 'grid' ? (<ShowroomCard key={project.id} project={project} onClick={(p) => { setSelectedIdeaId(p.id); prefetchIdeaDetail(p.id); }} onToggleFavorite={handleToggleFavorite} onVote={handleUpvote} />) : (<ShowroomListItem key={project.id} project={project} onClick={(p) => { setSelectedIdeaId(p.id); prefetchIdeaDetail(p.id); }} onToggleFavorite={handleToggleFavorite} onVote={handleUpvote} />) ))}</div>)}
            </>
        )}
      </main>

      <footer className="w-full bg-gray-50 border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2 text-gray-400"><AlertTriangle className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">Sistema v1.0.3</span></div>
                 <p className="text-[10px] text-gray-500 max-w-md leading-relaxed">A Garagem está em fase inicial de desenvolvimento. Funcionalidades podem mudar e bugs podem ocorrer. Use com carinho e reporte problemas à comunidade.</p>
                 <p className="text-[10px] text-gray-400 mt-2">© 2024 Garagem de Micro SaaS. Todos os direitos reservados.</p>
            </div>
            <a href={adminUrl} className="text-gray-300 hover:text-black transition-colors text-xs font-bold uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Admin
            </a>
        </div>
      </footer>

      <NewIdeaModal isOpen={isIdeaModalOpen} onClose={() => setIsIdeaModalOpen(false)} onSave={handleAddIdea} />
      <NewProjectModal isOpen={isProjectModalOpen} onClose={() => { setIsProjectModalOpen(false); setEditingProject(null); }} onSave={handleSaveProject} initialData={editingProject} />
      
      {selectedIdeaId && (
          <IdeaDetailModal 
            idea={activeIdea} 
            currentUserId={session?.user?.id} 
            currentUserData={{ name: session?.user?.user_metadata?.full_name || 'Usuário', avatar: userAvatar || undefined }} 
            onClose={() => setSelectedIdeaId(null)} 
            onUpvote={handleUpvote} 
            onToggleFavorite={handleToggleFavorite} 
            onRequestPdr={handleRequestPdr} 
            onJoinTeam={handleInterested} 
            onAddImprovement={handleAddImprovement} 
            refreshData={() => queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ideas.detail(selectedIdeaId!) })} 
            onPromoteIdea={handlePromoteIdea} 
          />
      )}

      <CreateFeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} userId={session?.user?.id || ''} />
      <FeedbackDetailModal feedbackId={selectedFeedbackId} onClose={() => setSelectedFeedbackId(null)} userId={session?.user?.id || ''} userHasVoted={selectedFeedbackId ? userFeedbackVotes?.has(selectedFeedbackId) || false : false} />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <DeleteConfirmationModal isOpen={!!ideaToDelete} onClose={() => setIdeaToDelete(null)} onConfirm={confirmDeleteIdea} />

    </div>
  );
};

export default App;