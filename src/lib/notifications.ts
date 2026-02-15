import { db } from "@/lib/db";

export async function notifySubscribersOfNewVideo(
  channelId: string,
  videoId: string,
  uploaderUserId: string
) {
  const subscribers = await db.subscription.findMany({
    where: { channelId },
    select: { userId: true },
  });

  if (subscribers.length === 0) return;

  await db.notification.createMany({
    data: subscribers
      .filter((s) => s.userId !== uploaderUserId)
      .map((s) => ({
        userId: s.userId,
        type: "NEW_VIDEO" as const,
        actorId: uploaderUserId,
        videoId,
      })),
  });
}

export async function notifyCommentReply(
  parentCommentUserId: string,
  replyUserId: string,
  videoId: string,
  commentId: string
) {
  // Don't notify if replying to yourself
  if (parentCommentUserId === replyUserId) return;

  await db.notification.create({
    data: {
      userId: parentCommentUserId,
      type: "COMMENT_REPLY",
      actorId: replyUserId,
      videoId,
      commentId,
    },
  });
}
