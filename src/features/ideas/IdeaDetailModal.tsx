
import React, { useState, useEffect } from 'react';
import { Idea, Improvement } from '../../types';
import ShareButton from '../../components/ui/ShareButton';
import RequestPixModal from '../../components/ui/RequestPixModal';
import { PurchaseModal } from '../../components/ui/PurchaseModal';
import { supabase } from '../../lib/supabaseClient';
import { YouTubePreview, getYouTubeVideoId } from '../../components/ui/YouTubePreview'; // Importação centralizada
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
    Edit,
    Info,
    Copy,
    Check,
    Image as ImageIcon,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    Play
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

// Componente Helper para Tooltips
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
    <div className="group relative inline-flex items-center ml-2 align-middle z-50">
        <Info className="w-4 h-4 text-gray-300 cursor-help hover:text-apple-blue transition-colors" />
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
            <div className="bg-gray-900/95 backdrop-blur-sm text-white text-[11px] font-medium py-2.5 px-3.5 rounded-xl shadow-xl border border-white/10 relative leading-relaxed text-center">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></div>
            </div>
        </div>
    </div>
);

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
        if (replyContent.trim()) {
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
                        <img src={comment.profiles.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-4 h-4 m-2 text-gray-400" />
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
    const [newImprovement, setNewImprovement] = useState('');
    const [submittingImprovement, setSubmittingImprovement] = useState(false);
    const [pdrCopied, setPdrCopied] = useState(false);
    const [showDemoData, setShowDemoData] = useState(false);

    // Payment States
    const [showPurchaseModal, setShowPurchaseModal] = useState(false);
    const [purchaseType, setPurchaseType] = useState<'donation' | 'purchase'>('donation');
    const [donationAmount, setDonationAmount] = useState<number>(0);
    const [creatorPixData, setCreatorPixData] = useState<any>(null);
    const [showRequestPixModal, setShowRequestPixModal] = useState(false);

    // Gallery States
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Combine showroom image and additional images into one gallery array
    const galleryImages = React.useMemo(() => {
        if (!idea) return [];
        const imgs = [
            idea.showroom_image,
            ...(idea.images || [])
        ].filter(img => img && img.length > 5); // Basic filter for valid strings
        return Array.from(new Set(imgs)); // Dedup
    }, [idea]);

    if (!idea) return null;

    const hasImages = galleryImages.length > 0;
    const displayImage = galleryImages[0]; // Main cover is first image

    const isUnlocked = idea?.user_id === currentUserId ||
        idea?.idea_transactions?.some(t => t.user_id === currentUserId && t.status === 'confirmed' && t.transaction_type === 'purchase');

    // Priority: 1) New standard field, 2) Showroom, 3) Legacy
    const rawVideoUrl = idea.youtube_url || idea.showroom_video_url || idea.youtube_video_url;
    const youtubeId = getYouTubeVideoId(rawVideoUrl || '');

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
        try {
            await onAddImprovement(idea.id, newImprovement);
            setNewImprovement('');
            // Refresh data to show new comment
            if (refreshData) refreshData();
        }
        catch (error) { alert("Erro ao enviar melhoria."); }
        finally { setSubmittingImprovement(false); }
    };

    const handleReply = async (parentId: string, content: string) => {
        if (!onAddImprovement) return;
        try { await onAddImprovement(idea.id, content, parentId); }
        catch (error) { console.error(error); }
    };

    const handleCopyPdr = () => {
        if (idea.pdr) {
            navigator.clipboard.writeText(idea.pdr);
            setPdrCopied(true);
            setTimeout(() => setPdrCopied(false), 2000);
        }
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

    const openGallery = (index: number = 0) => {
        setCurrentImageIndex(index);
        setIsGalleryOpen(true);
    };

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    const openVideo = () => {
        if (youtubeId) {
            window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] border border-gray-200/50 relative overflow-hidden">

                {/* Header Cover */}
                <div
                    className={`h-48 w-full relative cursor-pointer group/header ${hasImages ? 'bg-gray-900' : visuals.bg}`}
                    onClick={() => hasImages && openGallery(0)}
                >
                    {hasImages ? (
                        <img src={displayImage!} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover/header:opacity-100 transition-opacity" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center"><VisualIcon className={`w-16 h-16 ${visuals.text} opacity-50`} /></div>
                    )}

                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 bg-black/50 backdrop-blur-md p-2 rounded-full text-white hover:bg-black transition-colors z-20 border border-white/10 hover:scale-105"><X className="w-5 h-5" /></button>

                    {/* Gradient Overlay */}
                    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-white via-white/60 to-transparent"></div>

                    {/* Gallery Button */}
                    {hasImages && galleryImages.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); openGallery(0); }}
                            className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20 hover:bg-black/80 transition-all flex items-center gap-2 z-20"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            Ver todas as fotos ({galleryImages.length})
                        </button>
                    )}

                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                        <span className="bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-200/50">{idea.niche}</span>
                        {idea.short_id && <span className="bg-black/80 backdrop-blur-md text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border border-white/10"><Hash className="w-3 h-3 text-gray-400" />{idea.short_id.toUpperCase()}</span>}
                    </div>
                </div>

                {/* Content Body */}
                <div className="flex-grow overflow-y-auto custom-scrollbar bg-white relative -mt-6 z-10 rounded-t-3xl">
                    <div className="p-8 pb-32">
                        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                            <div className="flex-grow">
                                <div className="flex justify-between items-start">
                                    <h2 className="text-4xl font-bold text-apple-text mb-2 leading-tight">{idea.title}</h2>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 overflow-hidden">{creatorAvatar ? <img src={creatorAvatar} className="w-full h-full object-cover" /> : <User className="w-3 h-3 m-1.5 text-gray-400" />}</div>
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

                        {/* Gallery Thumbnails Strip & Video Card */}
                        {(galleryImages.length > 0 || youtubeId) && (
                            <div className="flex gap-3 overflow-x-auto pb-4 mb-6 custom-scrollbar">

                                {youtubeId && (
                                    <div
                                        onClick={openVideo}
                                        className="h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-all relative bg-black group shadow-sm hover:shadow-md"
                                        title="Assistir Vídeo (Abre em nova janela)"
                                    >
                                        <img
                                            src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                                            className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity"
                                            alt="Video Thumbnail"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                                            </div>
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[7px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border border-white/10 flex items-center gap-1">
                                            <ExternalLink className="w-2 h-2" /> Vídeo
                                        </div>
                                    </div>
                                )}

                                {galleryImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => openGallery(idx)}
                                        className="h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity relative"
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                        {idx === galleryImages.length - 1 && galleryImages.length > 5 && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xs">
                                                +{galleryImages.length - 5}
                                            </div>
                                        )}
                                    </div>
                                ))}
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
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <AlertCircle className="w-4 h-4" /> A Dor Específica (O Problema)
                                                    <InfoTooltip text="Qual dor ou dificuldade os clientes enfrentam no dia a dia que este produto vai resolver?" />
                                                </h3>
                                                {isHidden('pain') ? renderLockedContent('A Dor') : (<p className="text-lg text-gray-800 leading-relaxed font-light">{idea.pain}</p>)}
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4" /> A Solução (O Produto)
                                                    <InfoTooltip text="Como este produto elimina o problema dos clientes de forma simples e eficaz?" />
                                                </h3>
                                                {isHidden('solution') ? renderLockedContent('A Solução') : (<p className="text-lg text-gray-800 leading-relaxed font-light">{idea.solution}</p>)}
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Lightbulb className="w-4 h-4" /> Por que é um bom Micro SaaS (Descrição)?
                                                    <InfoTooltip text="Por que o churn é baixo? Por que o MVP é simples? Por que o valor é percebido rápido?" />
                                                </h3>
                                                {isHidden('why') ? renderLockedContent('o Diferencial') : (
                                                    idea.why_is_private && !isOwner ? (
                                                        <p className="text-sm text-gray-400 italic mt-1 flex items-center gap-1 bg-gray-50 p-2 rounded-lg border border-gray-100"><EyeOff className="w-3 h-3" /> Oculto pelo criador</p>
                                                    ) : (
                                                        <p className="text-lg text-gray-800 leading-relaxed font-light">{idea.why}</p>
                                                    )
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* VIDEO APRESENTAÇÃO */}
                                    {youtubeId && (
                                        <div className="mt-6">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                <Youtube className="w-4 h-4 text-red-500" /> Apresentação em Vídeo
                                            </h3>
                                            <YouTubePreview url={rawVideoUrl} />
                                        </div>
                                    )}
                                </div>

                                {!idea.is_showroom && (
                                    <div>
                                        <div className="flex justify-between items-end mb-3">
                                            <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                                <FileCode className="w-4 h-4" /> Briefing Técnico (PRD)
                                                <InfoTooltip text="É o documento que explica a ideia do Micro SaaS, as funcionalidades, as regras e como a IA deve agir,  tudo de forma organizada para que a ferramenta consiga criar o produto corretamente." />
                                            </h3>
                                            {!isHidden('pdr') && idea.pdr && (
                                                <button
                                                    onClick={handleCopyPdr}
                                                    className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200 px-2 py-1 rounded-md ${pdrCopied ? 'bg-green-100 text-green-700' : 'text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800'}`}
                                                    title="Copiar Texto Completo"
                                                >
                                                    {pdrCopied ? <><Check className="w-3.5 h-3.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5" /> Copiar</>}
                                                </button>
                                            )}
                                        </div>
                                        {isHidden('pdr') ? renderLockedContent('o PRD Completo') : (<div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner relative overflow-hidden"><div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>{idea.pdr || "// Nenhum detalhe técnico fornecido."}</div>)}
                                    </div>
                                )}

                                <div className="pt-8 border-t border-gray-100">
                                    <h3 className="text-lg font-bold text-apple-text mb-6 flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-gray-400" /> {idea.is_showroom ? 'Feedback & Comentários' : 'Dúvidas & Sugestões'} ({idea.idea_improvements?.length || 0})</h3>
                                    <div className="space-y-2 mb-8">{commentThreads.length === 0 && (<div className="text-gray-400 text-sm italic bg-gray-50 p-6 rounded-xl text-center border border-dashed border-gray-200">Nenhum comentário ainda. Seja o primeiro a colaborar!</div>)}{commentThreads.map((thread) => (<CommentThread key={thread.id} comment={thread} depth={0} onReply={handleReply} currentUserId={currentUserId} />))}</div>
                                    <form onSubmit={submitImprovement} className="flex gap-3 items-start bg-gray-50 p-4 rounded-2xl border border-gray-200"><div className="flex-grow relative"><textarea required value={newImprovement} onChange={(e) => setNewImprovement(e.target.value)} placeholder={idea.is_showroom ? "Deixe seu feedback para o criador..." : "Sugira uma feature ou deixe seu feedback..."} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:border-apple-blue outline-none transition-all resize-none h-24"></textarea></div><button type="submit" disabled={submittingImprovement || !newImprovement.trim()} className="bg-black hover:bg-gray-800 text-white p-3 rounded-xl shadow-lg shadow-black/10 transition-all disabled:opacity-50">{submittingImprovement ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}</button></form>
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

                                    {!isOwner && idea.payment_type === 'donation' && (<button onClick={() => handleInitiatePayment('donation')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"><Gift className="w-4 h-4" /> Quero Doar</button>)}
                                    {!isOwner && idea.payment_type === 'paid' && !isUnlocked && (<button onClick={() => handleInitiatePayment('purchase')} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Comprar Acesso (R$ {idea.price})</button>)}

                                    <div className="pt-4 mt-4 border-t border-gray-200">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">Interessados ({idea.idea_interested?.length || 0})</h4>
                                        <div className="flex -space-x-2 mb-4 overflow-hidden py-1">{idea.idea_interested && idea.idea_interested.length > 0 ? (idea.idea_interested.slice(0, 5).map((user) => (<div key={user.id} className="w-8 h-8 rounded-full border-2 border-white shadow-sm bg-gray-200 overflow-hidden relative group/avatar" title={user.profiles?.full_name}>{user.profiles?.avatar_url ? (<img src={user.profiles.avatar_url} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-4 h-4" /></div>)}</div>))) : (<span className="text-xs text-gray-400 italic">Seja o primeiro a demonstrar interesse.</span>)}</div>
                                        <button onClick={handleJoin} disabled={idea.isInterested} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${idea.isInterested ? 'bg-amber-100 text-amber-700 border-amber-200 cursor-default' : 'bg-amber-400 hover:bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20'}`}>{idea.isInterested ? (<><CheckCircle className="w-4 h-4" /> Interesse Enviado</>) : (<><Star className="w-4 h-4" /> Tenho Interesse</>)}</button>
                                    </div>
                                </div>

                                {/* Demo Credentials Box */}
                                {idea.demo_email && (
                                    <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm animate-in fade-in slide-in-from-right hover:shadow-md hover:border-blue-300 transition-all duration-300">
                                        <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                                <Lock className="w-3 h-3" /> Dados de Acesso (Demo)
                                            </h4>
                                            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-mono">Teste Agora</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Email</span>
                                                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 group hover:border-apple-blue/30 transition-all cursor-pointer active:scale-95" onClick={() => navigator.clipboard.writeText(idea.demo_email!)} title="Clique para copiar">
                                                    <span className="text-sm font-mono text-gray-700 flex-grow truncate">{idea.demo_email}</span>
                                                    <Copy className="w-3 h-3 text-gray-400 group-hover:text-apple-blue" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 relative">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase">Senha</span>
                                                <div className={`flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 group hover:border-apple-blue/30 transition-all cursor-pointer active:scale-95 relative ${!showDemoData ? 'select-none' : ''}`} onClick={() => showDemoData && navigator.clipboard.writeText(idea.demo_password!)} title={showDemoData ? "Clique para copiar" : "Revele primeiro"}>
                                                    <span className={`text-sm font-mono text-gray-700 flex-grow truncate ${!showDemoData ? 'blur-sm opacity-50' : ''}`}>
                                                        {idea.demo_password}
                                                    </span>
                                                    {showDemoData && <Copy className="w-3 h-3 text-gray-400 group-hover:text-apple-blue" />}
                                                </div>

                                                {!showDemoData && (
                                                    <div className="absolute top-6 inset-x-0 flex items-center justify-center">
                                                        <button
                                                            onClick={() => setShowDemoData(true)}
                                                            className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-md border border-gray-200 hover:bg-gray-50 transition-all hover:scale-105"
                                                        >
                                                            Revelar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(supporters.length > 0 || buyers.length > 0) && (<div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm"><h4 className="text-xs font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Comunidade Apoiadora</h4><div className="space-y-4">{buyers.map(t => (<div key={t.id} className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 border border-green-200">{t.profiles?.avatar_url ? <img src={t.profiles.avatar_url} className="w-full h-full rounded-full object-cover" /> : <DollarSign className="w-4 h-4" />}</div><div><p className="text-xs font-bold text-gray-800">{t.profiles?.full_name}</p><p className="text-[10px] text-green-600 font-semibold bg-green-50 px-1.5 py-0.5 rounded inline-block">Comprador</p></div></div>))}{supporters.map(t => (<div key={t.id} className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200">{t.profiles?.avatar_url ? <img src={t.profiles.avatar_url} className="w-full h-full rounded-full object-cover" /> : <Gift className="w-4 h-4" />}</div><div><p className="text-xs font-bold text-gray-800">{t.profiles?.full_name}</p><p className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded inline-block">Apoiador</p></div></div>))}</div></div>)}

                                <div className="border-t border-gray-100 pt-6 space-y-4">
                                    <div><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modelo de Receita</label><p className="font-semibold text-gray-800 flex items-center gap-2 mt-1"><DollarSign className="w-4 h-4 text-green-600" /> {idea.pricing_model}</p></div>
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

                {/* LIGHTBOX GALLERY MODAL */}
                {isGalleryOpen && (
                    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in">

                        {/* Toolbar */}
                        <div className="flex justify-between items-center p-6 absolute top-0 left-0 right-0 z-20">
                            <div className="text-white/70 text-sm">
                                {currentImageIndex + 1} / {galleryImages.length}
                            </div>
                            <div className="flex gap-4">
                                {idea.showroom_link && (
                                    <a href={idea.showroom_link} target="_blank" className="text-white hover:text-blue-400 flex items-center gap-2 text-sm font-bold px-4 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                                        <ExternalLink className="w-4 h-4" /> Visitar
                                    </a>
                                )}
                                <button onClick={() => setIsGalleryOpen(false)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/30 transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="flex-grow flex items-center justify-center relative px-4 md:px-16">
                            {galleryImages.length > 1 && (
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    <ChevronLeft className="w-8 h-8" />
                                </button>
                            )}

                            <img
                                src={galleryImages[currentImageIndex]}
                                className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
                                alt={`Gallery ${currentImageIndex}`}
                            />

                            {galleryImages.length > 1 && (
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                                >
                                    <ChevronRight className="w-8 h-8" />
                                </button>
                            )}
                        </div>

                        {/* Thumbnails Strip */}
                        {galleryImages.length > 1 && (
                            <div className="h-24 p-4 flex justify-center gap-3 overflow-x-auto custom-scrollbar bg-black/50">
                                {galleryImages.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentImageIndex(idx)}
                                        className={`relative h-16 w-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${currentImageIndex === idx ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
                                    >
                                        <img src={img} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IdeaDetailModal;
