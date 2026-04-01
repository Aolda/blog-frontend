export interface User {
  id: number;
  keycloak_sub: string | null;
  username: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatar: string | null;
  role: "writer" | "admin";
  website: string | null;
  github: string | null;
  gitlab: string | null;
  linkedin: string | null;
  discord: string | null;
  mail: string | null;
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
  id: number;
  post_id: number;
  url: string;
}

export interface ImageResponse {
  id: number;
  post_id: number;
  url: string;
  created_at: string;
}

/** 서버가 생성하는 frontmatter 객체 */
export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  tags: string[];
  image: string;
  author: string[];
}

/** 게시글 목록 응답 (content 없음) */
export interface PostSummaryResponse {
  id: number;
  author_id: number | null;
  views: number;
  created_at: string;
  title: string | null;
  description: string | null;
  tags: string[];
  image: string | null;
  frontmatter: PostFrontmatter;
  frontmatter_header: string;
}

/** 게시글 상세 응답 (content 포함) */
export interface PostResponse extends PostSummaryResponse {
  content: string | null;
}

/** 게시글 저장 요청 (메타데이터 + 본문 분리) */
export interface PostContentUpdateRequest {
  title: string | null;
  description: string | null;
  tags: string[];
  image: string | null;
  content: string;
}

export interface ViewsResponse {
  views: number;
}

export interface UpdateProfileRequest {
  name?: string | null;
  bio?: string | null;
  avatar?: string | null;
  website?: string | null;
  github?: string | null;
  gitlab?: string | null;
  linkedin?: string | null;
  discord?: string | null;
  mail?: string | null;
}

export interface ApiError {
  detail: string | Array<{ type: string; loc: string[]; msg: string; input: any }>;
}

export interface AuthorResponse {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
  website: string | null;
  github: string | null;
  gitlab: string | null;
  linkedin: string | null;
  discord: string | null;
  mail: string | null;
}
