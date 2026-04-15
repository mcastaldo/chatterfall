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
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existing = await prisma.downvote.findUnique({
      where: {
        userId_postId: {
          userId: session.userId,
          postId,
        },
      },
    });

    if (existing) {
      await prisma.downvote.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.downvote.create({
        data: {
          userId: session.userId,
          postId,
        },
      });
    }

    const downvoteCount = await prisma.downvote.count({
      where: { postId },
    });

    return NextResponse.json({
      downvoted: !existing,
      downvoteCount,
    });
  } catch (error) {
    console.error("Downvote error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
