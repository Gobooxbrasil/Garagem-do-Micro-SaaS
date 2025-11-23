
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { ViewState, Idea, Project, Review } from './types';
import { INITIAL_IDEAS, INITIAL_PROJECTS } from './constants';
import IdeaCard from './components/IdeaCard';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import NewProjectModal from './components/NewProjectModal';
import NewIdeaModal from './components/NewIdeaModal';
import IdeaDetailModal from './components/IdeaDetailModal';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
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
  UserCircle,
  Search,
  Heart,
  XCircle,
  AlertTriangle,
  Database,
  RefreshCw,
  Settings,
  User
} from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [viewState, setViewState] = useState<ViewState>({ type: 'LANDING' });
  
  // DATA STATES
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [configError, setConfigError] = useState(false);
  
  // MODAL STATES
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
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
      } else {
          setViewState({ type: 'LANDING' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ================= DATA FETCHING LOGIC =================
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setIsOfflineMode(false);
    setDbError(null);
    setConfigError(false);
    
    try {
      // --- FETCH IDEAS ---
      const { data: ideasData, error: ideasError } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (ideasError) throw ideasError;

      let ideasWithFavs = ideasData || [];
      
      // Correção: Se o banco retornar vazio, limpamos a lista explicitamente
      if (ideasWithFavs.length === 0) {
         setIdeas([]); 
      } else {
         if (session?.user) {
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
         }
         setIdeas(ideasWithFavs);
      }
    } catch (error: any) {
      console.warn("Erro ao buscar dados:", error);
      setIsOfflineMode(true);
      
      // Detecção de erro de configuração (URL padrão ou inválida)
      const isUrlError = error.message && (error.message.includes('Failed to fetch') || error.message.includes('URL') || error.code === 'PGRST301');
      
      if (isUrlError) {
          setConfigError(true);
          setDbError("Conexão recusada. Verifique o arquivo 'lib/supabaseClient.ts'.");
          setIdeas(INITIAL_IDEAS); // Mantém fallback para erro de conexão
      } else if (error.code === '42P01') {
          // ERRO: Tabela não encontrada (Usuário deletou as tabelas)
          setDbError("Tabelas não encontradas no Supabase. Rode o Script SQL para recriá-las.");
          setIdeas([]); // NÃO mostra dados fictícios, mostra vazio para o dev saber que deletou
      } else {
          setDbError(error.message);
          setIdeas(INITIAL_IDEAS);
      }
    }

    try {
      // --- FETCH PROJECTS ---
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select(`*, reviews (*)`)
        .order('created_at', { ascending: false });
        
      if (projError) throw projError;
      
      if (projectsData && projectsData.length > 0) {
          setProjects(projectsData);
      } else {
          setProjects([]); // Limpa se vazio
      }

    } catch (error: any) {
      if (!isOfflineMode) setIsOfflineMode(true);
      
      // Só usa fallback se NÃO for erro de "Tabela inexistente"
      if (error.code === '42P01') {
          setProjects([]);
      } else {
          setProjects(INITIAL_PROJECTS);
      }
    }

    setIsLoading(false);
  }, [session]);

  // ================= EFFECT 2: TRIGGER FETCH =================
  useEffect(() => {
    if (viewState.type !== 'LANDING' && !isAuthChecking) {
        fetchData();
    }
  }, [viewState.type, isAuthChecking, fetchData]);

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
    
    // Search Filter
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(idea => 
            idea.title.toLowerCase().includes(q) || 
            idea.pain.toLowerCase().includes(q) ||
            idea.solution.toLowerCase().includes(q)
        );
    }

    // Favorites Filter
    if (showFavoritesOnly) {
        result = result.filter(idea => idea.isFavorite);
    }

    // My Ideas Filter
    if (showMyIdeasOnly && session?.user) {
        result = result.filter(idea => idea.user_id === session.user.id);
    }

    // Niche Filter
    if (selectedNiche !== 'Todos') {
      result = result.filter(idea => idea.niche === selectedNiche);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'votes') {
        return b.votes_count - a.votes_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return result;
  }, [ideas, selectedNiche, sortBy, searchQuery, showFavoritesOnly, showMyIdeasOnly, session]);

  // ================= ACTIONS =================
  const handleUpvote = async (id: string) => {
    if (!requireAuth()) return;
    
    // Otimistic UI update
    const currentIdea = ideas.find(i => i.id === id);
    if (!currentIdea) return;
    
    const newCount = currentIdea.votes_count + 1;
    const updatedIdeas = ideas.map(idea => 
        idea.id === id ? { ...idea, votes_count: newCount } : idea
    );
    setIdeas(updatedIdeas);
    
    if (selectedIdea && selectedIdea.id === id) {
        setSelectedIdea({ ...selectedIdea, votes_count: newCount });
    }

    const { error } = await supabase.from('ideas').update({ votes_count: newCount }).eq('id', id);
    if (error) {
        console.error("Erro ao votar:", error);
        // Revert if failed
        setIdeas(ideas); 
        alert("Erro ao computar voto. Verifique a conexão.");
    }
  };

  const handleDeleteIdea = async (id: string) => {
      if (!requireAuth()) return;

      // 1. Guardar o estado atual para reverter caso dê erro
      const previousIdeas = [...ideas];
      const ideaToDelete = ideas.find(i => i.id === id);

      // 2. UI Otimista (Remove da tela imediatamente)
      setIdeas(prev => prev.filter(i => i.id !== id));
      if (selectedIdea?.id === id) setSelectedIdea(null);

      try {
          // 3. Tenta deletar no Supabase
          // count: 'exact' é crucial para saber se alguma linha foi realmente afetada
          const { error, count } = await supabase
            .from('ideas')
            .delete({ count: 'exact' }) 
            .eq('id', id);
          
          if (error) throw error;

          // 4. Se count for 0, o banco não deletou nada (provavelmente RLS bloqueou)
          if (count === 0) {
             // Verifica se o usuário é dono da ideia no Frontend para mensagem correta
             const isOwner = ideaToDelete?.user_id === session.user.id;
             
             throw new Error(
                isOwner 
                ? "ERRO SILENCIOSO: O banco confirmou a operação mas não deletou nenhum registro. Verifique as Políticas RLS."
                : "PERMISSÃO NEGADA: Você não é o proprietário desta ideia no banco de dados."
             );
          }

      } catch (error: any) {
          console.error('Erro ao deletar:', error);
          
          // 5. Reverte a UI
          setIdeas(previousIdeas);

          // 6. Mensagens de Erro Amigáveis
          let message = error.message;
          
          // Erro de Chave Estrangeira (Foreign Key) - Código Postgres 23503
          if (error.code === '23503') {
              message = "Não é possível excluir esta ideia porque existem FAVORITOS associados a ela.\n\nSolução: É necessário rodar um script SQL para ativar o 'CASCADE DELETE' no banco de dados.";
          }

          alert(`❌ FALHA AO EXCLUIR:\n\n${message}`);
      }
  };

  const handleToggleFavorite = async (id: string) => {
    if (!requireAuth()) return;
    const idea = ideas.find(i => i.id === id);
    const isFav = idea?.isFavorite;

    // Optimistic UI
    const updatedIdeas = ideas.map(i => 
        i.id === id ? { ...i, isFavorite: !isFav } : i
    );
    setIdeas(updatedIdeas);

    if (selectedIdea && selectedIdea.id === id) {
        setSelectedIdea({ ...selectedIdea, isFavorite: !isFav });
    }

    try {
      if (isFav) {
        const { error } = await supabase.from('favorites').delete().match({ user_id: session.user.id, idea_id: id });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('favorites').insert({ user_id: session.user.id, idea_id: id });
        if (error) throw error;
      }
    } catch (error: any) {
        console.error("Erro ao favoritar:", error);
        alert(`Erro ao salvar favorito: ${error.message}.`);
        // Revert
        setIdeas(ideas);
    }
  };

  const handleToggleBuild = async (id: string) => {
    if (!requireAuth()) return;
    const idea = ideas.find(i => i.id === id);
    const newState = !idea?.is_building;
    
    const updatedIdeas = ideas.map(idea => 
        idea.id === id ? { ...idea, is_building: newState } : idea
    );
    setIdeas(updatedIdeas);

    if (selectedIdea && selectedIdea.id === id) {
        setSelectedIdea({ ...selectedIdea, is_building: newState! });
    }

    const { error } = await supabase.from('ideas').update({ is_building: newState }).eq('id', id);
    if (error) {
        alert("Erro ao atualizar status.");
    }
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
      setShowMyIdeasOnly(true); // Switch to my ideas to show the new one
    } else {
        console.error("Erro ao salvar ideia:", error);
        alert(`ERRO AO SALVAR: ${error?.message || JSON.stringify(error)}`);
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
    } else {
        console.error("Erro ao salvar projeto:", error);
        alert(`ERRO AO SALVAR PROJETO: ${error?.message}`);
    }
  };

  const handleAddReview = async (projectId: string, reviewData: any) => {
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

  // ================= RENDER CONTENT =================
  
  if (isAuthChecking) {
      return (
        <div className="min-h-screen bg-apple-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                    <Layers className="text-white w-5 h-5" strokeWidth={2} />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Carregando...</p>
            </div>
        </div>
      );
  }

  const renderContent = () => {
    if (isLoading && viewState.type !== 'LANDING') {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        )
    }

    if (viewState.type === 'IDEAS') {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
          
          {/* Mensagem de Erro de Configuração */}
          {configError && (
             <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6 flex flex-col md:flex-row items-start gap-4 shadow-sm">
                <div className="bg-red-100 p-2.5 rounded-full mt-1">
                    <Settings className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-grow">
                    <h3 className="text-lg font-bold text-red-700 mb-1">Configuração Pendente</h3>
                    <p className="text-red-600 text-sm mb-3 leading-relaxed">
                        O aplicativo não conseguiu conectar ao Supabase. Você precisa adicionar suas chaves de API no arquivo <code>lib/supabaseClient.ts</code>.
                    </p>
                    <div className="bg-white/60 p-3 rounded-lg text-xs font-mono text-red-800 border border-red-100 mb-3">
                         Supabase Project Settings -&gt; API -&gt; URL & Anon Key
                    </div>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                    >
                        Já configurei, recarregar página
                    </button>
                </div>
             </div>
          )}

          {isOfflineMode && !configError && (
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-amber-800 text-sm shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg mt-0.5">
                        <Database className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                        <strong className="block text-amber-900 mb-1">Modo Offline / Erro de Banco</strong>
                        {dbError ? (
                            <div className="space-y-1">
                                <p className="font-medium text-amber-900">{dbError}</p>
                                {dbError.includes("Tabelas não encontradas") && (
                                    <p className="text-xs opacity-80">Como você deletou as tabelas, a visualização está vazia. Use o SQL Editor para recriar a estrutura se desejar.</p>
                                )}
                            </div>
                        ) : (
                            "Não foi possível conectar ao banco de dados. Exibindo dados fictícios."
                        )}
                    </div>
                  </div>
                  <button 
                    onClick={() => fetchData()} 
                    className="whitespace-nowrap px-4 py-2 bg-white border border-amber-200 rounded-lg text-amber-800 font-bold hover:bg-amber-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" /> Tentar Conectar Novamente
                  </button>
              </div>
          )}

          {/* Header Title & CTA */}
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 mt-4 pb-8 border-b border-gray-200">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-apple-text mb-2">
                Explorar Ideias
              </h2>
              <p className="text-lg text-apple-subtext font-light max-w-xl">
                Descubra oportunidades validadas pela comunidade.
              </p>
            </div>
            <button 
                onClick={() => { if(requireAuth()) setIsIdeaModalOpen(true); }}
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-medium flex items-center gap-2 shadow-lg shadow-black/10 transition-all transform hover:scale-105 text-sm"
            >
                <Lightbulb className="w-4 h-4" /> Nova Ideia
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            {/* LEFT SIDEBAR (FILTERS) */}
            <aside className="lg:col-span-1 space-y-8 sticky top-24">
                {/* Search */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pesquisar</label>
                    <div className="relative group">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5 group-focus-within:text-apple-blue transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Palavras-chave..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3.5 text-gray-300 hover:text-gray-500"
                            >
                                <XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtros</label>
                    <button 
                        onClick={() => { if(requireAuth()) { setShowFavoritesOnly(!showFavoritesOnly); setShowMyIdeasOnly(false); } }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${showFavoritesOnly ? 'bg-white border-apple-blue shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'}`}
                    >
                        <span className={`flex items-center gap-2 text-sm font-medium ${showFavoritesOnly ? 'text-apple-blue' : 'text-gray-600'}`}>
                            <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-apple-blue' : ''}`} /> Meus Favoritos
                        </span>
                        {showFavoritesOnly && <span className="w-2 h-2 rounded-full bg-apple-blue"></span>}
                    </button>
                </div>

                {/* Meus Projetos (My Content) Section */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Meus Projetos</label>
                    <button 
                        onClick={() => { if(requireAuth()) { setShowMyIdeasOnly(!showMyIdeasOnly); setShowFavoritesOnly(false); setSelectedNiche('Todos'); } }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${showMyIdeasOnly ? 'bg-white border-apple-blue shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-200'}`}
                    >
                        <span className={`flex items-center gap-2 text-sm font-medium ${showMyIdeasOnly ? 'text-apple-blue' : 'text-gray-600'}`}>
                            <User className="w-4 h-4" /> Minhas Publicações
                        </span>
                        {showMyIdeasOnly && <span className="w-2 h-2 rounded-full bg-apple-blue"></span>}
                    </button>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Categorias</label>
                    <div className="flex flex-col gap-1">
                        {niches.map(niche => (
                        <button
                            key={niche}
                            onClick={() => { setSelectedNiche(niche); setShowMyIdeasOnly(false); }}
                            className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all text-left ${
                            selectedNiche === niche 
                                ? 'bg-white text-black font-semibold shadow-sm' 
                                : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
                            }`}
                        >
                            {niche}
                            {selectedNiche === niche && <div className="w-1.5 h-1.5 rounded-full bg-black"></div>}
                        </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT (RESULTS) */}
            <main className="lg:col-span-3 space-y-6">
                
                {/* Controls Bar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-sm text-gray-500 font-medium pl-2">
                        Mostrando <strong>{filteredIdeas.length}</strong> resultados
                        {showMyIdeasOnly && <span className="ml-2 px-2 py-0.5 bg-blue-50 text-apple-blue text-xs rounded-full border border-blue-100">Meus Projetos</span>}
                    </span>
                    
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative group flex-grow sm:flex-grow-0">
                            <button className="flex items-center justify-between w-full sm:w-40 gap-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors">
                                {sortBy === 'newest' ? 'Mais Recentes' : 'Mais Votados'}
                                <ChevronDown className="w-3 h-3" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden hidden group-hover:block z-20">
                                <button onClick={() => setSortBy('newest')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${sortBy === 'newest' ? 'font-bold text-apple-blue' : 'text-gray-600'}`}>Mais Recentes</button>
                                <button onClick={() => setSortBy('votes')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 ${sortBy === 'votes' ? 'font-bold text-apple-blue' : 'text-gray-600'}`}>Mais Votados</button>
                            </div>
                        </div>

                        <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
                        
                        <div className="bg-gray-50 p-1 rounded-lg flex items-center">
                            <button onClick={() => setIdeasViewMode('grid')} className={`p-1.5 rounded-md transition-all ${ideasViewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => setIdeasViewMode('list')} className={`p-1.5 rounded-md transition-all ${ideasViewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-gray-600'}`}><ListIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className={`gap-6 ${ideasViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3' : 'flex flex-col space-y-4'}`}>
                    {filteredIdeas.map(idea => (
                    <IdeaCard 
                        key={idea.id} 
                        idea={idea} 
                        onUpvote={handleUpvote} 
                        onToggleBuild={handleToggleBuild} 
                        onToggleFavorite={handleToggleFavorite}
                        onDelete={handleDeleteIdea}
                        viewMode={ideasViewMode}
                        onClick={(i) => setSelectedIdea(i)}
                        currentUserId={session?.user?.id}
                    />
                    ))}
                    {filteredIdeas.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Nenhum resultado encontrado</h3>
                        <p className="text-gray-500 max-w-xs mt-2">
                            {dbError && dbError.includes("Tabelas não encontradas") 
                                ? "O banco de dados está vazio (tabelas deletadas)."
                                : (showMyIdeasOnly ? "Você ainda não cadastrou nenhuma ideia." : "Tente ajustar seus filtros ou buscar por outro termo.")}
                        </p>
                        <button onClick={() => {setSearchQuery(''); setSelectedNiche('Todos'); setShowFavoritesOnly(false); setShowMyIdeasOnly(false);}} className="mt-6 text-apple-blue font-medium hover:underline">Limpar filtros</button>
                    </div>
                    )}
                </div>
            </main>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={(id) => setViewState({ type: 'PROJECT_DETAIL', projectId: id })} 
              />
            ))}
            {projects.length === 0 && (
                 <div className="col-span-full text-center py-20 text-gray-400">
                     <div className="mb-2">Nenhum projeto encontrado.</div>
                     {dbError && <div className="text-xs opacity-70">(Verifique a conexão com o banco)</div>}
                 </div>
            )}
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

  // ================= RENDER MAIN =================

  if (viewState.type === 'LANDING') {
      return (
          <>
             <LandingPage 
                onEnter={() => {
                    if (session) {
                        setViewState({ type: 'IDEAS' });
                    } else {
                        setIsAuthModalOpen(true);
                    }
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

      <IdeaDetailModal
        idea={selectedIdea}
        onClose={() => setSelectedIdea(null)}
        onUpvote={handleUpvote}
        onToggleBuild={handleToggleBuild}
        onToggleFavorite={handleToggleFavorite}
      />

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  );
};

export default App;
