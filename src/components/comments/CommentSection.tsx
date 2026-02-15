"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import CommentItem from "./CommentItem";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  user: CommentUser;
  replies?: Comment[];
  _count?: { replies: number };
}

interface CommentSectionProps {
  videoId: string;
  commentCount: number;
  videoOwnerId?: string;
}

function updateCommentInTree(
  comments: Comment[],
  commentId: string,
  newContent: string
): Comment[] {
  return comments.map((c) => {
    if (c.id === commentId) {
      return { ...c, content: newContent, updatedAt: new Date().toISOString() };
    }
    if (c.replies) {
      return {
        ...c,
        replies: updateCommentInTree(c.replies, commentId, newContent),
      };
    }
    return c;
  });
}

function removeCommentFromTree(
  comments: Comment[],
  commentId: string
): Comment[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => {
      if (c.replies) {
        return {
          ...c,
          replies: removeCommentFromTree(c.replies, commentId),
        };
      }
      return c;
    });
}

export default function CommentSection({
  videoId,
  commentCount,
  videoOwnerId,
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.items);
      }
    } catch {
      console.error("Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
      }
    } catch {
      console.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (commentId: string, newContent: string) => {
    setComments((prev) => updateCommentInTree(prev, commentId, newContent));
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) => removeCommentFromTree(prev, commentId));
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <MessageSquare className="h-5 w-5" />
        {commentCount} Comments
      </h3>

      {/* New comment */}
      {session?.user ? (
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={session.user.image || undefined} />
            <AvatarFallback>
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewComment("")}
                disabled={!newComment}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Sign in to leave a comment.
        </p>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments...</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              videoId={videoId}
              currentUserId={session?.user?.id}
              videoOwnerId={videoOwnerId}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
