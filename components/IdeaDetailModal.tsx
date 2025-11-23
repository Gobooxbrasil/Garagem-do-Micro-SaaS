
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Idea, UserProfile, Improvement } from '../types';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  DollarSign, 
  Users, 
  TrendingUp, 
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
  HelpCircle,
  Gift,
  QrCode,
  Copy,
  Building2,
  CheckCircle,
  Eye,
  Unlock,
  User,
  Info,
  Hammer,
  MessageSquarePlus,
  Hash
} from 'lucide-react';

interface IdeaDetailModalProps {
  idea: Idea | null;
  currentUserId?: string;
  onClose: () => void;
  onUpvote: (id: string) => void;
  onToggleBuild: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRequestPdr: (ideaId: string, ownerId: string, ideaTitle: string, message: string) => Promise<void>;
  onJoinTeam?: (ideaId: string) => Promise<void>;
  onAddImprovement?: (ideaId: string, content: string) => Promise<void>;
}

// Componente Helper para Tooltips
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-flex items-center ml-1.5 align-middle z-50">
    <Info className="w-3.5 h-3.5 text-gray-400 cursor-help hover:text-apple-blue transition-colors" />
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm text-white text-[11px] font-medium py-2.5 px-3.5 rounded-xl shadow-xl border border-white/10 relative leading-relaxed text-center">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></div>
      </div>
    </div>
  </div>
);

// Helper: Generate Pix (Mantido igual)
const generatePixPayload = (key: string, name: string, txId: string = '***', amount?: number) => {
  const DEFAULT_CITY = 'SAO PAULO';
  const formatField = (id: string, value: string) => {
    const len = value.length.toString().padStart(2, '0');
    return `${id}${len}${value}`;
  };
  const cleanName = name.substring(0, 25).normalize('NFD').replace(/[\u0300-\u036f]/g, ""); 
  const cleanCity = DEFAULT_CITY.substring(0, 15).normalize('NFD').replace(/[\u0300-\u036f]/g, "");
  
  let payload = 
    formatField('00', '01') +
    formatField('26', formatField('00', 'br.gov.bcb.pix') + formatField('01', key)) +
    formatField('52', '0000') +
    formatField('53', '986');

  if (amount && amount > 0) {
      payload += formatField('54', amount.toFixed(2));
  }

  payload += 
    formatField('58', 'BR') +
    formatField('59', cleanName) +
    formatField('60', cleanCity) +
    formatField('62', formatField('05', txId));

  payload += '6304';
  
  const polynomial = 0x1021;
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) { crc = (crc << 1) ^ polynomial; } 
      else { crc = crc << 1; }
    }
  }
  return payload + (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

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

const IdeaDetailModal: React.FC<IdeaDetailModalProps> = ({ 
  idea, 
  currentUserId,
  onClose, 
  onUpvote, 
  onToggleBuild, 
  onToggleFavorite,
  onRequestPdr,
  onJoinTeam,
  onAddImprovement
}) => {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Improvements State
  const [newImprovement, setNewImprovement] = useState('');
  const [submittingImprovement, setSubmittingImprovement] = useState(false);

  // Payment / Donation State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'DONATION' | 'PURCHASE'>('DONATION');
  const [donationAmount, setDonationAmount] = useState<string>('');
  const [creatorProfile, setCreatorProfile] = useState<UserProfile | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);

  if (!idea) return null;

  const images = idea.images || [];
  const hasImages = images.length > 0 && images[0] !== '';
  const displayImage = activeImage || (hasImages ? images[0] : null);

  const visuals = getNicheVisuals(idea.niche);
  const VisualIcon = visuals.icon;

  const isOwner = currentUserId && idea.user_id === currentUserId;
  const hasVotes = idea.votes_count > 0;
  
  const isPaidContent = idea.monetization_type === 'PAID';
  const isHidden = (field: string) => isPaidContent && idea.hidden_fields?.includes(field) && !isUnlocked && !isOwner;

  // Verificar se o usuário atual é um desenvolvedor
  const isDeveloper = idea.idea_developers?.some(dev => dev.user_id === currentUserId);

  const handleJoin = async () => {
      if (!onJoinTeam) return;
      try {
          await onJoinTeam(idea.id);
      } catch (error) {
          console.error(error);
      }
  };

  const submitImprovement = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newImprovement.trim() || !onAddImprovement) return;
      
      setSubmittingImprovement(true);
      try {
          await onAddImprovement(idea.id, newImprovement);
          setNewImprovement('');
      } catch (error) {
          alert("Erro ao enviar melhoria.");
      } finally {
          setSubmittingImprovement(false);
      }
  };

  const handleOpenPayment = async (type: 'DONATION' | 'PURCHASE') => {
      setPaymentType(type);
      setShowPaymentModal(true);
      setPixPayload(null);
      setDonationAmount('');
      
      if (idea.user_id) {
          const { data } = await supabase.from('profiles').select('*').eq('id', idea.user_id).single();
          if (data) setCreatorProfile(data);
      }
  };

  const generatePaymentPix = () => {
      if (!creatorProfile || !creatorProfile.pix_key) return;
      
      let amountVal = 0;
      if (paymentType === 'PURCHASE' && idea.price) {
          amountVal = idea.price;
      } else if (paymentType === 'DONATION' && donationAmount) {
          amountVal = parseFloat(donationAmount);
      }

      const payload = generatePixPayload(creatorProfile.pix_key, creatorProfile.pix_name || 'Usuario', 'GMS'+Date.now().toString().slice(-4), amountVal > 0 ? amountVal : undefined);
      setPixPayload(payload);
  };

  const renderLockedContent = (label: string) => (
      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden h-full min-h-[160px]">
          <div className="bg-white p-3 rounded-full shadow-sm border border-gray-100">
              <Lock className="w-5 h-5 text-gray-400" />
          </div>
          <div>
              <h4 className="font-bold text-gray-700 text-sm">Conteúdo Bloqueado</h4>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                  Adquira o projeto para ver {label}.
              </p>
          </div>
          <button 
            onClick={() => handleOpenPayment('PURCHASE')}
            className="mt-2 bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-lg shadow-black/10 flex items-center gap-2"
          >
              <Unlock className="w-3 h-3" /> Desbloquear
          </button>
      </div>
  );

  const renderPaymentModal = () => (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 relative shadow-2xl border border-gray-100">
              <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
              </button>
               <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-apple-text">
                      {paymentType === 'DONATION' ? 'Apoiar o Projeto' : 'Comprar Acesso'}
                  </h3>
                  <div className="mt-4">
                      {paymentType === 'DONATION' && (
                          <div className="mb-4">
                              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Valor da Doação (R$)</label>
                              <input 
                                  type="number" 
                                  value={donationAmount}
                                  onChange={(e) => setDonationAmount(e.target.value)}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-center font-bold text-lg"
                                  placeholder="0.00"
                              />
                          </div>
                      )}
                      {!pixPayload && (
                           <button onClick={generatePaymentPix} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
                             Gerar Pix (Simulado)
                           </button>
                      )}
                      {pixPayload && (
                           <div className="mt-4 p-4 bg-gray-50 rounded-xl break-all text-xs font-mono border border-gray-200">
                               {pixPayload}
                           </div>
                      )}
                  </div>
               </div>
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/30 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] border border-gray-200/50 relative overflow-hidden">
        
        {/* Header */}
        <div className={`h-40 w-full relative ${hasImages ? 'bg-gray-900' : visuals.bg}`}>
            {hasImages ? (
                 <img src={displayImage!} alt="Cover" className="w-full h-full object-cover opacity-80" />
            ) : (
                 <div className="w-full h-full flex items-center justify-center">
                      <VisualIcon className={`w-16 h-16 ${visuals.text} opacity-50`} />
                 </div>
            )}
            
            {/* Botão Fechar (PRETO) */}
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 bg-black/90 p-2 rounded-full text-white hover:bg-black transition-colors z-20 shadow-lg border border-white/20"
                title="Fechar"
            >
                <X className="w-5 h-5" />
            </button>

            <div className="absolute top-4 left-4 flex gap-2">
                 <span className="bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                    {idea.niche}
                 </span>
                 {/* UUID Badge (Código Único) */}
                 <span className="bg-black/80 backdrop-blur-md text-white text-xs font-mono px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1.5 border border-white/10" title="Código Único do Projeto">
                    <Hash className="w-3 h-3 text-gray-400" />
                    {idea.short_id ? idea.short_id.toUpperCase() : 'NO-CODE'}
                 </span>
            </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto custom-scrollbar bg-white relative">
            <div className="p-8 pb-32">
                 {/* Title & Author */}
                 <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-apple-text mb-2 leading-tight">{idea.title}</h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                             <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-gray-100 overflow-hidden">
                                     {idea.profiles?.avatar_url ? <img src={idea.profiles.avatar_url} className="w-full h-full object-cover"/> : <User className="w-3 h-3 m-1 text-gray-400"/>}
                                </div>
                                <span>por <span className="font-semibold text-gray-700">{idea.profiles?.full_name || 'Anônimo'}</span></span>
                             </div>
                             <span>•</span>
                             <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(idea.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    
                    {/* Votes */}
                    <button 
                        onClick={() => onUpvote(idea.id)}
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border transition-all flex-shrink-0 ${hasVotes ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                    >
                        <Flame className={`w-5 h-5 ${hasVotes ? 'fill-orange-500' : ''}`} />
                        <span className="text-xs font-bold mt-0.5">{idea.votes_count}</span>
                    </button>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     
                     {/* Left: Main Content (2/3) */}
                     <div className="lg:col-span-2 space-y-10">
                         
                         {/* Pain & Solution */}
                         <div className="space-y-8">
                             <div>
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                     <AlertCircle className="w-4 h-4" /> 
                                     O Problema (Dor)
                                     <InfoTooltip text="Qual dor ou dificuldade os clientes enfrentam no dia a dia que este produto vai resolver?" />
                                 </h3>
                                 {isHidden('pain') ? renderLockedContent('A Dor') : (
                                     <p className="text-lg text-gray-800 leading-relaxed font-light">{idea.pain}</p>
                                 )}
                             </div>
                             
                             <div>
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                     <CheckCircle2 className="w-4 h-4" /> 
                                     A Solução
                                     <InfoTooltip text="Como este produto elimina o problema dos clientes de forma simples e eficaz?" />
                                 </h3>
                                 {isHidden('solution') ? renderLockedContent('A Solução') : (
                                     <p className="text-lg text-gray-800 leading-relaxed font-light">{idea.solution}</p>
                                 )}
                             </div>
                         </div>

                         {/* PDR Section */}
                         <div>
                             <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <FileCode className="w-4 h-4" /> 
                                 Tech Specs (PDR)
                                 <InfoTooltip text="Quais tecnologias e funcionalidades técnicas são necessárias para desenvolver este produto?" />
                             </h3>
                             {isHidden('pdr') ? renderLockedContent('o PDR Completo') : (
                                 <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner">
                                     {idea.pdr || "// Nenhum detalhe técnico fornecido."}
                                 </div>
                             )}
                         </div>

                         {/* MELHORIAS SUGERIDAS (NOVA SEÇÃO) */}
                         <div className="pt-8 border-t border-gray-100">
                             <h3 className="text-lg font-bold text-apple-text mb-6 flex items-center gap-2">
                                <MessageSquarePlus className="w-5 h-5 text-gray-400" />
                                Melhorias Sugeridas
                             </h3>
                             
                             {/* List */}
                             <div className="space-y-4 mb-6">
                                 {(!idea.idea_improvements || idea.idea_improvements.length === 0) && (
                                     <p className="text-gray-400 text-sm italic bg-gray-50 p-4 rounded-xl text-center">
                                         Nenhuma sugestão ainda. Seja o primeiro a colaborar!
                                     </p>
                                 )}
                                 {idea.idea_improvements?.map((imp) => (
                                     <div key={imp.id} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                                         <div className="flex items-center gap-2 mb-2">
                                             <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden">
                                                 {imp.profiles?.avatar_url ? (
                                                     <img src={imp.profiles.avatar_url} className="w-full h-full object-cover"/>
                                                 ) : (
                                                     <User className="w-3 h-3 m-1.5 text-gray-400"/>
                                                 )}
                                             </div>
                                             <span className="text-xs font-bold text-gray-700">{imp.profiles?.full_name || 'Anônimo'}</span>
                                             <span className="text-[10px] text-gray-400 ml-auto">{new Date(imp.created_at).toLocaleDateString()}</span>
                                         </div>
                                         <p className="text-sm text-gray-600 leading-relaxed">{imp.content}</p>
                                     </div>
                                 ))}
                             </div>

                             {/* Input */}
                             <form onSubmit={submitImprovement} className="flex gap-3 items-start">
                                 <div className="flex-grow relative">
                                     <textarea 
                                         required
                                         value={newImprovement}
                                         onChange={(e) => setNewImprovement(e.target.value)}
                                         placeholder="Sugira uma feature ou melhoria..."
                                         className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:bg-white focus:border-apple-blue outline-none transition-all resize-none h-20"
                                     ></textarea>
                                 </div>
                                 <button 
                                     type="submit"
                                     disabled={submittingImprovement || !newImprovement.trim()}
                                     className="bg-apple-text hover:bg-black text-white p-3 rounded-xl shadow-lg shadow-black/10 transition-all disabled:opacity-50"
                                 >
                                     {submittingImprovement ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                                 </button>
                             </form>
                         </div>

                     </div>

                     {/* Right: Meta Info (1/3) */}
                     <div className="space-y-6">
                         
                         {/* Meta Card */}
                         <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                             {/* ... (Existing Meta Fields) ... */}
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                     Modelo de Receita
                                     <InfoTooltip text="Como este negócio gera receita? Ex: assinatura mensal, venda única, comissões, etc." />
                                 </label>
                                 <p className="font-semibold text-gray-800 flex items-center gap-2">
                                     <DollarSign className="w-4 h-4 text-green-600" /> {idea.pricing_model}
                                 </p>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                     Diferencial
                                     <InfoTooltip text="Por que os clientes devem escolher este produto e não a concorrência? O que o torna único?" />
                                 </label>
                                 <p className="text-sm text-gray-600 italic mt-1">"{idea.why}"</p>
                             </div>
                         </div>

                         {/* DEVELOPERS SECTION */}
                         <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                            <h4 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Hammer className="w-4 h-4 text-amber-500" /> Squad de Desenvolvimento
                            </h4>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                {idea.idea_developers && idea.idea_developers.length > 0 ? (
                                    idea.idea_developers.map((dev) => (
                                        <div key={dev.id} className="relative group/dev cursor-help">
                                            <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-gray-100 overflow-hidden">
                                                {dev.profiles?.avatar_url ? (
                                                    <img src={dev.profiles.avatar_url} className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-5 h-5"/></div>
                                                )}
                                            </div>
                                            {/* Tooltip Name */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/dev:block whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded-lg z-50">
                                                {dev.profiles?.full_name || 'Dev'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-xs text-gray-400 italic">Nenhum desenvolvedor ainda.</p>
                                )}
                            </div>

                            {/* BOTÃO QUERO DESENVOLVER */}
                            <button 
                                onClick={handleJoin}
                                disabled={isDeveloper}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${
                                    isDeveloper 
                                    ? 'bg-green-50 text-green-700 border-green-200 cursor-default' 
                                    : 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                                }`}
                             >
                                 {isDeveloper ? (
                                     <>
                                        <CheckCircle className="w-4 h-4" /> Você está no time
                                     </>
                                 ) : (
                                     <>
                                        <Hammer className="w-4 h-4" /> Quero Desenvolver
                                     </>
                                 )}
                             </button>
                         </div>

                         {/* Actions */}
                         <div className="space-y-3">
                             <button 
                                onClick={() => onToggleFavorite(idea.id)}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${idea.isFavorite ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                             >
                                 <Heart className={`w-4 h-4 ${idea.isFavorite ? 'fill-red-600' : ''}`} /> 
                                 {idea.isFavorite ? 'Favoritado' : 'Favoritar'}
                             </button>

                             {/* Monetization Actions */}
                             {!isOwner && idea.monetization_type === 'DONATION' && (
                                 <button 
                                    onClick={() => handleOpenPayment('DONATION')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                 >
                                     <Gift className="w-4 h-4" /> Apoiar este Projeto
                                 </button>
                             )}
                             
                             {!isOwner && idea.monetization_type === 'PAID' && !isUnlocked && (
                                 <button 
                                    onClick={() => handleOpenPayment('PURCHASE')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                 >
                                     <Lock className="w-4 h-4" /> Comprar Acesso (R$ {idea.price})
                                 </button>
                             )}
                         </div>

                     </div>
                 </div>
            </div>
        </div>
        
        {showPaymentModal && renderPaymentModal()}

      </div>
    </div>
  );
};

export default IdeaDetailModal;