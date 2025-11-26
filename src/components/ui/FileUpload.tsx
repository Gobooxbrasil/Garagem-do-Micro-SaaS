
import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // em bytes
  preview?: boolean;
  label?: string;
}

export function FileUpload({ 
  onFileSelect, 
  accept = "image/png,image/jpeg,image/jpg,application/pdf", 
  maxSize = 2097152, // 2MB
  preview = true,
  label = "Upload do Comprovante"
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
      setFile(null);
      setPreviewUrl('');
      setError('');
      if (inputRef.current) inputRef.current.value = '';
      onFileSelect(null);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (!selectedFile) return;

    // Validar tamanho
    if (selectedFile.size > maxSize) {
      setError(`Arquivo muito grande. Máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Validar tipo (basico)
    // O accept do input já filtra na janela, mas é bom garantir
    
    setError('');
    setFile(selectedFile);
    onFileSelect(selectedFile);

    // Preview para imagens
    if (preview && selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
        setPreviewUrl('');
    }
  };

  return (
    <div className="w-full">
      <label className="block mb-2 text-xs font-bold text-gray-500 uppercase">
        {label} <span className="text-gray-400 font-normal normal-case">(Max 2MB)</span>
      </label>
      
      {!file ? (
          <div 
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-apple-blue transition-all group"
          >
              <Upload className="w-8 h-8 text-gray-400 group-hover:text-apple-blue mb-2 transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-apple-blue">Clique para selecionar</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG ou PDF</p>
          </div>
      ) : (
          <div className="relative bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 animate-in fade-in">
              <button 
                onClick={handleClear}
                className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:text-red-500 transition-colors"
                title="Remover arquivo"
              >
                  <X className="w-4 h-4" />
              </button>

              <div className="w-16 h-16 bg-white rounded-lg border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                      <FileText className="w-8 h-8 text-gray-400" />
                  )}
              </div>

              <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                  <div className="flex items-center gap-1 mt-1 text-xs font-bold text-green-600">
                      <CheckCircle className="w-3 h-3" /> Arquivo pronto
                  </div>
              </div>
          </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />

      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            {error}
        </div>
      )}
    </div>
  );
}