export interface CommentRequest {
  content: string;
}

export interface CommentResponse {
  id: number;
  content: string;
  userId: number;
  fullName: string;
  productId: number;
  parentCommentId?: number | null;
  isStaffReply?: boolean;
  replies?: CommentResponse[];
  createdAt?: string;
  updatedAt?: string;
}
