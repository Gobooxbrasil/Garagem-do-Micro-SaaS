
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
  votes_count: number;
  is_building: boolean;
  isFavorite?: boolean; // Frontend state only
  created_at: string; // ISO Date string (Matches DB column)
  user_id?: string;
  images?: string[];
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
}

export type ViewState = 
  | { type: 'LANDING' }
  | { type: 'IDEAS' }
  | { type: 'SHOWROOM' }
  | { type: 'PROJECT_DETAIL'; projectId: string };
