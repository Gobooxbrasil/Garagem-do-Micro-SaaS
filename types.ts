

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
  why_is_private?: boolean; 
  pricing_model: string;
  target: string;
  sales_strategy: string;
  pdr?: string; 
  votes_count: number;
  is_building: boolean;
  
  // Showroom Fields
  is_showroom?: boolean;
  showroom_description?: string;
  showroom_link?: string;
  showroom_image?: string; // Capa do projeto
  showroom_video_url?: string; // Link do Youtube (Showroom)
  showroom_objective?: 'feedback' | 'showcase'; // Testar ou Divulgar
  showroom_approved_at?: string;

  // New Field for Regular Ideas
  youtube_video_url?: string; // Legacy
  youtube_url?: string; // New Standard

  // Frontend states
  isFavorite?: boolean; 
  hasVoted?: boolean;
  isInterested?: boolean;

  created_at: string; 
  user_id?: string;
  images?: string[]; // Mantido para compatibilidade, mas showroom usa showroom_image preferencialmente
  
  // Monetization Fields
  payment_type?: 'free' | 'donation' | 'paid';
  monetization_type?: 'NONE' | 'DONATION' | 'PAID';
  price?: number;
  hidden_fields?: string[]; 
  contact_phone?: string;
  contact_email?: string;

  // Demo Info
  demo_email?: string;
  demo_password?: string;

  // View Fields (cached_ideas_with_stats)
  creator_name?: string | null;
  creator_avatar?: string | null;
  creator_email?: string | null;

  // Joined Profile Data (Legacy / Fallback)
  profiles?: {
    full_name: string;
    avatar_url: string;
    pix_key?: string; 
  };

  // New Relations
  idea_developers?: Developer[]; 
  idea_interested?: Interested[];
  idea_improvements?: Improvement[];
  idea_transactions?: Transaction[];
}

export interface Review {
  id: string;
  project_id?: string; 
  user_name: string;
  rating: number; // 1-5
  comment: string;
  maker_reply?: string;
  created_at?: string;
}

// Deprecated (Legacy Project Type) - Keeping for type safety in old components until fully migrated
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
  type: 'PDR_REQUEST' | 'SYSTEM' | 'NEW_IMPROVEMENT' | 'NEW_DEV' | 'NEW_VOTE' | 'NEW_INTEREST' | 'NEW_DONATION' | 'NEW_PURCHASE' | 'COMMENT_REPLY' | 'PIX_REQUEST' | 'FEEDBACK_UPDATE';
  read: boolean;
  payload: {
    idea_id?: string;
    idea_title?: string;
    message?: string;
    user_name?: string;
    user_avatar?: string;
    amount?: number;
    feedback_id?: string;
    link?: string; // Support generic links
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
  
  // Admin Fields
  is_admin?: boolean;
  is_blocked?: boolean;
  blocked_at?: string;
  blocked_reason?: string;
  created_at?: string;
}

// --- ROADMAP & FEEDBACK TYPES ---

export type FeedbackType = 'bug' | 'feature' | 'improvement' | 'other';
export type FeedbackStatus = 'pending' | 'planned' | 'in_progress' | 'completed' | 'rejected';

export interface Feedback {
  id: string;
  user_id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  votes_count: number;
  priority_score: number;
  created_at: string;
  hasVoted?: boolean;
  creator_name?: string;
  creator_avatar?: string;
  comments_count?: number;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface FeedbackComment {
  id: string;
  feedback_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface NPSResponse {
  id?: string;
  user_id: string;
  score: number;
  feedback?: string;
  created_at?: string;
}

export type AdminSubview = 'DASHBOARD' | 'USERS' | 'IDEAS' | 'SHOWROOM' | 'NPS' | 'FEEDBACK' | 'LOGS' | 'SETTINGS' | 'NOTIFICATIONS';

export type ViewState = 
  | { type: 'LANDING' }
  | { type: 'IDEAS' }
  | { type: 'SHOWROOM' }
  | { type: 'ROADMAP' }
  | { type: 'PROJECT_DETAIL'; projectId: string } 
  | { type: 'PROFILE' }
  | { type: 'ADMIN'; subview: AdminSubview }
  | { type: 'ADMIN_LOGIN' };

// SHOWROOM SPECIFIC TYPES
export interface ShowroomFilters {
  search?: string;
  category?: string;
  showFavorites?: boolean;
  myProjects?: boolean;
  sortBy?: 'recent' | 'votes';
  onlyShowroom?: boolean; 
}

// --- ADMIN TYPES ---

export interface AdminStats {
  total_users: number;
  blocked_users: number;
  total_ideas: number;
  total_showroom: number;
  total_roadmap: number;
  total_nps: number;
  avg_nps_score: number;
  total_feedback: number;
  total_votes: number;
  new_users_week: number;
  new_ideas_week: number;
}

export interface AdminLog {
  id: string;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: any;
  ip_address?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}