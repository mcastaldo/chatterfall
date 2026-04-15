import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_postId: {
          userId: session.userId,
          postId,
        },
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.favorite.create({
        data: {
          userId: session.userId,
          postId,
        },
      });

      if (post.authorId && post.authorId !== session.userId) {
        await prisma.notification.create({
          data: {
            userId: post.authorId,
            type: "favorite",
            postId,
          },
        });
      }
    }

    const favoriteCount = await prisma.favorite.count({
      where: { postId },
    });

    return NextResponse.json({
      favorited: !existing,
      favoriteCount,
    });
  } catch (error) {
    console.error("Favorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
