import { api } from './api';

type PageResponse<T> = { content: T[]; totalElements: number; totalPages: number };

export interface CommentResponse {
  id: number;
  content: string;
  user_id?: number;
  user_full_name?: string;
  product_id?: number;
  parent_comment_id?: number | null;
  created_at?: string;
}

export const commentService: any = {
  // Admin: list all comments (paged)
  getComments: async (params?: { page?: number; size?: number }) => {
    const res: any = await api.get('/comments', { params });
    const payload = res && res.data ? res.data : res;
    return payload as PageResponse<CommentResponse> | CommentResponse[];
  },

  getCommentById: async (id: number) => {
    const res: any = await api.get(`/comments/${id}`);
    const payload = res && res.data ? res.data : res;
    return payload as CommentResponse;
  },

  deleteComment: async (id: number) => {
    const res: any = await api.delete(`/comments/${id}`);
    return res && res.data ? res.data : res;
  },

  replyToComment: async (id: number, payload: { content: string; user_id: number }) => {
    const res: any = await api.post(`/comments/${id}/reply/user/${payload.user_id}`, { content: payload.content });
    return res && res.data ? res.data : res;
  }
};

export default commentService;

// Backwards-compatible helpers expected by older pages
export function normalizeComment(raw: any) {
  if (!raw) return raw;
  const r: any = raw.data ?? raw;
  const normalized: any = {
    id: r.id ?? r._id,
    content: r.content,
    userId: r.user_id ?? r.userId ?? r.user?.id,
    fullName: r.user_full_name ?? r.full_name ?? r.user?.fullName ?? r.user?.full_name ?? r.fullName,
    productId: r.product_id ?? r.productId ?? r.product?.id,
    parentCommentId: r.parent_comment_id ?? r.parentCommentId ?? r.parent_comment?.id ?? null,
    createdAt: r.created_at ?? r.createdAt,
    updatedAt: r.updated_at ?? r.updatedAt,
    replies: undefined,
  };

  const children = r.replies ?? r.children ?? r.children_comments ?? r.child_comments ?? [];
  if (Array.isArray(children) && children.length > 0) {
    normalized.replies = children.map(normalizeComment);
  }

  return normalized;
}

// Older API shape compatibility
commentService.getRootCommentsByProduct = async (productId: number) => {
  const res: any = await api.get(`/comments/product/${productId}`);
  const payload = res && res.data ? res.data : res;
  return payload;
};

commentService.createComment = async (productId: number, payload: { content: string }) => {
  const res: any = await api.post(`/comments/product/${productId}`, payload);
  const data = res && res.data ? res.data : res;
  return data;
};

commentService.replyComment = async (commentId: number, payload: { content: string }) => {
  const res: any = await api.post(`/comments/${commentId}/reply`, payload);
  const data = res && res.data ? res.data : res;
  return data;
};

commentService.updateComment = async (id: number, payload: { content: string }) => {
  const res: any = await api.put(`/comments/${id}`, payload);
  const data = res && res.data ? res.data : res;
  return data;
};
