
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { X, Upload, AlertTriangle, CheckCircle, FileText, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess, userId }) => {
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'IMPORTING'>('UPLOAD');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const reset = () => {
    setStep('UPLOAD');
    setFile(null);
    setParsedData([]);
    setErrors([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

  const cleanString = (str: string) => {
    if (!str) return '';
    return str
      .replace(/\\/g, '') // Remove backslashes para evitar "Unicode escape sequence"
      .replace(/\u0000/g, '') // Remove null bytes
      .trim();
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        
        // 1. Sanitização Pré-Parse (Coração da correção)
        // Remove BOM e caracteres nulos
        let cleanText = text.replace(/^\uFEFF/, '');
        
        Papa.parse(cleanText, {
          header: true,
          skipEmptyLines: 'greedy',
          encoding: 'UTF-8',
          complete: (results) => {
            if (results.data.length === 0) {
              setErrors(['O arquivo está vazio ou inválido.']);
              return;
            }

            // Mapeamento Inteligente
            const normalizeKey = (key: string) => key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
            
            const mappedData = results.data.map((row: any, index) => {
              const getValue = (searchKeys: string[]) => {
                const foundKey = Object.keys(row).find(k => {
                  const normalizedK = normalizeKey(k);
                  return searchKeys.some(sk => normalizedK.includes(sk));
                });
                // Aplica limpeza em cada valor extraído
                return foundKey ? cleanString(row[foundKey]?.toString()) : "";
              };

              const title = getValue(['titulo', 'title', 'nome']);
              const niche = getValue(['nicho', 'categoria', 'niche']) || 'Outros';
              
              // Validação básica por linha
              if (!title) return null;

              const monTypeRaw = getValue(['tipomonetizacao', 'monetizacao', 'tipo']).toUpperCase();
              const monetization_type = ["PAID", "DONATION"].includes(monTypeRaw) ? monTypeRaw : "NONE";
              const payment_type = monetization_type === 'PAID' ? 'paid' : monetization_type === 'DONATION' ? 'donation' : 'free';
              
              const priceRaw = getValue(['valor', 'price', 'custo']);
              const priceClean = priceRaw.replace(/[^0-9.,]/g, '').replace(',', '.');

              return {
                title,
                niche,
                pain: getValue(['dor', 'problema', 'pain']),
                solution: getValue(['solucao', 'solution', 'produto']),
                why: getValue(['porque', 'why', 'motivo']),
                pricing_model: getValue(['modelopreco', 'precificacao', 'pricing']),
                target: getValue(['publico', 'alvo', 'target']),
                sales_strategy: getValue(['estrategia', 'vendas', 'sales']),
                pdr: getValue(['pdr', 'tecnico', 'stack']),
                monetization_type,
                payment_type,
                price: parseFloat(priceClean) || 0,
                user_id: userId,
                votes_count: 0,
                is_building: false,
                short_id: Math.random().toString(36).substring(2, 8).toUpperCase(),
                created_at: new Date().toISOString()
              };
            }).filter(item => item !== null);

            if (mappedData.length === 0) {
              setErrors(['Nenhum projeto válido encontrado. Verifique os cabeçalhos do CSV (Titulo, Nicho, etc).']);
            } else {
              setParsedData(mappedData);
              setStep('PREVIEW');
            }
          },
          error: (error) => {
            setErrors([`Erro ao ler CSV: ${error.message}`]);
          }
        });
      } catch (err: any) {
        setErrors([`Erro fatal ao processar arquivo: ${err.message}`]);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = async () => {
    setStep('IMPORTING');
    try {
      // Batch insert para evitar timeout
      const batchSize = 50;
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        const { error } = await supabase.from('ideas').insert(batch);
        if (error) throw error;
      }
      
      onSuccess();
      onClose();
      reset();
    } catch (error: any) {
      setErrors([`Erro ao salvar no banco: ${error.message}`]);
      setStep('PREVIEW');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Importar Projetos</h2>
            <p className="text-sm text-gray-500">Validação e correção automática de CSV</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-grow overflow-y-auto p-8">
          
          {errors.length > 0 && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <h4 className="text-red-800 font-bold text-sm flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" /> Erros Encontrados
              </h4>
              <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {step === 'UPLOAD' && (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-2xl hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <p className="font-bold text-gray-700">Clique para selecionar o CSV</p>
              <p className="text-xs text-gray-400 mt-2">Suporta Excel, CSV com aspas e caracteres especiais</p>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.txt" className="hidden" />
            </div>
          )}

          {step === 'PREVIEW' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-bold text-blue-900">{parsedData.length} projetos identificados</p>
                    <p className="text-xs text-blue-700">Os dados foram limpos e formatados. Verifique abaixo antes de confirmar.</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 font-bold text-gray-600">Título</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Nicho</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Solução (Resumo)</th>
                      <th className="px-4 py-3 font-bold text-gray-600">Preço</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{item.title}</td>
                        <td className="px-4 py-2"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{item.niche}</span></td>
                        <td className="px-4 py-2 text-gray-500 truncate max-w-[200px]">{item.solution}</td>
                        <td className="px-4 py-2 text-gray-500">{item.price > 0 ? `R$ ${item.price}` : 'Grátis'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                   <div className="bg-gray-50 p-2 text-center text-xs text-gray-500 border-t border-gray-200">
                      ... e mais {parsedData.length - 5} itens
                   </div>
                )}
              </div>
            </div>
          )}

          {step === 'IMPORTING' && (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="w-12 h-12 text-black animate-spin mb-4" />
              <h3 className="font-bold text-lg">Importando Projetos...</h3>
              <p className="text-gray-500 text-sm">Isso pode levar alguns segundos.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-gray-600 hover:text-black font-medium transition-colors">
            Cancelar
          </button>
          {step === 'PREVIEW' && (
            <button onClick={handleImport} className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
              Confirmar Importação <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
