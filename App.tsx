import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { ViewState, Idea, Project, Review } from './types';
import { INITIAL_IDEAS, INITIAL_PROJECTS } from './constants';
import IdeaCard from './components/IdeaCard';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import NewIdeaModal from './components/NewIdeaModal';
import AuthModal from './components/AuthModal';
import { 
  Layers, 
  Plus, 
  Github, 
  LayoutGrid, 
  List as ListIcon, 
  Filter, 
  ChevronDown,
  Calendar,
  TrendingUp,
  Lightbulb,
  LogOut,
  UserCircle
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [viewState, setViewState] = useState<ViewState>({ type: 'IDEAS' });
  
  // DATA STATES (Now fetching from DB or Fallback to Constants)
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // MODAL STATES
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // FILTER & VIEW STATES
  const [selectedNiche, setSelectedNiche] = useState<string>('Todos');
  const [sortBy, setSortBy] = useState<'newest' | 'votes'>('newest');
  const [ideasViewMode, setIdeasViewMode] = useState<'grid' | 'list'>('grid');

  // ================= EFFECT 1: AUTH SETUP (Run ONCE) =================
  useEffect(() => {
    // Check Active Session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for Auth Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  // ================= EFFECT 2: DATA FETCHING (Run on Session Change) =================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // --- FETCH IDEAS ---
        const { data: ideasData, error: ideasError } = await supabase
          .from('ideas')
          .select('*')
          .order('created_at', { ascending: false });

        if (ideasError) {
          throw ideasError;
        } else {
          // Check for favorites if user is logged in
          let ideasWithFavs = ideasData || [];
          
          if (session?.user) {
            const { data: favs } = await supabase
                .from('favorites')
                .select('idea_id')
                .eq('user_id', session.user.id);
                
            const favIds = new Set(favs?.map((f: any) => f.idea_id));
            ideasWithFavs = ideasWithFavs.map((i: Idea) => ({
                ...i,
                isFavorite: favIds.has(i.id)
            }));
          }
          setIdeas(ideasWithFavs);
        }
      } catch (error: any) {
        console.warn("Usando dados locais (Supabase não conectado):", error.message);
        setIdeas(INITIAL_IDEAS);
      }

      try {
        // --- FETCH PROJECTS ---
        const { data: projectsData, error: projError } = await supabase
          .from('projects')
          .select(`
            *,
            reviews (*)
          `)
          .order('created_at', { ascending: false });
          
        if (projError) {
            throw projError;
        } else {
            setProjects(projectsData || []);
        }
      } catch (error: any) {
        console.warn("Usando projetos locais (Supabase não conectado):", error.message);
        setProjects(INITIAL_PROJECTS);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [session]); // Re-fetch data (mainly for favorites) when session changes

  // ================= HELPERS =================
  const requireAuth = () => {
    if (!session) {
      setIsAuthModalOpen(true);
      return false;
    }
    return true;
  };

  // DERIVED DATA
  const niches = useMemo(() => {
    const allNiches = ideas.map(i => i.niche);
    return ['Todos', ...Array.from(new Set(allNiches))];
  }, [ideas]);

  const filteredIdeas = useMemo(() => {
    let result = [...ideas];
    
    // Filter by Niche
    if (selectedNiche !== 'Todos') {
      result = result.filter(idea => idea.niche === selectedNiche);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'votes') {
        return b.votes_count - a.votes_count;
      }
      // Newest
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [ideas, selectedNiche, sortBy]);

  // ================= ACTIONS =================

  const handleUpvote = async (id: string) => {
    if (!requireAuth()) return;

    // Optimistic UI Update
    const currentIdea = ideas.find(i => i.id === id);
    if (!currentIdea) return;
    
    const newCount = currentIdea.votes_count + 1;
    setIdeas(prev => prev.map(idea => 
      idea.id === id ? { ...idea, votes_count: newCount } : idea
    ));

    // DB Update
    await supabase.from('ideas').update({ votes_count: newCount }).eq('id', id);
  };

  const handleToggleFavorite = async (id: string) => {
    if (!requireAuth()) return;

    const idea = ideas.find(i => i.id === id);
    const isFav = idea?.isFavorite;

    // Optimistic UI
    setIdeas(prev => prev.map(i => 
      i.id === id ? { ...i, isFavorite: !isFav } : i
    ));

    if (isFav) {
      // Remove
      await supabase.from('favorites').delete().match({ user_id: session.user.id, idea_id: id });
    } else {
      // Add
      await supabase.from('favorites').insert({ user_id: session.user.id, idea_id: id });
    }
  };

  const handleToggleBuild = async (id: string) => {
    if (!requireAuth()) return;
    
    const idea = ideas.find(i => i.id === id);
    const newState = !idea?.is_building;

    setIdeas(prev => prev.map(idea => 
      idea.id === id ? { ...idea, is_building: newState } : idea
    ));
    
    await supabase.from('ideas').update({ is_building: newState }).eq('id', id);
  };

  const handleAddIdea = async (ideaData: any) => {
    if (!requireAuth()) return;

    const { data, error } = await supabase.from('ideas').insert({
      ...ideaData,
      user_id: session.user.id,
      votes_count: 0,
      is_building: false
    }).select().single();

    if (data && !error) {
      setIdeas(prev => [data, ...prev]);
    } else if (error) {
        console.error("Error adding idea", error);
        // Fallback for demo without backend
        const mockIdea = {
            ...ideaData,
            id: Math.random().toString(36).substr(2, 9),
            votes_count: 0,
            is_building: false,
            created_at: new Date().toISOString()
        };
        setIdeas(prev => [mockIdea, ...prev]);
    }
  };

  const handleAddProject = async (newProjectData: any) => {
    if (!requireAuth()) return;

    const { data, error } = await supabase.from('projects').insert({
      ...newProjectData,
      user_id: session.user.id,
      images: newProjectData.images 
    }).select().single();

    if (data && !error) {
        setProjects(prev => [{...data, reviews: []}, ...prev]);
        setViewState({ type: 'SHOWROOM' });
    } else if (error) {
        // Fallback for demo
        const mockProject = {
            ...newProjectData,
            id: Math.random().toString(36).substr(2, 9),
            reviews: [],
            created_at: new Date().toISOString()
        };
        setProjects(prev => [mockProject, ...prev]);
        setViewState({ type: 'SHOWROOM' });
    }
  };

  const handleAddReview = async (projectId: string, reviewData: any) => {
    if (!requireAuth()) return;

    const { data, error } = await supabase.from('reviews').insert({
        project_id: projectId,
        user_name: reviewData.user_name,
        rating: reviewData.rating,
        comment: reviewData.comment,
        user_id: session.user.id
    }).select().single();

    if (data && !error) {
        const newReview: Review = {
            id: data.id,
            project_id: data.project_id,
            user_name: data.user_name,
            rating: data.rating,
            comment: data.comment,
            maker_reply: data.maker_reply,
            created_at: data.created_at
        };

        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, reviews: [newReview, ...(p.reviews || [])] } : p
        ));
    } else {
         // Fallback for demo
         const mockReview: Review = {
            id: Math.random().toString(),
            project_id: projectId,
            user_name: reviewData.user_name,
            rating: reviewData.rating,
            comment: reviewData.comment,
            created_at: new Date().toISOString()
         }
         setProjects(prev => prev.map(p => 
            p.id === projectId ? { ...p, reviews: [mockReview, ...(p.reviews || [])] } : p
          ));
    }
  };

  // ================= RENDER =================
  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (viewState.type === 'IDEAS') {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-apple-text mb-2">
                Ideias Curadas
              </h2>
              <p className="text-lg text-apple-subtext font-light max-w-xl">
                Problemas reais esperando por uma solução elegante.
              </p>
            </div>
            <button 
                onClick={() => { if(requireAuth()) setIsIdeaModalOpen(true); }}
                className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg shadow-black/10 transition-all transform hover:scale-105 text-sm"
            >
                <Lightbulb className="w-4 h-4" /> Nova Ideia
            </button>
          </div>

          {/* TOOLBAR */}
          <div className="bg-white/50 backdrop-blur-sm border border-gray-200/60 rounded-2xl p-2 mb-8 flex flex-col lg:flex-row gap-4 justify-between items-center shadow-sm">
            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0 no-scrollbar px-2">
                <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                {niches.map(niche => (
                  <button
                    key={niche}
                    onClick={() => setSelectedNiche(niche)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                      selectedNiche === niche 
                        ? 'bg-apple-text text-white shadow-md' 
                        : 'bg-transparent text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {niche}
                  </button>
                ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 flex-shrink-0 w-full lg:w-auto justify-end px-2">
              <div className="relative group">
                 <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors">
                    {sortBy === 'newest' ? <Calendar className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {sortBy === 'newest' ? 'Mais Recentes' : 'Populares'}
                    <ChevronDown className="w-3 h-3" />
                 </button>
                 <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-20">
                    <button onClick={() => setSortBy('newest')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${sortBy === 'newest' ? 'font-bold text-apple-blue' : 'text-gray-600'}`}>Mais Recentes</button>
                    <button onClick={() => setSortBy('votes')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${sortBy === 'votes' ? 'font-bold text-apple-blue' : 'text-gray-600'}`}>Mais Votados</button>
                 </div>
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                <button onClick={() => setIdeasViewMode('grid')} className={`p-1.5 rounded-md transition-all ${ideasViewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setIdeasViewMode('list')} className={`p-1.5 rounded-md transition-all ${ideasViewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}><ListIcon className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          
          {/* List */}
          <div className={`gap-6 ${ideasViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'flex flex-col space-y-4'}`}>
            {filteredIdeas.map(idea => (
              <IdeaCard 
                key={idea.id} 
                idea={idea} 
                onUpvote={handleUpvote} 
                onToggleBuild={handleToggleBuild} 
                onToggleFavorite={handleToggleFavorite}
                viewMode={ideasViewMode}
              />
            ))}
            {filteredIdeas.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400">
                Nenhuma ideia encontrada.
              </div>
            )}
          </div>
        </div>
      );
    }

    if (viewState.type === 'SHOWROOM') {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
           <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4 mt-4">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-apple-text mb-2">
                Showroom
              </h2>
              <p className="text-lg text-apple-subtext font-light">
                O melhor da comunidade indie.
              </p>
            </div>
            <button 
                onClick={() => { if(requireAuth()) setIsProjectModalOpen(true); }}
                className="bg-black hover:bg-gray-800 text-white px-5 py-2 rounded-full font-medium flex items-center gap-2 shadow-lg shadow-black/10 transition-all transform hover:scale-105 text-sm"
            >
                <Plus className="w-4 h-4" /> Cadastrar Projeto
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={(id) => setViewState({ type: 'PROJECT_DETAIL', projectId: id })} 
              />
            ))}
          </div>
        </div>
      );
    }

    if (viewState.type === 'PROJECT_DETAIL') {
      const project = projects.find(p => p.id === viewState.projectId);
      if (!project) return <div>Projeto não encontrado</div>;
      return (
        <ProjectDetail 
            project={project} 
            onBack={() => setViewState({ type: 'SHOWROOM' })}
            onAddReview={handleAddReview}
        />
      );
    }
  };

  return (
    <div className="min-h-screen bg-apple-bg text-apple-text font-sans flex flex-col selection:bg-apple-blue selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div 
                className="flex items-center gap-3 cursor-pointer group select-none"
                onClick={() => setViewState({ type: 'IDEAS' })}
            >
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg shadow-gray-900/10 group-hover:scale-105 transition-transform duration-300">
                <Layers className="text-white w-5 h-5" strokeWidth={2} />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-base font-bold tracking-tight text-apple-text leading-none">Garagem</span>
                <span className="text-[10px] font-semibold text-apple-subtext uppercase tracking-widest mt-0.5">do Micro SaaS</span>
              </div>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center p-1.5 bg-gray-100/80 rounded-full border border-gray-200/50">
              <button 
                onClick={() => setViewState({ type: 'IDEAS' })}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${viewState.type === 'IDEAS' ? 'bg-white shadow-sm text-apple-text' : 'text-gray-500 hover:text-apple-text'}`}
              >
                Ideias
              </button>
              <button 
                onClick={() => setViewState({ type: 'SHOWROOM' })}
                className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${viewState.type === 'SHOWROOM' || viewState.type === 'PROJECT_DETAIL' ? 'bg-white shadow-sm text-apple-text' : 'text-gray-500 hover:text-apple-text'}`}
              >
                Showroom
              </button>
            </div>

            {/* Auth & Mobile */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-black transition-colors hidden md:block">
                <Github className="w-5 h-5" />
              </a>
              
              {session ? (
                <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 uppercase font-bold">Logado como</span>
                        <span className="text-xs font-semibold truncate max-w-[100px]">
                          {session.user.user_metadata?.full_name || session.user.email}
                        </span>
                    </div>
                    <button 
                        onClick={() => supabase.auth.signOut()}
                        title="Sair"
                        className="w-9 h-9 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-500 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shadow-sm transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
              ) : (
                <button 
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex items-center gap-2 bg-apple-text text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-800 transition-all"
                >
                    <UserCircle className="w-4 h-4" /> Entrar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-10 mt-auto bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-apple-subtext text-sm font-light">
                &copy; 2023 Garagem do Micro SaaS. Design minimalista.
            </p>
        </div>
      </footer>

      {/* Modals */}
      <NewProjectModal 
        isOpen={isProjectModalOpen} 
        onClose={() => setIsProjectModalOpen(false)} 
        onSave={handleAddProject} 
      />

      <NewIdeaModal 
        isOpen={isIdeaModalOpen} 
        onClose={() => setIsIdeaModalOpen(false)} 
        onSave={handleAddIdea} 
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default App;