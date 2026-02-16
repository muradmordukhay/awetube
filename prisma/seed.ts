import {
  PrismaClient,
  VideoStatus,
  NotificationType,
  PlaylistVisibility,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function main() {
  console.log("🌱 Seeding database...\n");

  // ── Clean existing data (reverse FK dependency order) ──────────────
  console.log("Cleaning existing data...");
  await prisma.notification.deleteMany();
  await prisma.watchHistory.deleteMany();
  await prisma.playlistItem.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.like.deleteMany();
  await prisma.videoTag.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.video.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  // ── Users ──────────────────────────────────────────────────────────
  console.log("Creating users...");
  const passwordHash = await hash("password123", 12);

  const demoUser = await prisma.user.create({
    data: {
      id: "user_demo",
      email: "demo@awetube.com",
      name: "Demo User",
      passwordHash,
    },
  });

  const sarah = await prisma.user.create({
    data: {
      id: "user_sarah",
      email: "sarah@awetube.com",
      name: "Sarah Chen",
      passwordHash,
    },
  });

  const marcus = await prisma.user.create({
    data: {
      id: "user_marcus",
      email: "marcus@awetube.com",
      name: "Marcus Johnson",
      passwordHash,
    },
  });

  const priya = await prisma.user.create({
    data: {
      id: "user_priya",
      email: "priya@awetube.com",
      name: "Priya Patel",
      passwordHash,
    },
  });

  // ── Channels ───────────────────────────────────────────────────────
  console.log("Creating channels...");
  const chanDemo = await prisma.channel.create({
    data: {
      id: "chan_demo",
      userId: demoUser.id,
      handle: "demouser",
      name: "Demo User",
      description: "Exploring web development, one video at a time",
    },
  });

  const chanSarah = await prisma.channel.create({
    data: {
      id: "chan_sarah",
      userId: sarah.id,
      handle: "sarahchen",
      name: "Sarah Chen",
      description: "Full-stack developer sharing tutorials and tips",
    },
  });

  const chanMarcus = await prisma.channel.create({
    data: {
      id: "chan_marcus",
      userId: marcus.id,
      handle: "marcusjohnson",
      name: "Marcus Johnson",
      description: "DevOps engineer and cloud architecture enthusiast",
    },
  });

  const chanPriya = await prisma.channel.create({
    data: {
      id: "chan_priya",
      userId: priya.id,
      handle: "priyapatel",
      name: "Priya Patel",
      description: "UI/UX designer turned frontend developer",
    },
  });

  // ── Tags ───────────────────────────────────────────────────────────
  console.log("Creating tags...");
  const tags = await Promise.all(
    [
      { id: "tag_nextjs", name: "nextjs" },
      { id: "tag_react", name: "react" },
      { id: "tag_typescript", name: "typescript" },
      { id: "tag_prisma", name: "prisma" },
      { id: "tag_docker", name: "docker" },
      { id: "tag_css", name: "css" },
      { id: "tag_postgresql", name: "postgresql" },
      { id: "tag_devops", name: "devops" },
    ].map((t) => prisma.tag.create({ data: t }))
  );

  // ── Videos ─────────────────────────────────────────────────────────
  console.log("Creating videos...");

  // Demo User's videos
  const vid1 = await prisma.video.create({
    data: {
      id: "vid_1",
      channelId: chanDemo.id,
      title: "Building a REST API with Next.js App Router",
      description:
        "Learn how to create type-safe API routes with Next.js 16, Zod validation, and Prisma ORM. We cover route handlers, middleware patterns, and error handling best practices.",
      status: VideoStatus.READY,
      duration: 1245,
      width: 1920,
      height: 1080,
      viewCount: 15420,
      likeCount: 892,
      publishedAt: daysAgo(28),
      createdAt: daysAgo(28),
    },
  });

  const vid2 = await prisma.video.create({
    data: {
      id: "vid_2",
      channelId: chanDemo.id,
      title: "Authentication in Next.js - Complete Guide",
      description:
        "From credentials to OAuth, sessions to JWTs - everything you need to know about auth in Next.js. Covers NextAuth v5 setup, Google and GitHub providers, and protecting API routes.",
      status: VideoStatus.READY,
      duration: 2100,
      width: 1920,
      height: 1080,
      viewCount: 32100,
      likeCount: 2150,
      publishedAt: daysAgo(25),
      createdAt: daysAgo(25),
    },
  });

  const vid3 = await prisma.video.create({
    data: {
      id: "vid_3",
      channelId: chanDemo.id,
      title: "Prisma ORM Crash Course for Beginners",
      description:
        "Get started with Prisma - schema design, migrations, queries, and relations explained. Build a complete data layer for your Next.js application from scratch.",
      status: VideoStatus.READY,
      duration: 1800,
      width: 1920,
      height: 1080,
      viewCount: 28500,
      likeCount: 1830,
      publishedAt: daysAgo(22),
      createdAt: daysAgo(22),
    },
  });

  const vid4 = await prisma.video.create({
    data: {
      id: "vid_4",
      channelId: chanDemo.id,
      title: "Deploying Next.js with Docker",
      description:
        "Multi-stage Docker builds, docker-compose setup, and production deployment strategies for Next.js applications. Includes CI/CD pipeline integration.",
      status: VideoStatus.READY,
      duration: 1560,
      width: 1920,
      height: 1080,
      viewCount: 9870,
      likeCount: 654,
      publishedAt: daysAgo(19),
      createdAt: daysAgo(19),
    },
  });

  // Sarah's videos
  const vid5 = await prisma.video.create({
    data: {
      id: "vid_5",
      channelId: chanSarah.id,
      title: "React 19 Server Components Deep Dive",
      description:
        "Understanding the new server component model, async components, and streaming SSR. See how React 19 changes the way we build full-stack applications.",
      status: VideoStatus.READY,
      duration: 2400,
      width: 1920,
      height: 1080,
      viewCount: 45200,
      likeCount: 3200,
      publishedAt: daysAgo(16),
      createdAt: daysAgo(16),
    },
  });

  const vid6 = await prisma.video.create({
    data: {
      id: "vid_6",
      channelId: chanSarah.id,
      title: "TypeScript Generics - From Zero to Hero",
      description:
        "Master TypeScript generics with practical examples and real-world patterns. Covers utility types, conditional types, mapped types, and generic constraints.",
      status: VideoStatus.READY,
      duration: 1920,
      width: 1920,
      height: 1080,
      viewCount: 22300,
      likeCount: 1560,
      publishedAt: daysAgo(13),
      createdAt: daysAgo(13),
    },
  });

  const vid7 = await prisma.video.create({
    data: {
      id: "vid_7",
      channelId: chanSarah.id,
      title: "Tailwind CSS 4 - What Changed and Why",
      description:
        "Breaking down the new Tailwind CSS engine, CSS-first configuration, and migration guide. Explore the performance improvements and new utility classes.",
      status: VideoStatus.READY,
      duration: 1680,
      width: 1920,
      height: 1080,
      viewCount: 18700,
      likeCount: 1120,
      publishedAt: daysAgo(10),
      createdAt: daysAgo(10),
    },
  });

  // Marcus's videos
  const vid8 = await prisma.video.create({
    data: {
      id: "vid_8",
      channelId: chanMarcus.id,
      title: "PostgreSQL Performance Tuning Tips",
      description:
        "Index optimization, query analysis with EXPLAIN, and connection pooling best practices. Practical tips to make your PostgreSQL database faster.",
      status: VideoStatus.READY,
      duration: 2040,
      width: 1920,
      height: 1080,
      viewCount: 12600,
      likeCount: 890,
      publishedAt: daysAgo(8),
      createdAt: daysAgo(8),
    },
  });

  const vid9 = await prisma.video.create({
    data: {
      id: "vid_9",
      channelId: chanMarcus.id,
      title: "CI/CD Pipeline with GitHub Actions",
      description:
        "Automate testing, linting, building, and deployment with GitHub Actions workflows. Set up a complete continuous integration pipeline for your project.",
      status: VideoStatus.READY,
      duration: 1380,
      width: 1920,
      height: 1080,
      viewCount: 8900,
      likeCount: 620,
      publishedAt: daysAgo(5),
      createdAt: daysAgo(5),
    },
  });

  const vid10 = await prisma.video.create({
    data: {
      id: "vid_10",
      channelId: chanMarcus.id,
      title: "Docker Multi-Stage Builds Explained",
      description:
        "Optimize your Docker images with multi-stage builds for Node.js applications. Reduce image size, improve security, and speed up deployments.",
      status: VideoStatus.READY,
      duration: 1140,
      width: 1920,
      height: 1080,
      viewCount: 14200,
      likeCount: 980,
      publishedAt: daysAgo(4),
      createdAt: daysAgo(4),
    },
  });

  // Priya's videos
  const vid11 = await prisma.video.create({
    data: {
      id: "vid_11",
      channelId: chanPriya.id,
      title: "Responsive Design with Modern CSS",
      description:
        "Container queries, :has() selector, and subgrid - modern CSS layout techniques that replace complex JavaScript solutions with elegant stylesheets.",
      status: VideoStatus.READY,
      duration: 1740,
      width: 1920,
      height: 1080,
      viewCount: 19800,
      likeCount: 1340,
      publishedAt: daysAgo(2),
      createdAt: daysAgo(2),
    },
  });

  const vid12 = await prisma.video.create({
    data: {
      id: "vid_12",
      channelId: chanPriya.id,
      title: "Building Accessible UI Components",
      description:
        "ARIA patterns, keyboard navigation, and screen reader testing for React components. Make your web applications usable by everyone.",
      status: VideoStatus.READY,
      duration: 2160,
      width: 1920,
      height: 1080,
      viewCount: 11300,
      likeCount: 870,
      publishedAt: daysAgo(1),
      createdAt: daysAgo(1),
    },
  });

  // ── Video Tags ─────────────────────────────────────────────────────
  console.log("Creating video tags...");
  const videoTagData = [
    { videoId: vid1.id, tagId: "tag_nextjs" },
    { videoId: vid1.id, tagId: "tag_prisma" },
    { videoId: vid1.id, tagId: "tag_typescript" },
    { videoId: vid2.id, tagId: "tag_nextjs" },
    { videoId: vid2.id, tagId: "tag_typescript" },
    { videoId: vid3.id, tagId: "tag_prisma" },
    { videoId: vid3.id, tagId: "tag_typescript" },
    { videoId: vid3.id, tagId: "tag_postgresql" },
    { videoId: vid4.id, tagId: "tag_nextjs" },
    { videoId: vid4.id, tagId: "tag_docker" },
    { videoId: vid5.id, tagId: "tag_react" },
    { videoId: vid5.id, tagId: "tag_typescript" },
    { videoId: vid6.id, tagId: "tag_typescript" },
    { videoId: vid7.id, tagId: "tag_css" },
    { videoId: vid8.id, tagId: "tag_postgresql" },
    { videoId: vid8.id, tagId: "tag_devops" },
    { videoId: vid9.id, tagId: "tag_devops" },
    { videoId: vid10.id, tagId: "tag_docker" },
    { videoId: vid10.id, tagId: "tag_devops" },
    { videoId: vid11.id, tagId: "tag_css" },
    { videoId: vid11.id, tagId: "tag_react" },
    { videoId: vid12.id, tagId: "tag_react" },
    { videoId: vid12.id, tagId: "tag_typescript" },
  ];

  await Promise.all(
    videoTagData.map((vt) => prisma.videoTag.create({ data: vt }))
  );

  // ── Comments ───────────────────────────────────────────────────────
  console.log("Creating comments...");

  // Comments on vid_1 (Building a REST API)
  const cmt1 = await prisma.comment.create({
    data: {
      id: "cmt_1",
      videoId: vid1.id,
      userId: sarah.id,
      content:
        "Great walkthrough! The Zod validation part was especially helpful.",
      createdAt: daysAgo(27),
    },
  });

  const cmt2 = await prisma.comment.create({
    data: {
      id: "cmt_2",
      videoId: vid1.id,
      userId: marcus.id,
      content:
        "Would love to see a follow-up on rate limiting and error handling.",
      createdAt: daysAgo(26),
    },
  });

  const cmt3 = await prisma.comment.create({
    data: {
      id: "cmt_3",
      videoId: vid1.id,
      userId: demoUser.id,
      content: "That is actually in the works! Stay tuned.",
      parentId: cmt2.id,
      createdAt: daysAgo(26),
    },
  });

  await prisma.comment.create({
    data: {
      id: "cmt_4",
      videoId: vid1.id,
      userId: priya.id,
      content: "Clean code examples. Subscribed!",
      createdAt: daysAgo(25),
    },
  });

  // Comments on vid_5 (React 19 Server Components)
  await prisma.comment.create({
    data: {
      id: "cmt_5",
      videoId: vid5.id,
      userId: demoUser.id,
      content:
        "This finally made server components click for me. Thank you!",
      createdAt: daysAgo(15),
    },
  });

  const cmt6 = await prisma.comment.create({
    data: {
      id: "cmt_6",
      videoId: vid5.id,
      userId: marcus.id,
      content: "The streaming SSR section was mind-blowing.",
      createdAt: daysAgo(14),
    },
  });

  const cmt7 = await prisma.comment.create({
    data: {
      id: "cmt_7",
      videoId: vid5.id,
      userId: sarah.id,
      content:
        "Thanks Marcus! It is definitely a game changer for performance.",
      parentId: cmt6.id,
      createdAt: daysAgo(14),
    },
  });

  const cmt8 = await prisma.comment.create({
    data: {
      id: "cmt_8",
      videoId: vid5.id,
      userId: priya.id,
      content: "How does this affect client-side state management?",
      createdAt: daysAgo(13),
    },
  });

  const cmt9 = await prisma.comment.create({
    data: {
      id: "cmt_9",
      videoId: vid5.id,
      userId: sarah.id,
      content: "Great question! I will cover that in a dedicated video.",
      parentId: cmt8.id,
      createdAt: daysAgo(13),
    },
  });

  // Comments on vid_8 (PostgreSQL Performance)
  await prisma.comment.create({
    data: {
      id: "cmt_10",
      videoId: vid8.id,
      userId: demoUser.id,
      content:
        "The EXPLAIN analysis tips saved me hours of debugging.",
      createdAt: daysAgo(7),
    },
  });

  await prisma.comment.create({
    data: {
      id: "cmt_11",
      videoId: vid8.id,
      userId: sarah.id,
      content:
        "Connection pooling is so underrated. Great coverage.",
      createdAt: daysAgo(6),
    },
  });

  // Comments on vid_11 (Responsive Design)
  await prisma.comment.create({
    data: {
      id: "cmt_12",
      videoId: vid11.id,
      userId: demoUser.id,
      content: "Container queries are the future. Nice examples!",
      createdAt: daysAgo(1),
    },
  });

  const cmt13 = await prisma.comment.create({
    data: {
      id: "cmt_13",
      videoId: vid11.id,
      userId: marcus.id,
      content: "Finally someone explains subgrid clearly.",
      createdAt: daysAgo(1),
    },
  });

  await prisma.comment.create({
    data: {
      id: "cmt_14",
      videoId: vid11.id,
      userId: priya.id,
      content:
        "Thanks! It took me a while to wrap my head around it too.",
      parentId: cmt13.id,
      createdAt: daysAgo(1),
    },
  });

  // Comment on vid_2 (Authentication)
  await prisma.comment.create({
    data: {
      id: "cmt_15",
      videoId: vid2.id,
      userId: priya.id,
      content:
        "The OAuth section was exactly what I needed for my project.",
      createdAt: daysAgo(24),
    },
  });

  // ── Likes ──────────────────────────────────────────────────────────
  console.log("Creating likes...");
  const likeData = [
    // demoUser likes
    { videoId: vid5.id, userId: demoUser.id },
    { videoId: vid8.id, userId: demoUser.id },
    { videoId: vid11.id, userId: demoUser.id },
    // sarah likes
    { videoId: vid1.id, userId: sarah.id },
    { videoId: vid4.id, userId: sarah.id },
    { videoId: vid8.id, userId: sarah.id },
    { videoId: vid12.id, userId: sarah.id },
    // marcus likes
    { videoId: vid1.id, userId: marcus.id },
    { videoId: vid2.id, userId: marcus.id },
    { videoId: vid5.id, userId: marcus.id },
    { videoId: vid10.id, userId: marcus.id },
    { videoId: vid11.id, userId: marcus.id },
    // priya likes
    { videoId: vid1.id, userId: priya.id },
    { videoId: vid2.id, userId: priya.id },
    { videoId: vid3.id, userId: priya.id },
    { videoId: vid5.id, userId: priya.id },
    { videoId: vid7.id, userId: priya.id },
  ];

  await Promise.all(likeData.map((l) => prisma.like.create({ data: l })));

  // ── Subscriptions ──────────────────────────────────────────────────
  console.log("Creating subscriptions...");
  const subData = [
    { userId: demoUser.id, channelId: chanSarah.id },
    { userId: demoUser.id, channelId: chanMarcus.id },
    { userId: sarah.id, channelId: chanDemo.id },
    { userId: sarah.id, channelId: chanPriya.id },
    { userId: marcus.id, channelId: chanDemo.id },
    { userId: marcus.id, channelId: chanSarah.id },
    { userId: priya.id, channelId: chanDemo.id },
    { userId: priya.id, channelId: chanSarah.id },
    { userId: priya.id, channelId: chanMarcus.id },
  ];

  await Promise.all(
    subData.map((s) => prisma.subscription.create({ data: s }))
  );

  // ── Playlists ──────────────────────────────────────────────────────
  console.log("Creating playlists...");
  const pl1 = await prisma.playlist.create({
    data: {
      id: "pl_1",
      userId: demoUser.id,
      title: "Web Dev Essentials",
      description: "Must-watch videos for full-stack web development",
      visibility: PlaylistVisibility.PUBLIC,
    },
  });

  const pl2 = await prisma.playlist.create({
    data: {
      id: "pl_2",
      userId: sarah.id,
      title: "Frontend Masterclass",
      description:
        "Curated collection of frontend development tutorials",
      visibility: PlaylistVisibility.PUBLIC,
    },
  });

  // ── Playlist Items ─────────────────────────────────────────────────
  console.log("Creating playlist items...");
  const playlistItemData = [
    { playlistId: pl1.id, videoId: vid5.id, position: 0 },
    { playlistId: pl1.id, videoId: vid3.id, position: 1 },
    { playlistId: pl1.id, videoId: vid8.id, position: 2 },
    { playlistId: pl1.id, videoId: vid11.id, position: 3 },
    { playlistId: pl2.id, videoId: vid7.id, position: 0 },
    { playlistId: pl2.id, videoId: vid12.id, position: 1 },
    { playlistId: pl2.id, videoId: vid11.id, position: 2 },
  ];

  await Promise.all(
    playlistItemData.map((pi) => prisma.playlistItem.create({ data: pi }))
  );

  // ── Watch History ──────────────────────────────────────────────────
  console.log("Creating watch history...");
  const watchData = [
    {
      userId: demoUser.id,
      videoId: vid5.id,
      progressSeconds: 2400,
      watchedAt: daysAgo(15),
    },
    {
      userId: demoUser.id,
      videoId: vid8.id,
      progressSeconds: 1200,
      watchedAt: daysAgo(7),
    },
    {
      userId: demoUser.id,
      videoId: vid11.id,
      progressSeconds: 900,
      watchedAt: daysAgo(1),
    },
    {
      userId: sarah.id,
      videoId: vid1.id,
      progressSeconds: 1245,
      watchedAt: daysAgo(27),
    },
    {
      userId: marcus.id,
      videoId: vid5.id,
      progressSeconds: 1800,
      watchedAt: daysAgo(14),
    },
    {
      userId: priya.id,
      videoId: vid2.id,
      progressSeconds: 2100,
      watchedAt: daysAgo(24),
    },
  ];

  await Promise.all(
    watchData.map((w) => prisma.watchHistory.create({ data: w }))
  );

  // ── Notifications ──────────────────────────────────────────────────
  console.log("Creating notifications...");
  const notifData = [
    {
      id: "notif_1",
      userId: demoUser.id,
      type: NotificationType.NEW_VIDEO,
      actorId: sarah.id,
      videoId: vid5.id,
      read: true,
      createdAt: daysAgo(16),
    },
    {
      id: "notif_2",
      userId: demoUser.id,
      type: NotificationType.NEW_VIDEO,
      actorId: marcus.id,
      videoId: vid8.id,
      read: false,
      createdAt: daysAgo(8),
    },
    {
      id: "notif_3",
      userId: marcus.id,
      type: NotificationType.COMMENT_REPLY,
      actorId: demoUser.id,
      videoId: vid1.id,
      commentId: cmt3.id,
      read: false,
      createdAt: daysAgo(26),
    },
    {
      id: "notif_4",
      userId: marcus.id,
      type: NotificationType.COMMENT_REPLY,
      actorId: sarah.id,
      videoId: vid5.id,
      commentId: cmt7.id,
      read: true,
      createdAt: daysAgo(14),
    },
    {
      id: "notif_5",
      userId: priya.id,
      type: NotificationType.COMMENT_REPLY,
      actorId: sarah.id,
      videoId: vid5.id,
      commentId: cmt9.id,
      read: false,
      createdAt: daysAgo(13),
    },
    {
      id: "notif_6",
      userId: sarah.id,
      type: NotificationType.NEW_VIDEO,
      actorId: demoUser.id,
      videoId: vid4.id,
      read: true,
      createdAt: daysAgo(19),
    },
  ];

  await Promise.all(
    notifData.map((n) => prisma.notification.create({ data: n }))
  );

  console.log("\n✅ Seeding complete!");
  console.log("   4 users (demo@awetube.com / password123)");
  console.log("   4 channels");
  console.log("   12 videos");
  console.log("   8 tags");
  console.log("   15 comments");
  console.log("   17 likes");
  console.log("   9 subscriptions");
  console.log("   2 playlists");
  console.log("   6 watch history entries");
  console.log("   6 notifications");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
