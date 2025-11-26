
import React, { useState } from 'react';
import { X, Send, User, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface RequestPixModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorId: string;
  creatorName: string;
  ideaId: string;
  ideaTitle: string;
  currentUserId: string;
  currentUserData: {
    name: string;
    avatar?: string;
  };
}

const RequestPixModal: React.FC<RequestPixModalProps> = ({
  isOpen,
  onClose,
  creatorId,
  creatorName,
  ideaId,
  ideaTitle,
  currentUserId,
  currentUserData
}) => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleNotify = async () => {
    setLoading(true);
    try {
      await supabase.from('notifications').insert({
        recipient_id: creatorId,
        sender_id: currentUserId,
        type: 'PIX_REQUEST',
        payload: {
          idea_id: ideaId,
          idea_title: ideaTitle,
          user_name: currentUserData.name,
          user_avatar: currentUserData.avatar,
          message: `${currentUserData.name} quer comprar/apoiar "${ideaTitle}", mas você precisa configurar sua chave PIX no perfil.`
        }
      });
      setSent(true);
      setTimeout(() => {
        onClose();
        setSent(false);
      }, 3000);
    } catch (error) {
      console.error(error);
      alert('Erro ao enviar notificação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-gray-50 rounded-full hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {sent ? (
          <div className="py-8 text-center animate-in zoom-in">
             <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
               <Send className="w-8 h-8" />
             </div>
             <h3 className="text-xl font-bold text-gray-800">Enviado!</h3>
             <p className="text-gray-500 mt-2">Notificamos {creatorName} para configurar o Pix.</p>
          </div>
        ) : (
          <>
            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pix não configurado</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              O criador <strong>{creatorName}</strong> ainda não cadastrou uma chave Pix para receber pagamentos neste projeto.
            </p>

            <button
              onClick={handleNotify}
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20"
            >
              {loading ? 'Enviando...' : `Notificar ${creatorName.split(' ')[0]}`}
              {!loading && <Send className="w-4 h-4" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default RequestPixModal;
