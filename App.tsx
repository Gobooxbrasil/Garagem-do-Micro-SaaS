
import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Database,
  User,
  Bell,
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ type: 'LANDING' });
  
  // DATA STATES
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // ERROR / OFFLINE STATES
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  
  // MODAL STATES
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // DELETE CONFIRMATION STATE
  const [ideaToDelete, setIdeaToDelete] = useState<string | null>(null);
  
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  // FILTER & VIEW STATES
  const [selectedNiche, setSelectedNiche] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [ideasViewMode, setIdeasViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showMyIdeasOnly, setShowMyIdeasOnly] = useState(false);

  // ================= EFFECT 1: AUTH SETUP =================
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
         setViewState({ type: 'IDEAS' });
         fetchNotifications(session.user.id);
         fetchUserAvatar(session.user.id);
      }
    }).finally(() => {
      setIsAuthChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
          setViewState(prev => prev.type === 'LANDING' ? { type: 'IDEAS' } : prev);
          fetchNotifications(session.user.id);
          fetchUserAvatar(session.user.id);
      } else {
          setViewState({ type: 'LANDING' });
          setNotifications([]);
          setUserAvatar(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ================= NOTIFICATIONS & USER LOGIC =================
  const fetchNotifications = async (userId: string) => {
      if (isOfflineMode) return;
      try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('recipient_id', userId)
            .order('created_at', { ascending: false });
            
          if (!error && data) {
              setNotifications(data);
          }
      } catch (err) {
          console.warn("Tabela de notificações pode não existir ainda.");
      }
  };

  const fetchUserAvatar = async (userId: string) => {
      if (isOfflineMode) return;
      try {
          const { data } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', userId)
            .single();
          
          if (data?.avatar_url) {
              setUserAvatar(data.avatar_url);
          }
      } catch (error) {
          console.error("Erro ao buscar avatar", error);
      }
  };

  const markNotificationAsRead = async (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      if (!isOfflineMode) {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
      }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ================= DATA FETCHING LOGIC =================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsOfflineMode(false);
    
    try {
      // --- FETCH IDEAS ---
      let ideasData: any[] | null = null;
      let ideasError: any = null;

      try {
          // 1. Try full fetch with all relations
          const result = await supabase
            .from('ideas')
            .select(`
                *, 
                profiles(full_name, avatar_url),
                idea_developers(id, user_id, created_at, profiles(full_name, avatar_url)),
                idea_improvements(id, user_id, content, created_at, profiles(full_name, avatar_url))
            `)
            .order('created_at', { ascending: false });
            
          if (result.error) throw result.error;
          ideasData = result.data;

      } catch (e: any) {
          // 2. Fallback: If joined tables don't exist, fetch basic ideas
          console.warn("Full fetch falhou, tentando modo basico...", e.message);
          
          const basicResult = await supabase
            .from('ideas')
            .select(`*, profiles(full_name, avatar_url)`)
            .order('created_at', { ascending: false });
            
          ideasData = basicResult.data;
          
          if (basicResult.error) {
             ideasError = basicResult.error;
          }
      }

      if (ideasError) throw ideasError;

      // Process Data
      let ideasWithFavs: Idea[] = (ideasData as any[])?.map(i => ({
          ...i,
          idea_developers: i.idea_developers || [],
          idea_improvements: i.idea_improvements?.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []
      })) || [];
      
      if (ideasWithFavs.length === 0) {
         setIdeas([]); 
      } else {
         if (session?.user) {
            try {
                const { data: favs } = await supabase
                    .from('favorites')
                    .select('idea_id')
                    .eq('user_id', session.user.id);
                    
                if (favs) {
                    const favIds = new Set(favs.map((f: any) => f.idea_id));
                    ideasWithFavs = ideasWithFavs.map((i: Idea) => ({
                        ...i,
                        isFavorite: favIds.has(i.id)
                    }));
                }
            } catch (err) { console.warn("Erro ao buscar favoritos"); }
         }
         setIdeas(ideasWithFavs);
         
         // IMPORTANT: Do not update selectedIdea here if it causes a loop!
         // Only update if the data actually changed meaningfully or if it's a fresh fetch
      }
      
      // --- FETCH PROJECTS ---
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select(`*, reviews (*), profiles(full_name, avatar_url)`)
        .order('created_at', { ascending: false });
        
      if (projError) throw projError;
      
      if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
      } else {
          setProjects([]);
      }

    } catch (error: any) {
      console.warn("Erro ao buscar dados.", error);
      setIsOfflineMode(true);
      setIdeas(INITIAL_IDEAS);
      setProjects(INITIAL_PROJECTS);
    }

    setIsLoading(false);
  }, [session]); // Removed 'selectedIdea' to prevent fetch loop

  // ================= EFFECT 2: TRIGGER FETCH =================
  useEffect(() => {
    if ((viewState.type === 'IDEAS' || viewState.type === 'SHOWROOM') && !isAuthChecking) {
        fetchData();
    }
  }, [viewState.type, isAuthChecking, fetchData]);

  // ================= ACTIONS =================
  
  const handleOfflineAction = () => {
      if (isOfflineMode) {
          alert("FUNCIONALIDADE INDISPONÍVEL.\n\nVerifique a conexão com o Supabase.");
          return true;
      }
      return false;
  };
  const requireAuth = () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  const handleUpvote = async (id: string) => {
    if (handleOfflineAction()) return;
    if (!requireAuth()) return;
    
    const currentIdea = ideas.find(i => i.id === id);
    if (!currentIdea) return;
    
    const newCount = currentIdea.votes_count + 1;
    const updatedIdeas = ideas.map(idea => 
        idea.id === id ? { ...idea, votes_count: newCount } : idea
    );
    setIdeas(updatedIdeas);
    if (selectedIdea && selectedIdea.id === id) setSelectedIdea({ ...selectedIdea, votes_count: newCount });

    await supabase.from('ideas').update({ votes_count: newCount }).eq('id', id);
  };

  const handleToggleFavorite = async (id: string) => {
    if (handleOfflineAction()) return;
    if (!requireAuth()) return;
    const idea = ideas.find(i => i.id === id);
    const isFav = idea?.isFavorite;

    const updatedIdeas = ideas.map(i => 
        i.id === id ? { ...i, isFavorite: !isFav } : i
    );
    setIdeas(updatedIdeas);
    if (selectedIdea && selectedIdea.id === id) setSelectedIdea({ ...selectedIdea, isFavorite: !isFav });

    try {
      if (isFav) {
        await supabase.from('favorites').delete().match({ user_id: session.user.id, idea_id: id });
      } else {
        await supabase.from('favorites').insert({ user_id: session.user.id, idea_id: id });
      }
    } catch (error) {
        console.error(error);
        setIdeas(ideas); 
    }
  };

  const handleJoinIdea = async (id: string) => {
    if (handleOfflineAction()) return;
    if (!requireAuth()) return;

    const idea = ideas.find(i => i.id === id);
    if (!idea) return;

    try {
        const { data, error } = await supabase.from('idea_developers').insert({
            idea_id: id,
            user_id: session.user.id
        }).select('*, profiles(*)').single();

        if (error) throw error;

        if (idea.user_id && idea.user_id !== session.user.id) {
            await supabase.from('notifications').insert({
                recipient_id: idea.user_id,
                sender_id: session.user.id,
                type: 'NEW_DEV',
                payload: {
                    idea_id: id,
                    idea_title: idea.title,
                    user_name: session.user.user_metadata?.full_name
                }
            });
        }

        const newDev = data;
        const updatedIdeas = ideas.map(i => {
            if (i.id === id) {
                return {
                    ...i,
                    is_building: true,
                    idea_developers: [...(i.idea_developers || []), newDev]
                }
            }
            return i;
        });
        setIdeas(updatedIdeas);
        if (selectedIdea && selectedIdea.id === id) {
             setSelectedIdea({ 
                 ...selectedIdea, 
                 is_building: true,
                 idea_developers: [...(selectedIdea.idea_developers || []), newDev]
             });
        }

    } catch (error: any) {
        if (error.code === '23505') {
            alert("Você já faz parte da equipe!");
        } else {
            alert(`Erro: ${error.message}`);
        }
    }
  };

  const handleAddImprovement = async (id: string, content: string) => {
      if (handleOfflineAction()) return;
      if (!requireAuth()) return;

      const idea = ideas.find(i => i.id === id);
      if (!idea) return;

      try {
          const { data, error } = await supabase.from('idea_improvements').insert({
              idea_id: id,
              user_id: session.user.id,
              content: content
          }).select('*, profiles(*)').single();

          if (error) throw error;

          const updatedIdeas = ideas.map(i => {
              if (i.id === id) {
                  return {
                      ...i,
                      idea_improvements: [...(i.idea_improvements || []), data]
                  }
              }
              return i;
          });
          setIdeas(updatedIdeas);
          if (selectedIdea && selectedIdea.id === id) {
               setSelectedIdea({
                   ...selectedIdea,
                   idea_improvements: [...(selectedIdea.idea_improvements || []), data]
               });
          }

      } catch (error: any) {
          console.error(error);
          alert("Erro ao enviar sugestão.");
      }
  };

  const handleToggleBuild = async (id: string) => {
    if (handleOfflineAction()) return;
    if (!requireAuth()) return;
    
    const idea = ideas.find(i => i.id === id);
    const newState = !idea?.is_building;
    
    const updatedIdeas = ideas.map(idea => 
        idea.id === id ? { ...idea, is_building: newState } : idea
    );
    setIdeas(updatedIdeas);
    if (selectedIdea && selectedIdea.id === id) setSelectedIdea({ ...selectedIdea, is_building: newState! });
    await supabase.from('ideas').update({ is_building: newState }).eq('id', id);
  };

  const handleAddIdea = async (ideaData: any) => {
    if (handleOfflineAction()) return;
    if (!requireAuth()) return;
    
    const { data, error } = await supabase.from('ideas').insert({
      ...ideaData,
      user_id: session.user.id,
      votes_count: 0,
      is_building: false
    }).select('*, profiles(full_name, avatar_url)').single(); 

    if (data && !error) {
      const optimisticData = {
          ...data,
          idea_developers: [],
          idea_improvements: [],
          profiles: {
             full_name: session.user.user_metadata?.full_name || 'Eu',
             avatar_url: userAvatar || ''
          }
      }
      setIdeas(prev => [optimisticData, ...prev]);
      setShowMyIdeasOnly(true);
    } else {
        alert(`ERRO AO SALVAR: ${error?.message || JSON.stringify(error)}`);
    }
  };

  const handleRequestPdr = async (ideaId: string, ownerId: string, ideaTitle: string, message: string) => {
      if (handleOfflineAction()) return;
      if (!requireAuth()) return;

      const { error } = await supabase.from('notifications').insert({
          recipient_id: ownerId,
          sender_id: session.user.id,
          sender_email: session.user.email,
          type: 'PDR_REQUEST',
          payload: {
              idea_id: ideaId,
              idea_title: ideaTitle,
              message: message
          }
      });

      if (error) throw error;
  };

  const handleAddProject = async (newProjectData: any) => {
    if (handleOfflineAction()) return;
    if (!requireAuth()) return;
    
    const { data, error } = await supabase.from('projects').insert({
      ...newProjectData,
      user_id: session.user.id,
      images: newProjectData.images 
    }).select('*, profiles(full_name, avatar_url)').single();

    if (data && !error) {
        const optimisticData = {
          ...data,
          reviews: [],
          profiles: {
             full_name: session.user.user_metadata?.full_name || 'Eu',
             avatar_url: userAvatar || ''
          }
        }
        setProjects(prev => [optimisticData, ...prev]);
        setViewState({ type: 'SHOWROOM' });
    } else {
        alert(`ERRO AO SALVAR PROJETO: ${error?.message}`);
    }
  };

  const handleAddReview = async (projectId: string, reviewData: any) => {
    if (handleOfflineAction()) return;
    if (!requireAuth()) return;
    const { data, error } = await supabase.from('reviews').insert({
        project_id: projectId,
        ...reviewData,
        user_id: session.user.id
    }).select().single();

    if (data && !error) {
        setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, reviews: [data, ...(p.reviews || [])] } : p
        ));
    } else {
        alert(`Erro ao enviar review: ${error?.message}`);
    }
  };

  const niches = useMemo(() => {
    const allNiches = ideas.map(i => i.niche);
    return ['Todos', ...Array.from(new Set(allNiches))];
  }, [ideas]);

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
    if (showMyIdeasOnly && session?.user) {
        result = result.filter(idea => idea.user_id === session.user.id);
    }
    if (selectedNiche !== 'Todos') {
      result = result.filter(idea => idea.niche === selectedNiche);
    }
    result.sort((a, b) => {
      if (sortBy === 'votes') return b.votes_count - a.votes_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return result;
  }, [ideas, selectedNiche, sortBy, searchQuery, showFavoritesOnly, showMyIdeasOnly, session]);

  const promptDeleteIdea = (id: string) => {
      if (handleOfflineAction()) return;
      if (!requireAuth()) return;
      setIdeaToDelete(id);
  };

  const confirmDeleteIdea = async () => {
      const id = ideaToDelete;
      if (!id || !session) return;
      if (handleOfflineAction()) {
          setIdeaToDelete(null);
          return;
      }
      setIdeaToDelete(null); 
      const previousIdeas = [...ideas];
      setIdeas(prev => prev.filter(i => i.id !== id));
      if (selectedIdea?.id === id) setSelectedIdea(null);

      try {
          const { error } = await supabase.from('ideas').delete().eq('id', id);
          if (error) throw error;
      } catch (error: any) {
          console.error('Erro ao deletar:', error);
          setIdeas(previousIdeas);
          alert(`❌ FALHA AO EXCLUIR:\n\n${error.message}`);
      }
  };

  // --- RENDER RETURN ---
  if (viewState.type === 'LANDING') {
    return <LandingPage onEnter={() => setViewState({ type: 'IDEAS' })} onLogin={() => setIsAuthModalOpen(true)} isLoggedIn={!!session} />;
  }

  return (
    <div className="min-h-screen bg-apple-bg font-sans text-apple-text selection:bg-apple-blue selection:text-white pb-20">
      
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
            <span className="text-lg font-bold tracking-tight hidden md:inline">Garagem <span className="text-gray-400 font-normal text-xs uppercase tracking-widest ml-1">do Micro SaaS</span></span>
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
                     <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                         <div className="p-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                             <span className="text-xs font-bold text-gray-500 uppercase">Notificações</span>
                             {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} novas</span>}
                         </div>
                         <div className="max-h-80 overflow-y-auto custom-scrollbar">
                             {notifications.length === 0 ? (
                                 <div className="p-8 text-center text-gray-400 text-sm">Nenhuma notificação.</div>
                             ) : (
                                 notifications.map(notif => (
                                     <div 
                                        key={notif.id} 
                                        onClick={() => markNotificationAsRead(notif.id)}
                                        className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/30' : ''}`}
                                     >
                                         <div className="flex items-start gap-3">
                                             <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.read ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                             <div>
                                                 <p className="text-xs text-gray-400 mb-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                                                 {notif.type === 'PDR_REQUEST' && (
                                                     <p className="text-sm text-gray-700">
                                                         <span className="font-bold">Solicitação de PDR</span> para a ideia <strong>{notif.payload.idea_title}</strong>.
                                                     </p>
                                                 )}
                                                 {notif.type === 'NEW_DEV' && (
                                                     <p className="text-sm text-gray-700">
                                                         <strong>{notif.payload.user_name || 'Alguém'}</strong> quer desenvolver sua ideia <strong>{notif.payload.idea_title}</strong>!
                                                     </p>
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

             {/* Auth/Profile */}
             {session ? (
                 <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                     <button 
                        onClick={() => setViewState({ type: 'PROFILE' })}
                        className="flex items-center gap-2 text-right group"
                     >
                         <div className="hidden sm:block">
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
                     </button>
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
            <ProfileView session={session} />
        )}

        {/* --- VIEW: PROJECT DETAIL --- */}
        {viewState.type === 'PROJECT_DETAIL' && (
            <ProjectDetail 
                project={projects.find(p => p.id === viewState.projectId)!} 
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
                                    onClick={() => { if(requireAuth()) setShowFavoritesOnly(!showFavoritesOnly); }}
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
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="h-72 bg-gray-100 rounded-2xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className={`grid gap-6 ${ideasViewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                                {filteredIdeas.map((idea) => (
                                    <IdeaCard 
                                        key={idea.id} 
                                        idea={idea} 
                                        onUpvote={handleUpvote}
                                        onToggleBuild={handleToggleBuild}
                                        onToggleFavorite={handleToggleFavorite}
                                        onDelete={promptDeleteIdea}
                                        viewMode={ideasViewMode}
                                        onClick={setSelectedIdea}
                                        currentUserId={session?.user?.id}
                                    />
                                ))}
                                {filteredIdeas.length === 0 && (
                                    <div className="col-span-full py-32 text-center text-gray-400 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-3xl">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                            <Search className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-600">Nenhum resultado</h3>
                                        <p className="text-sm">Tente ajustar os filtros ou busque por outro termo.</p>
                                    </div>
                                )}
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
                    {projects.map(project => (
                        <ProjectCard 
                            key={project.id} 
                            project={project} 
                            onClick={(id) => setViewState({ type: 'PROJECT_DETAIL', projectId: id })}
                        />
                    ))}
                    {projects.length === 0 && (
                         <div className="col-span-full py-20 text-center text-gray-400 flex flex-col items-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Layers className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-600">Showroom Vazio</h3>
                            <p className="text-sm">Seja o primeiro a lançar seu MVP aqui.</p>
                        </div>
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
        onClose={() => setSelectedIdea(null)}
        onUpvote={handleUpvote}
        onToggleBuild={handleToggleBuild}
        onToggleFavorite={handleToggleFavorite}
        onRequestPdr={handleRequestPdr}
        onJoinTeam={handleJoinIdea}
        onAddImprovement={handleAddImprovement}
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
