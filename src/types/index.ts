export interface User {
  id: number;
  username: string;
  email: string;
  name: string | null;
  bio: string | null;
  profile: string | null;
  role: "writer" | "admin";
  created_at: string;
  updated_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  refresh_token: string;
}

export interface PostTemplate {
  post_id: number;
  author_name: string;
  created_at: string;
  frontmatter_example: string;
}

export interface ImageUploadResponse {
  url: string;
}

export interface ViewsResponse {
  views: number;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  name?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleFinishRequest {
  username: string;
  register_token: string;
}

export interface GoogleFinishResponse {
  access_token: string;
  refresh_token: string;
  username: string;
  message: string;
}

export interface UpdateProfileRequest {
  name?: string | null;
  bio?: string | null;
  profile?: string | null;
}

export interface ApiError {
  detail: string | Array<{ type: string; loc: string[]; msg: string; input: any }>;
}
