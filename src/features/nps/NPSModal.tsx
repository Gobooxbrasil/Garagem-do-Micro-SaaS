
import React, { useState, useEffect } from 'react';
import { useNPS } from '../../hooks/use-nps';
import { X, MessageSquare, CheckCircle2 } from 'lucide-react';

interface NPSModalProps {
  userId: string;
}

export const NPSModal: React.FC<NPSModalProps> = ({ userId }) => {
  const { shouldShow, logDisplay, submitScore, snooze } = useNPS(userId);
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
      if (shouldShow) {
          setIsOpen(true);
          logDisplay.mutate();
      }
  }, [shouldShow]);

  const handleSubmit = () => {
      if (score === null) return;
      submitScore.mutate({ score, feedback });
      setSubmitted(true);
      setTimeout(() => setIsOpen(false), 3000);
  };

  const handleClose = () => {
      snooze();
      setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-10 fade-in duration-500">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {submitted ? (
                <div className="p-8 text-center bg-green-50">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-bold text-green-800">Obrigado!</h3>
                    <p className="text-green-600 text-sm mt-1">Seu feedback ajuda a construir uma garagem melhor.</p>
                </div>
            ) : (
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Como você avalia a Garagem?</h3>
                            <p className="text-xs text-gray-500 mt-1">De 0 a 10, qual a chance de você recomendar para um amigo?</p>
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>

                    <div className="flex justify-between gap-1 mb-6">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(val => (
                            <button
                                key={val}
                                onClick={() => setScore(val)}
                                className={`w-7 h-9 rounded-md text-xs font-bold transition-all flex items-center justify-center border-b-4 ${
                                    score === val 
                                    ? 'bg-black text-white border-black -translate-y-1 shadow-md' 
                                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                                }`}
                                style={{ 
                                    backgroundColor: score === val ? 
                                        (val <= 6 ? '#ef4444' : val <= 8 ? '#f59e0b' : '#22c55e') 
                                        : undefined,
                                    borderColor: score === val ? 
                                        (val <= 6 ? '#b91c1c' : val <= 8 ? '#d97706' : '#15803d') 
                                        : undefined
                                }}
                            >
                                {val}
                            </button>
                        ))}
                    </div>

                    {score !== null && (
                        <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                            <textarea 
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder="Quer deixar algum comentário? (Opcional)"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-blue-500 resize-none h-20"
                            />
                            <button 
                                onClick={handleSubmit}
                                className="w-full bg-black text-white font-bold py-3 rounded-xl shadow-lg hover:bg-gray-800 transition-all text-sm"
                            >
                                Enviar Avaliação
                            </button>
                        </div>
                    )}
                    
                    {score === null && (
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider px-1">
                            <span>😡 Jamais</span>
                            <span>🤩 Com certeza</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  );
};
