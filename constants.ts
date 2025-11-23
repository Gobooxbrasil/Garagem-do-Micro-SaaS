
import { Idea, Project } from './types';

export const PRESET_NICHES = [
  "Finanças",
  "Saúde & Bem-estar",
  "Pet",
  "Educação",
  "Produtividade",
  "Marketing",
  "Vendas",
  "RH & Gestão",
  "Jurídico",
  "Imobiliário",
  "Agro",
  "Logística",
  "Developer Tools",
  "Creator Economy",
  "IA & Machine Learning",
  "E-commerce",
  "Construção Civil",
  "Alimentação",
  "Transporte",
  "Turismo"
];

export const INITIAL_IDEAS: Idea[] = [
  {
    id: '1',
    niche: 'Jurídico',
    title: 'DocuMatch Legal',
    pain: 'Advogados perdem horas formatando contratos repetitivos manualmente.',
    solution: 'Plugin para Word que usa IA para preencher cláusulas variáveis automaticamente baseado em um formulário web.',
    why: 'Integração nativa onde eles já trabalham (Word) vs plataformas complexas de CLM.',
    pricing_model: 'SaaS Mensal (R$ 97/mês)',
    target: 'B2B (Pequenos Escritórios)',
    sales_strategy: 'SEO para "modelos de contrato" e Parcerias com OABs locais.',
    pdr: 'STACK SUGERIDA:\n- Frontend: React + Office.js Add-in API\n- Backend: Node.js (Express)\n- IA: OpenAI API (GPT-4-turbo) para parsing de texto\n\nFLUXO:\n1. Usuário abre sidebar no Word.\n2. Seleciona tipo de contrato.\n3. Preenche inputs variáveis.\n4. IA substitui placeholders no documento ativo.',
    votes_count: 42,
    is_building: false,
    isFavorite: false,
    created_at: '2023-10-25T10:00:00Z',
    images: []
  },
  {
    id: '2',
    niche: 'Pet',
    title: 'VetAgenda Zap',
    pain: 'Clínicas perdem 30% dos agendamentos por no-show (cliente esquece).',
    solution: 'Sistema de agendamento que envia lembretes automáticos e confirmações via WhatsApp sem intervenção humana.',
    why: 'Foco exclusivo em WhatsApp (Brasil), diferente de softwares americanos de email.',
    pricing_model: 'Taxa por agendamento confirmado ou Fixo Mensal',
    target: 'B2B (Clínicas Veterinárias)',
    sales_strategy: 'Cold Calling e visitas presenciais.',
    pdr: 'REQUISITOS TÉCNICOS:\n- Integração oficial WhatsApp Business API (via Twilio ou Waha).\n- Cron jobs para disparos agendados.\n- Webhooks para capturar resposta do cliente (Sim/Não).',
    votes_count: 128,
    is_building: true,
    isFavorite: true,
    created_at: '2023-10-28T14:30:00Z',
    images: []
  },
  {
    id: '3',
    niche: 'Creator Economy',
    title: 'ThumbTester',
    pain: 'Youtubers não sabem qual thumbnail terá maior CTR antes de publicar.',
    solution: 'Plataforma de A/B testing rápido onde usuários reais votam na melhor thumb em troca de gamificação.',
    why: 'Feedback humano real vs IA genérica.',
    pricing_model: 'Freemium (créditos pagos)',
    target: 'B2C (YouTubers iniciantes e médios)',
    sales_strategy: 'Influencer Marketing (canais de dicas para youtubers).',
    votes_count: 85,
    is_building: false,
    isFavorite: false,
    created_at: '2023-10-20T09:15:00Z',
    images: []
  },
  {
    id: '4',
    niche: 'Finanças',
    title: 'FreelaTax Brasil',
    pain: 'Freelancers não sabem calcular impostos (Simples vs MEI vs Carne Leão).',
    solution: 'Calculadora preditiva que conecta na conta bancária e avisa quando vale a pena mudar de regime tributário.',
    why: 'Contadores tradicionais ignoram pequenos freelancers.',
    pricing_model: 'Assinatura Anual',
    target: 'B2C (Freelancers)',
    sales_strategy: 'Conteúdo no Instagram/TikTok sobre impostos.',
    votes_count: 56,
    is_building: false,
    isFavorite: false,
    created_at: '2023-11-01T11:00:00Z',
    images: []
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: '101',
    name: 'Financeiro.io',
    tagline: 'Gestão financeira simples para freelancers brasileiros.',
    description: 'O Financeiro.io remove a complexidade dos ERPs tradicionais. Focado em quem vende horas ou projetos. Emita notas, controle fluxo de caixa e saiba exatamente quanto pode gastar no fim de semana.',
    images: [
      'https://picsum.photos/800/600?random=1',
      'https://picsum.photos/800/600?random=2',
      'https://picsum.photos/800/600?random=3',
    ],
    link_url: 'https://financeiro.io.exemplo',
    demo_email: 'visitante@financeiro.io',
    demo_password: 'senha_segura_123',
    maker_id: 'dev_pedro',
    reviews: [
      {
        id: 'r1',
        project_id: '101',
        user_name: 'Ana Designer',
        rating: 5,
        comment: 'Finalmente algo que não parece uma planilha de Excel dos anos 90. Interface linda!',
        maker_reply: 'Obrigado Ana! O foco no UX foi total.',
        created_at: '2023-10-15'
      },
      {
        id: 'r2',
        project_id: '101',
        user_name: 'Carlos Dev',
        rating: 4,
        comment: 'Muito bom, mas falta integração com Nubank.',
        created_at: '2023-10-20'
      }
    ]
  },
  {
    id: '102',
    name: 'MenuDigital QR',
    tagline: 'Cardápios digitais que carregam instantaneamente.',
    description: 'A maioria dos cardápios em PDF são pesados e difíceis de ler no celular. O MenuDigital cria uma página web responsiva ultra-rápida para restaurantes, gerando o QR Code automaticamente.',
    images: [
      'https://picsum.photos/800/600?random=4',
      'https://picsum.photos/800/600?random=5',
    ],
    link_url: 'https://menudigital.exemplo',
    maker_id: 'dev_lucia',
    reviews: []
  }
];
