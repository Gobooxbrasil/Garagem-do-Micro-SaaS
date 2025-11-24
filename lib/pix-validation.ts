
export function validatePixKey(key: string, type: string): boolean {
  if (!key) return false;
  
  switch (type) {
    case 'cpf':
      // Remove caracteres não numéricos para validar tamanho, mas regex valida formato
      // Formato esperado: 000.000.000-00 ou apenas números
      const cpfClean = key.replace(/\D/g, '');
      return cpfClean.length === 11;
    case 'cnpj':
      const cnpjClean = key.replace(/\D/g, '');
      return cnpjClean.length === 14;
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
    case 'phone':
      // Aceita +55... ou apenas numeros com DDD
      const phoneClean = key.replace(/\D/g, '');
      return phoneClean.length >= 10 && phoneClean.length <= 14;
    case 'random':
      // Chave aleatória (EVP) tem 32 chars alfanuméricos + hífens (36 total)
      return key.length >= 32;
    default:
      return false;
  }
}

export function formatPixKey(key: string, type: string): string {
  if (!key) return '';
  
  switch (type) {
    case 'cpf':
      const cpf = key.replace(/\D/g, '');
      return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').substring(0, 14);
    case 'cnpj':
      const cnpj = key.replace(/\D/g, '');
      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5').substring(0, 18);
    case 'phone':
      const phone = key.replace(/\D/g, '');
      if (phone.length === 11) {
          return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      }
      return key;
    default:
      return key;
  }
}