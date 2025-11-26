import React, { useState } from 'react';
import { Project, Review } from '../../types';
import { 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  Lock, 
  Unlock, 
  Star, 
  Send, 
  Box
} from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  onBack: () => void;
  onAddReview: (projectId: string, review: Omit<Review, 'id' | 'created_at'>) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onBack, onAddReview }) => {
  const hasImages = project.images && project.images.length > 0 && project.images[0] !== '';
  const [activeImage, setActiveImage] = useState(hasImages ? project.images[0] : null);
  const [showDemoData, setShowDemoData] = useState(false);
  
  // New Review State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState('');

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim() && userName.trim()) {
      onAddReview(project.id, {
        project_id: project.id,
        user_name: userName,
        rating,
        comment,
      });
      setComment('');
      setUserName('');
    }
  };

  const shareUrl = window.location.href;

  return (
    <div className="animate-in fade-in duration-500 ease-out">
      <button 
        onClick={onBack}
        className="mb-8 group flex items-center gap-2 text-apple-subtext hover:text-apple-text transition-colors text-sm font-medium"
      >
        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
            <ArrowLeft className="w-4 h-4" /> 
        </div>
        Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Column: Gallery & Info (8/12) */}
        <div className="lg:col-span-8 space-y-10">
            {/* Gallery */}
            <div className="space-y-4">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-white shadow-soft flex items-center justify-center bg-gray-50">
                    {activeImage ? (
                         <img src={activeImage} alt="Main view" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center gap-4 opacity-20">
                            <Box className="w-24 h-24 text-gray-500" strokeWidth={0.5} />
                            <span className="text-gray-400 font-medium tracking-widest uppercase text-sm">Sem Imagem</span>
                        </div>
                    )}
                </div>
                
                {hasImages && (
                    <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                        {project.images.map((img, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setActiveImage(img)}
                                className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${activeImage === img ? 'border-apple-blue ring-2 ring-apple-blue/20' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            >
                                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Description */}
            <div>
                <h2 className="text-2xl font-semibold text-apple-text mb-4">Sobre</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-lg font-light">
                    {project.description}
                </p>
            </div>

            {/* Reviews Section */}
            <div className="pt-10 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-apple-text mb-8">
                    Avaliações <span className="text-gray-400 font-normal">({project.reviews ? project.reviews.length : 0})</span>
                </h3>
                
                <div className="space-y-6 mb-12">
                    {(!project.reviews || project.reviews.length === 0) && (
                        <p className="text-gray-400 italic">Seja o primeiro a compartilhar sua experiência.</p>
                    )}
                    {project.reviews?.map((review) => (
                        <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                        <span className="font-semibold text-gray-500 text-sm">{review.user_name.charAt(0)}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-apple-text">{review.user_name}</div>
                                        <div className="flex text-yellow-400 text-xs mt-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed pl-13">{review.comment}</p>
                            {review.maker_reply && (
                                <div className="ml-13 mt-4 p-4 bg-gray-50 rounded-xl">
                                    <p className="text-xs font-bold text-apple-text mb-1">Maker:</p>
                                    <p className="text-xs text-gray-600">{review.maker_reply}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Add Review Form */}
                <form onSubmit={handleSubmitReview} className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                    <h4 className="text-lg font-semibold text-apple-text mb-6">Adicionar Review</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <input 
                            type="text" 
                            placeholder="Seu Nome"
                            required
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="bg-white border border-gray-200 rounded-xl p-3.5 text-apple-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all"
                        />
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4">
                            <span className="text-gray-400 text-sm font-medium">Nota:</span>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star} 
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="p-1 focus:outline-none hover:scale-110 transition-transform"
                                >
                                    <Star className={`w-5 h-5 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea 
                        placeholder="Conte sua experiência..."
                        required
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-apple-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-apple-blue/50 transition-all h-32 mb-6 resize-none"
                    ></textarea>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-apple-text hover:bg-black text-white font-medium py-2.5 px-8 rounded-full transition-all shadow-lg shadow-black/10 flex items-center gap-2">
                            <Send className="w-4 h-4" /> Publicar
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* Right Column: Meta & Actions (4/12) */}
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-soft sticky top-24 border border-gray-100">
                <h1 className="text-3xl font-bold text-apple-text mb-2 tracking-tight">{project.name}</h1>
                <p className="text-apple-blue font-medium text-sm mb-8">{project.tagline}</p>
                
                <a 
                    href={project.link_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-apple-blue hover:bg-apple-blueHover text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 mb-8 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30"
                >
                    Visitar Site <ExternalLink className="w-4 h-4" />
                </a>

                {/* Demo Data Reveal */}
                {project.demo_email && (
                    <div className="bg-gray-50 rounded-2xl overflow-hidden mb-8 border border-gray-200">
                        <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/50">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dados de Acesso</span>
                            {showDemoData ? <Unlock className="w-3 h-3 text-gray-600" /> : <Lock className="w-3 h-3 text-gray-400" />}
                        </div>
                        <div className="p-5 relative">
                            <div className={`space-y-3 text-sm ${!showDemoData ? 'blur-sm select-none opacity-50' : ''}`}>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Email</span>
                                    <span className="font-mono text-apple-text bg-white px-2 py-0.5 rounded border border-gray-200">{project.demo_email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Senha</span>
                                    <span className="font-mono text-apple-text bg-white px-2 py-0.5 rounded border border-gray-200">{project.demo_password}</span>
                                </div>
                            </div>
                            
                            {!showDemoData && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <button 
                                        onClick={() => setShowDemoData(true)}
                                        className="bg-white hover:bg-gray-50 text-apple-text text-xs font-bold py-2 px-6 rounded-full shadow-md border border-gray-100 transition-all"
                                    >
                                        Revelar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Maker Info */}
                <div className="flex items-center gap-4 py-6 border-t border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-500 text-lg">
                        {project.maker_id.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Criador</p>
                        <p className="text-base font-semibold text-apple-text">@{project.maker_id}</p>
                    </div>
                </div>

                {/* Sharing */}
                <div className="pt-6 border-t border-gray-100">
                    <button 
                        onClick={() => { navigator.clipboard.writeText(shareUrl); alert('Link copiado!'); }}
                        className="w-full py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-4 h-4" /> Compartilhar Projeto
                    </button>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectDetail;