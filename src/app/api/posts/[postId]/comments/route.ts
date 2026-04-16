import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    const { postId } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");

    const comments = await prisma.comment.findMany({
      where: { postId },
      take: 20,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: "asc" },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImg: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            downvotes: true,
          },
        },
        ...(session
          ? {
              favorites: {
                where: { userId: session.userId },
                select: { id: true },
              },
              downvotes: {
                where: { userId: session.userId },
                select: { id: true },
              },
            }
          : {}),
      },
    });

    const result = comments.map((comment) => ({
      ...comment,
      favorited: session ? comment.favorites?.length > 0 : false,
      downvoted: session ? comment.downvotes?.length > 0 : false,
      favorites: undefined,
      downvotes: undefined,
    }));

    const nextCursor =
      result.length === 20 ? result[result.length - 1].id : null;

    return NextResponse.json({ comments: result, nextCursor });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();
    const { postId } = await params;
    const body = await req.json();
    const { content, imageUrl, lat, lon, anonymous, anonId, anonAvatar } = body;

    if (!anonymous && !session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!content || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: "Content, lat, and lon are required" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        lat,
        lon,
        anonymous: !!anonymous,
        anonId: anonymous && typeof anonId === "string" ? anonId.slice(0, 64) : null,
        anonAvatar:
          anonymous && typeof anonAvatar === "string" && anonAvatar.length < 2_000_000
            ? anonAvatar
            : null,
        postId,
        ...(session && !anonymous ? { authorId: session.userId } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImg: true,
          },
        },
        _count: {
          select: {
            favorites: true,
            downvotes: true,
          },
        },
      },
    });

    if (post.authorId && post.authorId !== session?.userId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          type: "comment",
          postId,
        },
      });
    }

    // Broadcast new comment + updated count to all clients
    const { broadcast } = await import("@/lib/broadcast");
    const commentCount = await prisma.comment.count({ where: { postId } });
    await broadcast("new-comment", { postId, comment, commentCount });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
