
import QRCode from 'qrcode';

// Calcula CRC16 (CCITT-FALSE)
function getCRC16(payload: string): string {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

// Formata campos TLV (Type-Length-Value)
function formatField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

function normalizeStr(str: string): string {
    return str.substring(0, 25)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, "") // Remove acentos
        .toUpperCase();
}

export function generatePixPayload(data: {
  key: string;
  name: string;
  city?: string;
  amount?: number;
  txId?: string;
}): string {
  const { key, name, city = 'SAO PAULO', amount, txId = '***' } = data;

  const cleanName = normalizeStr(name);
  const cleanCity = normalizeStr(city);
  
  // 00 - Payload Format Indicator
  // 26 - Merchant Account Information (GUI + Key)
  // 52 - Merchant Category Code
  // 53 - Transaction Currency (986 = BRL)
  // 54 - Transaction Amount (Optional)
  // 58 - Country Code
  // 59 - Merchant Name
  // 60 - Merchant City
  // 62 - Additional Data Field Template (TxID)
  
  let payload = 
    formatField('00', '01') +
    formatField('26', 
      formatField('00', 'br.gov.bcb.pix') + 
      formatField('01', key)
    ) +
    formatField('52', '0000') +
    formatField('53', '986');

  if (amount && amount > 0) {
    payload += formatField('54', amount.toFixed(2));
  }

  payload += 
    formatField('58', 'BR') +
    formatField('59', cleanName) +
    formatField('60', cleanCity) +
    formatField('62', 
      formatField('05', txId || '***')
    );

  // Adiciona ID do CRC16 (63) + Comprimento (04)
  payload += '6304';

  // Calcula e anexa CRC
  payload += getCRC16(payload);

  return payload;
}

export async function generatePixQRCode(pixData: {
  key: string;
  beneficiary: string;
  city?: string;
  amount?: number;
}): Promise<string> {
  const payload = generatePixPayload({
      key: pixData.key,
      name: pixData.beneficiary,
      city: pixData.city,
      amount: pixData.amount
  });
  
  // Gera Data URL da imagem
  try {
      const url = await QRCode.toDataURL(payload, {
          width: 300,
          margin: 2,
          color: {
              dark: '#000000',
              light: '#ffffff'
          }
      });
      return url;
  } catch (err) {
      console.error("Erro ao gerar QR Code", err);
      return '';
  }
}