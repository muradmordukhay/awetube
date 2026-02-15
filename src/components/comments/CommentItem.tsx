"use client";

import { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface CommentItemProps {
  comment: Comment;
  videoId: string;
  currentUserId?: string;
  videoOwnerId?: string;
  onEdit?: (commentId: string, newContent: string) => void;
  onDelete?: (commentId: string) => void;
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000
  );
  const intervals = [
    { label: "year", seconds: 31536000 },
    { label: "month", seconds: 2592000 },
    { label: "week", seconds: 604800 },
    { label: "day", seconds: 86400 },
    { label: "hour", seconds: 3600 },
    { label: "minute", seconds: 60 },
  ];
  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1)
      return `${count} ${interval.label}${count > 1 ? "s" : ""} ago`;
  }
  return "Just now";
}

export default function CommentItem({
  comment,
  videoId,
  currentUserId,
  videoOwnerId,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = currentUserId === comment.user.id;
  const isVideoOwner = currentUserId === videoOwnerId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isVideoOwner;
  const showMenu = canEdit || canDelete;

  const wasEdited =
    comment.updatedAt &&
    comment.createdAt !== comment.updatedAt;

  async function handleSaveEdit() {
    if (!editContent.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/videos/${videoId}/comments/${comment.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent.trim() }),
        }
      );
      if (res.ok) {
        onEdit?.(comment.id, editContent.trim());
        setEditing(false);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/videos/${videoId}/comments/${comment.id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        onDelete?.(comment.id);
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.user.image || undefined} />
        <AvatarFallback>
          {comment.user.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {timeAgo(comment.createdAt)}
          </span>
          {wasEdited && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
          {showMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-7 w-7"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                  <DropdownMenuItem
                    onClick={() => {
                      setEditContent(comment.content);
                      setEditing(true);
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {editing ? (
          <div className="mt-1 space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              className="resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || saving}
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm">{comment.content}</p>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-muted pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                videoId={videoId}
                currentUserId={currentUserId}
                videoOwnerId={videoOwnerId}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
