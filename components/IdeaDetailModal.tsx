
import React, { useState } from 'react';
import { Idea, Improvement } from '../types';
import ShareButton from './ShareButton';
import RequestPixModal from './modals/RequestPixModal';
import { PurchaseModal } from './modals/PurchaseModal';
import { supabase } from '../lib/supabaseClient';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  DollarSign, 
  Users, 
  Flame,
  Heart,
  Calendar,
  Lightbulb,
  Activity, 
  PawPrint, 
  GraduationCap, 
  Scale, 
  Code2, 
  Palette, 
  ShoppingCart, 
  Rocket,
  Briefcase,
  Tractor,
  Plane,
  Utensils,
  Truck,
  FileCode,
  Lock,
  Send,
  Loader2,
  Gift,
  CheckCircle,
  Unlock,
  User,
  MessageSquarePlus,
  Hash,
  Star,
  Reply,
  EyeOff,
  Target,
  Megaphone,
  ExternalLink,
  Youtube,
  Edit
} from 'lucide-react';

interface IdeaDetailModalProps {
  idea: Idea | null;
  currentUserId?: string;
  currentUserData?: { name: string; avatar?: string };
  onClose: () => void;
  onUpvote: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRequestPdr: (ideaId: string, ownerId: string, ideaTitle: string, message: string) => Promise<void>;
  onJoinTeam?: (ideaId: string) => Promise<void>; 
  onAddImprovement?: (ideaId: string, content: string, parentId?: string) => Promise<void>;
  refreshData: () => void;
  onPromoteIdea?: (idea: Idea) => void;
}

const getNicheVisuals = (niche: string) => {
    const n = niche.toLowerCase();
    if (n.includes('finan') || n.includes('money') || n.includes('banc')) return { icon: DollarSign, bg: 'bg-emerald-100', text: 'text-emerald-600' };
    if (n.includes('saúde') || n.includes('med') || n.includes('health') || n.includes('bem-estar')) return { icon: Activity, bg: 'bg-rose-100', text: 'text-rose-600' };
    if (n.includes('pet') || n.includes('dog') || n.includes('cat') || n.includes('vet')) return { icon: PawPrint, bg: 'bg-orange-100', text: 'text-orange-600' };
    if (n.includes('educa') || n.includes('ensino') || n.includes('escol')) return { icon: GraduationCap, bg: 'bg-blue-100', text: 'text-blue-600' };
    if (n.includes('produt') || n.includes('task') || n.includes('gestão')) return { icon: Zap, bg: 'bg-yellow-100', text: 'text-yellow-600' };
    if (n.includes('juríd') || n.includes('lei') || n.includes('advoga')) return { icon: Scale, bg: 'bg-slate-100', text: 'text-slate-600' };
    if (n.includes('agro') || n.includes('fazenda')) return { icon: Tractor, bg: 'bg-green-100', text: 'text-green-700' };
    if (n.includes('dev') || n.includes('code') || n.includes('ia') || n.includes('tech')) return { icon: Code2, bg: 'bg-indigo-100', text: 'text-indigo-600' };
    if (n.includes('market') || n.includes('venda')) return { icon: Rocket, bg: 'bg-purple-100', text: 'text-purple-600' };
    if (n.includes('creator') || n.includes('video') || n.includes('design')) return { icon: Palette, bg: 'bg-pink-100', text: 'text-pink-600' };
    if (n.includes('commerce') || n.includes('loja')) return { icon: ShoppingCart, bg: 'bg-sky-100', text: 'text-sky-600' };
    if (n.includes('rh') || n.includes('recursos')) return { icon: Briefcase, bg: 'bg-teal-100', text: 'text-teal-600' };
    if (n.includes('imob') || n.includes('casa')) return { icon: Briefcase, bg: 'bg-amber-100', text: 'text-amber-600' };
    if (n.includes('aliment') || n.includes('food')) return { icon: Utensils, bg: 'bg-red-50', text: 'text-red-500' };
    if (n.includes('logíst') || n.includes('transp')) return { icon: Truck, bg: 'bg-cyan-100', text: 'text-cyan-600' };
    if (n.includes('turism') || n.includes('viage')) return { icon: Plane, bg: 'bg-blue-50', text: 'text-blue-500' };
    return { icon: Lightbulb, bg: 'bg-gray-100', text: 'text-gray-500' };
}

const getYoutubeId = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const CommentThread: React.FC<{ 
    comment: Improvement, 
    depth: number, 
    onReply: (parentId: string, content: string) => void,
    currentUserId?: string
}> = ({ comment, depth, onReply, currentUserId }) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    const handleSubmitReply = (e: React.FormEvent) => {
        e.preventDefault();
        if(replyContent.trim()) {
            onReply(comment.id, replyContent);
            setReplyContent('');
            setIsReplying(false);
        }
    };

    return (
        <div className={`relative ${depth > 0 ? 'ml-6 pl-4 border-l-2 border-gray-100 mt-3' : 'mt-4 border-b border-gray-50 pb-4'}`}>
             <div className="flex items-start gap-3">
                 <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                     {comment.profiles?.avatar_url ? (
                         <img src={comment.profiles.avatar_url} className="w-full h-full object-cover"/>
                     ) : (
                         <User className="w-4 h-4 m-2 text-gray-400"/>
                     )}
                 </div>
                 <div className="flex-grow">
                     <div className="flex items-center gap-2 mb-1">
                         <span className="text-sm font-bold text-gray-700">{comment.profiles?.full_name || 'Anônimo'}</span>
                         <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                     </div>
                     <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                     
                     {depth < 2 && currentUserId && (
                         <button 
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-xs font-semibold text-gray-400 hover:text-apple-blue mt-2 flex items-center gap-1"
                         >
                             <Reply className="w-3 h-3" /> Responder
                         </button>
                     )}

                     {isReplying && (
                         <form onSubmit={handleSubmitReply} className="mt-2 flex gap-2 animate-in fade-in">
                             <input 
                                type="text" 
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                className="flex-grow bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-apple-blue outline-none"
                                placeholder="Escreva sua resposta..."
                                autoFocus
                             />
                             <button type="submit" className="bg-black text-white px-3 py-2 rounded-lg text-xs font-bold">Enviar</button>
                         </form>
                     )}
                 </div>
             </div>
             {comment.replies && comment.replies.map(reply => (
                 <CommentThread 
                    key={reply.id} 
                    comment={reply} 
                    depth={depth + 1} 
                    onReply={onReply}
                    currentUserId={currentUserId}
                 />
             ))}
        </div>
    );
};

const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({ 
  idea, 
  currentUserId,
  currentUserData = { name: 'Usuário' },
  onClose, 
  onUpvote, 
  onToggleFavorite,
  onRequestPdr,
  onJoinTeam,
  onAddImprovement,
  refreshData,
  onPromoteIdea
}) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [newImprovement, setNewImprovement] = useState('');
  const [submittingImprovement, setSubmittingImprovement] = useState(false);

  // Payment States
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'donation' | 'purchase'>('donation');
  const [donationAmount, setDonationAmount] = useState<number>(0);
  const [creatorPixData, setCreatorPixData] = useState<any>(null);
  const [showRequestPixModal, setShowRequestPixModal] = useState(false);

  if (!idea) return null;

  const isUnlocked = idea?.user_id === currentUserId || 
                     idea?.idea_transactions?.some(t => t.user_id === currentUserId && t.status === 'confirmed' && t.transaction_type === 'purchase');

  const imageToUse = idea.is_showroom ? idea.showroom_image : (idea.images?.[0]);
  const displayImage = activeImage || imageToUse;
  const youtubeId = idea.showroom_video_url ? getYoutubeId(idea.showroom_video_url) : null;
  const hasImages = !!displayImage;

  const visuals = getNicheVisuals(idea.niche);
  const VisualIcon = visuals.icon;
  const isOwner = currentUserId && idea.user_id === currentUserId;
  const isPaidContent = idea.payment_type === 'paid';
  const isHidden = (field: string) => isPaidContent && idea.hidden_fields?.includes(field) && !isUnlocked && !isOwner;
  const creatorName = idea.creator_name || idea.profiles?.full_name || 'Anônimo';
  const creatorAvatar = idea.creator_avatar || idea.profiles?.avatar_url;

  const organizeThreads = (improvements: Improvement[]) => {
      const map = new Map<string, Improvement>();
      const roots: Improvement[] = [];
      improvements.forEach(imp => map.set(imp.id, { ...imp, replies: [] }));
      improvements.forEach(imp => {
          if (imp.parent_id && map.has(imp.parent_id!)) {
              map.get(imp.parent_id!)!.replies!.push(map.get(imp.id)!);
          } else if (!imp.parent_id) {
              roots.push(map.get(imp.id)!);
          }
      });
      return roots;
  };
  
  const commentThreads = organizeThreads(idea.idea_improvements || []);

  const handleJoin = async () => {
      if (!onJoinTeam) return;
      try { await onJoinTeam(idea.id); } catch (error) { console.error(error); }
  };

  const submitImprovement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newImprovement.trim() || !onAddImprovement) return;
      setSubmittingImprovement(true);
      try { await onAddImprovement(idea.id, newImprovement); setNewImprovement(''); } 
      catch (error) { alert("Erro ao enviar melhoria."); } 
      finally { setSubmittingImprovement(false); }
  };

  const handleReply = async (parentId: string, content: string) => {
      if(!onAddImprovement) return;
      try { await onAddImprovement(idea.id, content, parentId); } 
      catch (error) { console.error(error); }
  };

  const handleInitiatePayment = async (type: 'donation' | 'purchase') => {
      if (!idea.user_id) return;
      
      let amount = 0;
      if (type === 'donation') {
          const val = prompt("Qual valor você deseja doar? (Ex: 10.00)");
          if (!val) return;
          amount = parseFloat(val);
          if (isNaN(amount) || amount <= 0) {
              alert("Valor inválido");
              return;
          }
          setDonationAmount(amount);
      } else {
          amount = idea.price || 0;
      }

      const { data: creatorProfile } = await supabase.from('profiles').select('*').eq('id', idea.user_id).single();
      
      if (!creatorProfile || !creatorProfile.pix_key) {
          setShowRequestPixModal(true);
          return;
      }

      setCreatorPixData({
          key: creatorProfile.pix_key,
          type: creatorProfile.pix_key_type,
          beneficiary: creatorProfile.pix_name || creatorProfile.full_name,
          bank: creatorProfile.pix_bank
      });
      setPurchaseType(type);
      setDonationAmount(amount);
      setShowPurchaseModal(true);
  };

  const renderLockedContent = (label: string) => (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden h-full min-h-[160px]">
          <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100"><Lock className="w-5 h-5 text-gray-400" /></div>
          <div><h4 className="font-bold text-gray-700 text-sm">Conteúdo Bloqueado</h4><p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">Adquira o projeto para ver {label}.</p></div>
          <button onClick={() => handleInitiatePayment('purchase')} className="mt-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-black/10 flex items-center gap-2"><Unlock className="w-3 h-3" /> Desbloquear</button>
      </div>
  );

  const supporters = idea.idea_transactions?.filter(t => t.transaction_type === 'donation' && t.status === 'confirmed') || [];
  const buyers = idea.idea_transactions?.filter(t => t.transaction_type === 'purchase' && t.status === 'confirmed') || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] border border-gray-200/50 relative overflow-hidden">
        
        {/* Header */}
        <div className={`h-48 w-full relative ${hasImages ? 'bg-gray-900' : visuals.bg}`}>
            {hasImages ? ( <img src={displayImage!} alt="Cover" className="w-full h-full object-cover opacity-80" /> ) : ( <div className="w-full h-full flex items-center justify-center"><VisualIcon className={`w-16 h-16 ${visuals.text} opacity-50`} /></div> )}
            <button onClick={onClose} className="absolute top-4 right-4 bg-black/90 p-2 rounded-full text-white hover:bg-black transition-colors z-20 shadow-lg border border-white/20"><X className="w-5 h-5" /></button>
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
            <div className="absolute top-4 left-4 flex gap-2">
                 <span className="bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">{idea.niche}</span>
                 {idea.short_id && <span className="bg-black/80 backdrop-blur-md text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border border-white/10"><Hash className="w-3 h-3 text-gray-400" />{idea.short_id.toUpperCase()}</span>}
                 {idea.is_showroom && idea.showroom_objective && (
                     <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 backdrop-blur-md ${idea.showroom_objective === 'feedback' ? 'bg-indigo-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                         {idea.showroom_objective === 'feedback' ? <Target className="w-3 h-3" /> : <Megaphone className="w-3 h-3" />}
                         {idea.showroom_objective === 'feedback' ? 'Quero Feedback' : 'Showcase'}
                     </span>
                 )}
            </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto custom-scrollbar bg-white relative -mt-10 z-10 rounded-t-3xl">
            <div className="p-8 pb-32">
                 <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    <div className="flex-grow">
                        <div className="flex justify-between items-start">
                             <h2 className="text-4xl font-bold text-apple-text mb-2 leading-tight">{idea.title}</h2>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                             <div className="flex items-center gap-1.5">
                                <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden">{creatorAvatar ? <img src={creatorAvatar} className="w-full h-full object-cover"/> : <User className="w-3 h-3 m-1.5 text-gray-400"/>}</div>
                                <span className="font-medium text-gray-700">{creatorName}</span>
                             </div>
                             <span>•</span>
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(idea.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <ShareButton idea={idea} variant="card" />
                         <button onClick={() => onUpvote(idea.id)} disabled={idea.hasVoted} className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border transition-all flex-shrink-0 ${idea.hasVoted ? 'bg-orange-100 border-orange-200 text-orange-600 cursor-default' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-orange-500 hover:bg-white hover:shadow-md'}`}>
                            <Flame className={`w-6 h-6 ${idea.hasVoted ? 'fill-orange-500' : ''}`} /><span className="text-sm font-bold mt-0.5">{idea.votes_count}</span><span className="text-[9px] font-semibold uppercase mt-0.5">{idea.hasVoted ? 'Votado' : 'Votar'}</span>
                        </button>
                    </div>
                 </div>

                 {youtubeId && (
                     <div className="mb-10 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Youtube className="w-5 h-5 text-red-600" />
                            <h3 className="text-lg font-bold text-gray-900">Demo do Projeto</h3>
                        </div>
                        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg border border-gray-100">
                             <iframe 
                                width="100%" 
                                height="100%" 
                                src={`https://www.youtube.com/embed/${youtubeId}`} 
                                title="YouTube video player" 
                                frameBorder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowFullScreen
                             ></iframe>
                        </div>
                     </div>
                 )}

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                     <div className="lg:col-span-2 space-y-12">
                         
                         <div className="space-y-8">
                             {idea.is_showroom && idea.showroom_description && (
                                 <div>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Rocket className="w-4 h-4" /> Sobre o Projeto</h3>
                                    <p className="text-lg text-gray-800 leading-relaxed font-light whitespace-pre-wrap">{idea.showroom_description}</p>
                                 </div>
                             )}

                             {!idea.is_showroom && (
                                 <>
                                    <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> O Problema</h3>{isHidden('pain') ? renderLockedContent('A Dor') : (<p className="text-lg text-gray-800 leading-relaxed font-light">{idea.pain}</p>)}</div>
                                    <div><h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> A Solução</h3>{isHidden('solution') ? renderLockedContent('A Solução') : (<p className="text-lg text-gray-800 leading-relaxed font-light">{idea.solution}</p>)}</div>
                                 </>
                             )}
                         </div>

                         {!idea.is_showroom && (
                             <div><h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2"><FileCode className="w-4 h-4" /> Tech Specs (PDR)</h3>{isHidden('pdr') ? renderLockedContent('o PDR Completo') : (<div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>{idea.pdr || "// Nenhum detalhe técnico fornecido."}</div>)}</div>
                         )}

                         <div className="pt-8 border-t border-gray-100">
                             <h3 className="text-lg font-bold text-apple-text mb-6 flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-gray-400" /> {idea.is_showroom ? 'Feedback & Comentários' : 'Dúvidas & Sugestões'} ({idea.idea_improvements?.length || 0})</h3>
                             <div className="space-y-2 mb-8">{commentThreads.length === 0 && (<div className="text-gray-400 text-sm italic bg-gray-50 p-6 rounded-xl text-center border border-dashed border-gray-200">Nenhum comentário ainda. Seja o primeiro a colaborar!</div>)}{commentThreads.map((thread) => ( <CommentThread key={thread.id} comment={thread} depth={0} onReply={handleReply} currentUserId={currentUserId} /> ))}</div>
                             <form onSubmit={submitImprovement} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl border border-gray-200"><div className="flex-grow relative"><textarea required value={newImprovement} onChange={(e) => setNewImprovement(e.target.value)} placeholder={idea.is_showroom ? "Deixe seu feedback para o criador..." : "Sugira uma feature ou deixe seu feedback..."} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-apple-blue outline-none transition-all resize-none h-24"></textarea></div><button type="submit" disabled={submittingImprovement || !newImprovement.trim()} className="bg-black hover:bg-gray-800 text-white p-3 rounded-xl shadow-lg shadow-black/10 transition-all disabled:opacity-50">{submittingImprovement ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}</button></form>
                         </div>
                     </div>

                     <div className="space-y-8">
                         <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200 space-y-4 shadow-sm">
                             {idea.showroom_link && (
                                 <a 
                                    href={idea.showroom_link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="w-full bg-apple-blue hover:bg-apple-blueHover text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
                                 >
                                     <ExternalLink className="w-4 h-4" /> Acessar Projeto
                                 </a>
                             )}
                            
                             {isOwner && onPromoteIdea && (
                                <button 
                                    onClick={() => onPromoteIdea(idea)}
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
                                >
                                    <Edit className="w-4 h-4" /> {idea.is_showroom ? 'Editar Detalhes' : 'Promover para Showroom'}
                                </button>
                             )}

                             <button onClick={() => onToggleFavorite(idea.id)} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${idea.isFavorite ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}><Heart className={`w-4 h-4 ${idea.isFavorite ? 'fill-red-600' : ''}`} /> {idea.isFavorite ? 'Favoritado' : 'Favoritar Projeto'}</button>
                             
                             {!isOwner && idea.payment_type === 'donation' && ( <button onClick={() => handleInitiatePayment('donation')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"><Gift className="w-4 h-4" /> Quero Doar</button> )}
                             {!isOwner && idea.payment_type === 'paid' && !isUnlocked && ( <button onClick={() => handleInitiatePayment('purchase')} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Comprar Acesso (R$ {idea.price})</button> )}
                             
                             <div className="pt-4 mt-4 border-t border-gray-200">
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">Interessados ({idea.idea_interested?.length || 0})</h4>
                                <div className="flex -space-x-2 mb-4 overflow-hidden py-1">{idea.idea_interested && idea.idea_interested.length > 0 ? (idea.idea_interested.slice(0, 5).map((user) => (<div key={user.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-200 overflow-hidden relative group/avatar" title={user.profiles?.full_name}>{user.profiles?.avatar_url ? (<img src={user.profiles.avatar_url} className="w-full h-full object-cover"/>) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-4 h-4"/></div>)}</div>))) : (<span className="text-xs text-gray-400 italic">Seja o primeiro a demonstrar interesse.</span>)}</div>
                                <button onClick={handleJoin} disabled={idea.isInterested} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${idea.isInterested ? 'bg-amber-100 text-amber-700 border-amber-200 cursor-default' : 'bg-amber-400 hover:bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20'}`}>{idea.isInterested ? (<><CheckCircle className="w-4 h-4" /> Interesse Enviado</>) : (<><Star className="w-4 h-4" /> Tenho Interesse</>)}</button>
                             </div>
                         </div>
                         {(supporters.length > 0 || buyers.length > 0) && (<div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm"><h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Comunidade Apoiadora</h4><div className="space-y-4">{buyers.map(t => (<div key={t.id} className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200">{t.profiles?.avatar_url ? <img src={t.profiles.avatar_url} className="w-full h-full rounded-full object-cover"/> : <DollarSign className="w-4 h-4" />}</div><div><p className="text-xs font-bold text-gray-800">{t.profiles?.full_name}</p><p className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded inline-block">Comprador</p></div></div>))}{supporters.map(t => (<div key={t.id} className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">{t.profiles?.avatar_url ? <img src={t.profiles.avatar_url} className="w-full h-full rounded-full object-cover"/> : <Gift className="w-4 h-4" />}</div><div><p className="text-xs font-bold text-gray-800">{t.profiles?.full_name}</p><p className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded inline-block">Apoiador</p></div></div>))}</div></div>)}

                         <div className="border-t border-gray-100 pt-6 space-y-4">
                             <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modelo de Receita</label><p className="font-semibold text-gray-800 flex items-center gap-2 mt-1"><DollarSign className="w-4 h-4 text-green-600" /> {idea.pricing_model}</p></div>
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diferencial</label>
                                 {idea.why_is_private && !isOwner ? (
                                     <p className="text-sm text-gray-400 italic mt-1 flex items-center gap-1 bg-gray-50 p-2 rounded-lg border border-gray-100"><EyeOff className="w-3 h-3"/> Oculto pelo criador</p>
                                 ) : (
                                     <p className="text-sm text-gray-600 italic mt-1 leading-relaxed">"{idea.why}"</p>
                                 )}
                             </div>
                         </div>
                     </div>
                 </div>
            </div>
        </div>
        
        {showPurchaseModal && creatorPixData && currentUserId && (
             <PurchaseModal 
                isOpen={showPurchaseModal}
                onClose={() => { setShowPurchaseModal(false); refreshData(); }}
                ideaId={idea.id}
                userId={currentUserId}
                amount={donationAmount}
                type={purchaseType}
                creatorPix={creatorPixData}
             />
        )}

        <RequestPixModal 
            isOpen={showRequestPixModal} 
            onClose={() => setShowRequestPixModal(false)}
            creatorId={idea.user_id!}
            creatorName={creatorName}
            ideaId={idea.id}
            ideaTitle={idea.title}
            currentUserId={currentUserId!}
            currentUserData={currentUserData}
        />
      </div>
    </div>
  );
};

export default IdeaDetailModal;
