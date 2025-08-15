export interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  updated_at: string;
  isHot?: boolean;
  isRecommended?: boolean;
}

export interface PostListResponse {
  results: Post[];
  total: number;
  num_pages: number;
  current_page: number;
}

export interface PostDetail extends Post {
  replies: Reply[];
}

export interface Reply {
  id: number;
  content: string;
  author: string;
  created_at: string;
  parent_reply_id: number | null;
  replies?: Reply[]; // 子回复
}

export interface CreateReplyRequest {
  content: string;
  parent_reply_id?: number;
}

export interface CreateReplyResponse {
  success: boolean;
  msg: string;
  reply: Reply;
}