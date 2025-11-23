
export interface Developer {
  id: string; // ID da relação
  user_id: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  created_at: string;
}

export interface Interested {
  id: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Improvement {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id?: string | null;
  thread_level?: number;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  replies?: Improvement[]; // Frontend helper for threading
}

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: 'donation' | 'purchase';
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Idea {
  id: string;
  short_id?: string; // Código Único (ex: PROJ-1234)
  niche: string;
  title: string;
  pain: string;
  solution: string;
  why: string;
  why_is_private?: boolean; // CORRIGIDO: Campo correto do banco
  pricing_model: string;
  target: string;
  sales_strategy: string;
  pdr?: string; // Product Definition Requirements
  votes_count: number;
  is_building: boolean;
  
  // Frontend states
  isFavorite?: boolean; 
  hasVoted?: boolean;
  isInterested?: boolean;

  created_at: string; // ISO Date string (Matches DB column)
  user_id?: string;
  images?: string[];
  
  // Monetization Fields (Updated to match new DB schema)
  payment_type?: 'free' | 'donation' | 'paid'; // Matches DB check constraint
  monetization_type?: 'NONE' | 'DONATION' | 'PAID'; // Keep for backward compatibility if needed
  price?: number;
  hidden_fields?: string[]; // 'pain' | 'solution' | 'pdr' | 'why' ...
  contact_phone?: string;
  contact_email?: string;

  // View Fields (cached_ideas_with_stats)
  creator_name?: string | null;
  creator_avatar?: string | null;
  creator_email?: string | null;

  // Joined Profile Data (Legacy / Fallback)
  profiles?: {
    full_name: string;
    avatar_url: string;
    pix_key?: string; // Needed for check
  };

  // New Relations
  idea_developers?: Developer[]; // Legacy/Alternative
  idea_interested?: Interested[];
  idea_improvements?: Improvement[];
  idea_transactions?: Transaction[];
}

export interface Review {
  id: string;
  project_id?: string; // Matches DB column
  user_name: string;
  rating: number; // 1-5
  comment: string;
  maker_reply?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  images: string[];
  link_url: string;
  demo_email?: string;
  demo_password?: string;
  maker_id: string;
  reviews?: Review[];
  created_at?: string;
  user_id?: string;

  // Joined Profile Data
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Notification {
  id: string;
  created_at: string;
  recipient_id: string;
  sender_id: string;
  sender_email?: string;
  type: 'PDR_REQUEST' | 'SYSTEM' | 'NEW_IMPROVEMENT' | 'NEW_DEV' | 'NEW_VOTE' | 'NEW_INTEREST' | 'NEW_DONATION' | 'NEW_PURCHASE' | 'COMMENT_REPLY' | 'PIX_REQUEST';
  read: boolean;
  payload: {
    idea_id?: string;
    idea_title?: string;
    message?: string;
    user_name?: string;
    user_avatar?: string;
    amount?: number;
  };
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  pix_key?: string;
  pix_key_type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pix_name?: string;
  pix_bank?: string;
}

export type ViewState = 
  | { type: 'LANDING' }
  | { type: 'IDEAS' }
  | { type: 'SHOWROOM' }
  | { type: 'PROJECT_DETAIL'; projectId: string }
  | { type: 'PROFILE' };
