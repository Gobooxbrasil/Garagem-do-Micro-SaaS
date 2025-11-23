

export interface Idea {
  id: string;
  niche: string;
  title: string;
  pain: string;
  solution: string;
  why: string;
  pricing_model: string;
  target: string;
  sales_strategy: string;
  pdr?: string; // Product Definition Requirements
  votes_count: number;
  is_building: boolean;
  isFavorite?: boolean; // Frontend state only
  created_at: string; // ISO Date string (Matches DB column)
  user_id?: string;
  images?: string[];
  
  // Monetization Fields
  monetization_type?: 'NONE' | 'DONATION' | 'PAID';
  price?: number;
  hidden_fields?: string[]; // 'pain' | 'solution' | 'pdr' | 'why' ...
  contact_phone?: string;
  contact_email?: string;

  // Joined Profile Data
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
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
  type: 'PDR_REQUEST' | 'SYSTEM';
  read: boolean;
  payload: {
    idea_id?: string;
    idea_title?: string;
    message?: string;
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