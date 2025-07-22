export type Post = {
    id: number;
    title: string;
    content: string;
    author: string;
    created_at: string;
    updated_at: string;
    reply_count: number;
  }
  
  export type PostListResponse = {
    results: Post[];
    total: number;
    num_pages: number;
    current_page: number;
  }

  export type Reply = {
    id: number;
    content: string;
    author: string;
    created_at: string;
    updated_at?: string;
    parent_reply_id: number | null;
    child_replies?: Reply[];
  }

  export type PostDetail = {
    id: number;
    title: string;
    content: string;
    author: string;
    created_at: string;
    updated_at: string;
    reply_count: number;
    replies: Reply[];
  }