export interface CommentAuthor {
  id: string;
  name: string;
  image: string | null;
}

export interface CommentResponse {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
  parentId: string | null;
  replyCount: number;
  likeCount: number;
}
