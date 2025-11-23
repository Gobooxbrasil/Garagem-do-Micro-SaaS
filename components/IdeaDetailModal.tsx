
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Idea, UserProfile } from '../types';
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
  User
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

// Helper: Generate Pix
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
  onRequestPdr
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

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
  // Hidden logic: Paid content + field is in hidden_fields + NOT unlocked + NOT owner
  const isHidden = (field: string) => isPaidContent && idea.hidden_fields?.includes(field) && !isUnlocked && !isOwner;

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
                  <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-3 ${paymentType === 'DONATION' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                      {paymentType === 'DONATION' ? <Gift className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                  </div>
                  <h3 className="text-lg font-bold text-apple-text">
                      {paymentType === 'DONATION' ? 'Apoiar o Projeto' : 'Comprar Acesso'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                      {paymentType === 'DONATION' ? 'Incentive o criador com uma doação.' : `Valor para acesso completo: R$ ${idea.price?.toFixed(2)}`}
                  </p>
              </div>

              {!pixPayload && paymentType === 'DONATION' && (
                  <div className="space-y-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase">Valor da Doação (Opcional)</label>
                      <div className="relative">
                          <span className="absolute left-3 top-3 text-gray-500 font-bold">R$</span>
                          <input 
                              type="number" 
                              value={donationAmount} 
                              onChange={(e) => setDonationAmount(e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:bg-white transition-all"
                              placeholder="0.00" 
                          />
                      </div>
                      <button onClick={generatePaymentPix} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors">
                          Gerar Pix
                      </button>
                  </div>
              )}

              {!pixPayload && paymentType === 'PURCHASE' && (
                  <div className="text-center space-y-4">
                      <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-200 text-left">
                          <p className="font-bold text-gray-800 mb-1">O que está incluso?</p>
                          <ul className="list-disc list-inside space-y-1">
                              <li>Acesso aos campos ocultos (PDR, Solução).</li>
                              <li>Contato direto com o criador.</li>
                          </ul>
                      </div>
                      <button onClick={generatePaymentPix} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition-colors">
                          Gerar Pix
                      </button>
                  </div>
              )}

              {/* QR CODE DISPLAY */}
              {pixPayload && (
                  <div className="text-center animate-in zoom-in duration-300">
                     <h4 className="text-sm font-bold text-gray-600 mb-4">Escaneie para Pagar</h4>
                     <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 inline-block mb-4">
                        <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixPayload)}`} 
                            alt="Pix QR Code" 
                            className="w-48 h-48 mix-blend-multiply"
                        />
                     </div>
                     <p className="text-xs text-gray-500 mb-4 max-w-[200px] mx-auto break-all bg-gray-50 p-2 rounded border border-gray-100 font-mono">
                        {pixPayload.slice(0, 20)}...
                     </p>
                     <button 
                        onClick={() => { navigator.clipboard.writeText(pixPayload); alert("Código Copia e Cola copiado!"); }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                     >
                        <Copy className="w-4 h-4" /> Copiar "Copia e Cola"
                     </button>
                  </div>
              )}

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
            <button 
                onClick={onClose} 
                className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors z-20"
            >
                <X className="w-5 h-5" />
            </button>
            <div className="absolute top-4 left-4 flex gap-2">
                 <span className="bg-white/90 backdrop-blur-md text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                    {idea.niche}
                 </span>
                 {idea.monetization_type === 'PAID' && (
                     <span className="bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                        <DollarSign className="w-3 h-3" /> R$ {idea.price}
                     </span>
                 )}
            </div>
            {/* Gallery Thumbs (if > 1) */}
            {images.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2">
                    {images.map((img, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveImage(img)}
                            className={`w-10 h-10 rounded-lg overflow-hidden border-2 ${activeImage === img ? 'border-white' : 'border-white/50 opacity-70'} hover:opacity-100 transition-all shadow-md`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto custom-scrollbar bg-white relative">
            <div className="p-8 pb-32">
                 {/* Title & Author */}
                 <div className="flex justify-between items-start mb-6">
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
                    
                    <div className="flex gap-2">
                         <button 
                             onClick={() => onUpvote(idea.id)}
                             className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border transition-all ${hasVotes ? 'bg-orange-50 border-orange-200 text-orange-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                         >
                             <Flame className={`w-5 h-5 ${hasVotes ? 'fill-orange-500' : ''}`} />
                             <span className="text-xs font-bold mt-0.5">{idea.votes_count}</span>
                         </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     
                     {/* Left: Main Content (2/3) */}
                     <div className="lg:col-span-2 space-y-8">
                         
                         {/* Pain & Solution */}
                         <div className="space-y-6">
                             <div>
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                     <AlertCircle className="w-4 h-4" /> O Problema (Dor)
                                 </h3>
                                 {isHidden('pain') ? renderLockedContent('A Dor') : (
                                     <p className="text-lg text-gray-800 leading-relaxed font-light">{idea.pain}</p>
                                 )}
                             </div>
                             
                             <div>
                                 <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                     <CheckCircle2 className="w-4 h-4" /> A Solução
                                 </h3>
                                 {isHidden('solution') ? renderLockedContent('A Solução') : (
                                     <p className="text-lg text-gray-800 leading-relaxed font-light">{idea.solution}</p>
                                 )}
                             </div>
                         </div>

                         {/* PDR Section (Tech Specs) */}
                         <div>
                             <h3 className="text-sm font-bold text-indigo-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                 <FileCode className="w-4 h-4" /> Tech Specs (PDR)
                             </h3>
                             {isHidden('pdr') ? renderLockedContent('o PDR Completo') : (
                                 <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-wrap border border-slate-800 shadow-inner">
                                     {idea.pdr || "// Nenhum detalhe técnico fornecido."}
                                 </div>
                             )}
                         </div>

                         {/* Request PDR / Contact Access */}
                         {!isOwner && (
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <HelpCircle className="w-4 h-4" /> Interessado em desenvolver?
                                </h4>
                                <p className="text-sm text-gray-500 mb-4">
                                    Envie uma mensagem direta ao autor pedindo permissão ou propondo parceria.
                                </p>
                                {requestSent ? (
                                    <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" /> Solicitação enviada com sucesso!
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={requestMessage}
                                            onChange={(e) => setRequestMessage(e.target.value)}
                                            placeholder="Ex: Sou dev React e gostaria de construir isso..."
                                            className="flex-grow bg-white border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-apple-blue"
                                        />
                                        <button 
                                            onClick={handleSendRequest}
                                            disabled={sending || !requestMessage}
                                            className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                                        >
                                            {sending ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                                            Enviar
                                        </button>
                                    </div>
                                )}
                            </div>
                         )}

                     </div>

                     {/* Right: Meta Info (1/3) */}
                     <div className="space-y-6">
                         
                         {/* Stats Card */}
                         <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modelo de Receita</label>
                                 <p className="font-semibold text-gray-800 flex items-center gap-2">
                                     <DollarSign className="w-4 h-4 text-green-600" /> {idea.pricing_model}
                                 </p>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Público Alvo</label>
                                 <p className="font-semibold text-gray-800 flex items-center gap-2">
                                     <Users className="w-4 h-4 text-blue-600" /> {idea.target}
                                 </p>
                             </div>
                             <div>
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estratégia de Venda</label>
                                 <p className="font-semibold text-gray-800 flex items-center gap-2">
                                     <TrendingUp className="w-4 h-4 text-purple-600" /> {idea.sales_strategy}
                                 </p>
                             </div>
                             <div className="pt-4 border-t border-gray-200">
                                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Diferencial (Why)</label>
                                 <p className="text-sm text-gray-600 italic mt-1">"{idea.why}"</p>
                             </div>
                         </div>

                         {/* Actions */}
                         <div className="space-y-3">
                             <button 
                                onClick={() => onToggleFavorite(idea.id)}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${idea.isFavorite ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                             >
                                 <Heart className={`w-4 h-4 ${idea.isFavorite ? 'fill-red-600' : ''}`} /> 
                                 {idea.isFavorite ? 'Favoritado' : 'Adicionar aos Favoritos'}
                             </button>

                             {isOwner && (
                                 <button 
                                    onClick={() => onToggleBuild(idea.id)}
                                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all ${idea.is_building ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                 >
                                     <Rocket className="w-4 h-4" /> 
                                     {idea.is_building ? 'Em Construção' : 'Marcar como Em Construção'}
                                 </button>
                             )}

                             {/* Monetization Actions for Non-Owners */}
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
        
        {/* Modals */}
        {showPaymentModal && renderPaymentModal()}

      </div>
    </div>
  );
};

export default IdeaDetailModal;
