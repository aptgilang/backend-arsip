// Data models for the application

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface ArchiveItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  file_url: string;
  file_metadata: {
    name: string;
    size: number;
    type: string;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FileMetadata {
  id: string;
  original_name: string;
  stored_name: string;
  size: number;
  mime_type: string;
  archive_item_id: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  session: any;
}

export interface SearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  created_after?: string;
  created_before?: string;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalArchives: number;
  timestamp: string;
}

// Supabase specific types
export interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number;
  token_type: string;
  user: SupabaseUser;
}
