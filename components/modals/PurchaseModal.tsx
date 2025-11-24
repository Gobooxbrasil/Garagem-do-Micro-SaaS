
import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Upload, ArrowRight, Loader2, AlertCircle, Lock, ShieldCheck, QrCode } from 'lucide-react';
import { useCreateTransaction } from '../../hooks/use-transactions';
import { PixData } from '../../hooks/use-pix';
import { FileUpload } from '../ui/FileUpload';
import { generatePixPayload } from '../../lib/pix-utils';
import QRCode from 'qrcode';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  ideaId: string;
  userId: string; // Comprador
  amount: number;
  type: 'donation' | 'purchase';
  creatorPix: Partial<PixData>;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen, onClose, ideaId, userId, amount, type, creatorPix
}) => {
  const [step, setStep] = useState<'PAY' | 'PROOF'>('PAY');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const createTransaction = useCreateTransaction();

  useEffect(() => {
      if (isOpen && creatorPix.key && creatorPix.beneficiary) {
          const generate = async () => {
              const payload = generatePixPayload({
                  key: creatorPix.key!,
                  name: creatorPix.beneficiary!,
                  amount: amount, // Se for doação sem valor fixo, pode passar undefined
                  city: 'SAO PAULO',
                  txId: `GMS${Math.floor(Math.random() * 10000)}`
              });
              setPixPayload(payload);
              try {
                  const url = await QRCode.toDataURL(payload, { width: 300, margin: 1 });
                  setQrCodeUrl(url);
              } catch (e) {
                  console.error(e);
              }
          };
          generate();
          setStep('PAY');
          setProofFile(null);
      }
  }, [isOpen, creatorPix, amount]);

  const handleCopy = () => {
      navigator.clipboard.writeText(pixPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = () => {
      if (!proofFile) return;
      
      createTransaction.mutate({
          ideaId,
          userId,
          amount,
          type,
          proofFile
      }, {
          onSuccess: () => {
              alert("Pagamento enviado para análise! Você será notificado quando o criador aprovar.");
              onClose();
          },
          onError: (err: any) => {
              alert(`Erro: ${err.message}`);
          }
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in zoom-in-95 duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative border border-gray-200 flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-apple-text flex items-center gap-2">
                  {type === 'purchase' ? <Lock className="w-4 h-4 text-green-600" /> : <ShieldCheck className="w-4 h-4 text-blue-600" />}
                  {type === 'purchase' ? 'Comprar Acesso' : 'Apoiar Projeto'}
              </h3>
              <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
              </button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
              
              {/* Steps Indicator */}
              <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-wider">
                  <span className={`px-2 py-1 rounded ${step === 'PAY' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>1. Pagamento</span>
                  <ArrowRight className="w-3 h-3 text-gray-300" />
                  <span className={`px-2 py-1 rounded ${step === 'PROOF' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400'}`}>2. Comprovante</span>
              </div>

              {step === 'PAY' && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                      <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Valor a pagar</p>
                          <p className="text-4xl font-bold text-apple-text tracking-tight">R$ {amount.toFixed(2)}</p>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex flex-col items-center">
                          {qrCodeUrl ? (
                              <img src={qrCodeUrl} alt="QR Code Pix" className="w-48 h-48 mix-blend-multiply" />
                          ) : (
                              <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                              </div>
                          )}
                          <p className="text-xs text-gray-400 mt-2 font-mono break-all text-center px-4">
                             Beneficiário: {creatorPix.beneficiary}
                          </p>
                      </div>

                      <button 
                          onClick={handleCopy}
                          className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                      >
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Código Pix Copiado!' : 'Copiar "Copia e Cola"'}
                      </button>

                      <button 
                          onClick={() => setStep('PROOF')}
                          className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2"
                      >
                          Já fiz o pagamento <ArrowRight className="w-4 h-4" />
                      </button>
                  </div>
              )}

              {step === 'PROOF' && (
                  <div className="space-y-6 animate-in slide-in-from-right">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          <p className="text-xs text-blue-800 leading-relaxed">
                              Envie o comprovante para liberar seu acesso. O criador irá conferir o recebimento.
                          </p>
                      </div>

                      <FileUpload 
                          onFileSelect={setProofFile} 
                          maxSize={2097152} // 2MB
                      />

                      <div className="pt-4 flex gap-3">
                          <button 
                              onClick={() => setStep('PAY')}
                              className="flex-1 bg-white border border-gray-200 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                          >
                              Voltar
                          </button>
                          <button 
                              onClick={handleSubmit}
                              disabled={!proofFile || createTransaction.isPending}
                              className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                          >
                              {createTransaction.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                              Confirmar Pagamento
                          </button>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};