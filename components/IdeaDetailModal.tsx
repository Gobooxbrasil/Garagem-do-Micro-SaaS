
import React, { useState } from 'react';
import { Idea } from '../types';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  DollarSign, 
  Users, 
  TrendingUp, 
  ArrowBigUp,
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
  Loader2
} from 'lucide-react';

interface IdeaDetailModalProps {
  idea: Idea | null;
  currentUserId?: string;
  onClose: () => void;
  onUpvote: (id: string) => void;
  onToggleBuild: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRequestPdr: (ideaId: string, ownerId: string, ideaTitle: string, message: string) => Promise<void>;
}

// Duplicating the helper to ensure it works without complex exports in this context
const getNicheVisuals = (niche: string) => {
    const n = niche.toLowerCase();
    
    // Mapping rules matching IdeaCard
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

    // Default
    return { icon: Lightbulb, bg: 'bg-gray-100', text: 'text-gray-500' };
}

const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({ 
  idea, 
  currentUserId,
  onClose, 
  onUpvote, 
  onToggleBuild, 
  onToggleFavorite,
  onRequestPdr
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);

  if (!idea) return null;

  const hasImage = idea.images && idea.images.length > 0 && idea.images[0] !== '';
  const visuals = getNicheVisuals(idea.niche);
  const VisualIcon = visuals.icon;

  const isOwner = currentUserId && idea.user_id === currentUserId;
  
  // If no PDR exists, show nothing, unless owner (then maybe prompt to add?)
  // For now, if owner has empty PDR, we show "Not defined".
  const hasPdrContent = idea.pdr && idea.pdr.trim().length > 0;

  const handleSendRequest = async () => {
    if (!requestMessage.trim()) return;
    if (!idea.user_id) return;

    setSending(true);
    try {
        await onRequestPdr(idea.id, idea.user_id, idea.title, requestMessage);
        setRequestSent(true);
        setIsRequesting(false);
    } catch (error) {
        console.error(error);
        alert("Erro ao enviar solicitação.");
    } finally {
        setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
        
        {/* Header Image (Optional) */}
        <div className={`w-full h-48 overflow-hidden relative shrink-0 ${hasImage ? 'bg-gray-50' : visuals.bg}`}>
            {hasImage ? (
                <img src={idea.images![0]} alt={idea.title} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                     <VisualIcon className={`w-20 h-20 ${visuals.text} opacity-50`} />
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
        </div>

        {/* Header with Actions */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${hasImage ? 'bg-apple-blue/10 text-apple-blue' : `${visuals.bg} ${visuals.text.replace('text-', 'text-opacity-100 text-')}`}`}>
                    {idea.niche}
                </span>
                <span className="text-gray-400 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(idea.created_at).toLocaleDateString()}
                </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-apple-text leading-tight">
              {idea.title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
            
            {/* Main Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3 bg-red-50 p-5 rounded-2xl border border-red-100">
                    <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wide">
                        <AlertCircle className="w-4 h-4" /> O Problema (A Dor)
                    </div>
                    <p className="text-gray-800 leading-relaxed font-medium">
                        {idea.pain}
                    </p>
                </div>

                <div className="space-y-3 bg-green-50 p-5 rounded-2xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-700 text-xs font-bold uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4" /> A Solução
                    </div>
                    <p className="text-gray-800 leading-relaxed font-medium">
                        {idea.solution}
                    </p>
                </div>
            </div>
            
            {/* PDR SECTION (TECH SPECS) */}
            <div className="space-y-3 border border-indigo-100 rounded-2xl overflow-hidden">
                <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
                     <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wide">
                        <FileCode className="w-4 h-4" /> Tech Specs (PDR)
                     </div>
                     {!isOwner && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase">
                            <Lock className="w-3 h-3" /> Protected
                        </div>
                     )}
                </div>
                
                <div className="p-5 bg-slate-50 relative">
                    {isOwner ? (
                         <div className="font-mono text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                             {hasPdrContent ? idea.pdr : <span className="text-gray-400 italic">Nenhum PDR definido ainda. Edite a ideia para adicionar especificações técnicas.</span>}
                         </div>
                    ) : (
                        <div className="relative">
                             {/* Blurred Content Simulation */}
                             <div className="font-mono text-sm text-gray-400 whitespace-pre-wrap leading-relaxed blur-sm select-none">
                                 STACK SUGERIDA:
                                 - Frontend: React + TypeScript
                                 - Backend: Node.js
                                 ... [conteúdo protegido] ...
                                 FLUXO DE DADOS:
                                 1. Usuário faz login
                                 ... [conteúdo protegido] ...
                             </div>
                             
                             {/* Request Overlay */}
                             <div className="absolute inset-0 flex items-center justify-center z-10">
                                 {!isRequesting && !requestSent && (
                                     <button 
                                        onClick={() => setIsRequesting(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-full shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2 text-sm"
                                     >
                                         <Lock className="w-3 h-3" /> Solicitar Acesso Completo
                                     </button>
                                 )}
                                 
                                 {requestSent && (
                                     <div className="bg-green-100 text-green-800 px-6 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-sm border border-green-200">
                                         <CheckCircle2 className="w-4 h-4" /> Solicitação Enviada ao Dono
                                     </div>
                                 )}
                             </div>
                        </div>
                    )}

                    {/* Request Form Area */}
                    {isRequesting && !isOwner && !requestSent && (
                        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm animate-in slide-in-from-top-2">
                             <h4 className="text-sm font-bold text-gray-800 mb-2">Mensagem para o dono do projeto:</h4>
                             <textarea 
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm mb-3 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                placeholder="Olá! Sou desenvolvedor e gostaria de ver o PDR para ajudar a construir..."
                                rows={3}
                             />
                             <div className="flex justify-end gap-2">
                                 <button 
                                    onClick={() => setIsRequesting(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                 >
                                     Cancelar
                                 </button>
                                 <button 
                                    onClick={handleSendRequest}
                                    disabled={!requestMessage.trim() || sending}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                                 >
                                     {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                     Enviar Solicitação
                                 </button>
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Why */}
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-apple-blue text-sm font-bold uppercase tracking-wide">
                    <Zap className="w-4 h-4" /> O Diferencial (Por que agora?)
                </div>
                <p className="text-gray-600 leading-relaxed text-lg font-light border-l-4 border-apple-blue pl-4">
                    {idea.why}
                </p>
            </div>

            {/* Business Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <DollarSign className="w-4 h-4" /> Modelo de Receita
                    </div>
                    <p className="text-apple-text font-semibold">{idea.pricing_model}</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <Users className="w-4 h-4" /> Público Alvo
                    </div>
                    <p className="text-apple-text font-semibold">{idea.target}</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                        <TrendingUp className="w-4 h-4" /> Estratégia
                    </div>
                    <p className="text-apple-text font-semibold">{idea.sales_strategy}</p>
                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => onUpvote(idea.id)}
                    className="flex items-center gap-2 bg-white border border-gray-200 hover:border-apple-blue px-4 py-2.5 rounded-xl transition-colors group/vote shadow-sm"
                >
                    <ArrowBigUp className="w-5 h-5 text-gray-400 group-hover/vote:text-apple-blue transition-colors" />
                    <span className="font-bold text-gray-700 group-hover/vote:text-apple-blue">{idea.votes_count} Votos</span>
                </button>
                <button 
                    onClick={() => onToggleFavorite(idea.id)}
                    className={`p-3 rounded-xl border transition-colors ${idea.isFavorite ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-gray-100'}`}
                >
                    <Heart className={`w-5 h-5 ${idea.isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
            </div>

            <button 
                onClick={() => onToggleBuild(idea.id)}
                className={`flex-grow md:flex-grow-0 md:w-auto px-8 py-3 rounded-full font-bold text-sm transition-all shadow-lg ${
                    idea.is_building 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200 shadow-green-500/10' 
                    : 'bg-apple-text text-white hover:bg-black shadow-black/20'
                }`}
            >
                {idea.is_building ? 'Em Construção 🔨' : 'Construir este SaaS 🚀'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default IdeaDetailModal;
