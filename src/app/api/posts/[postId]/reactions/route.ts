import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { REACTION_EMOJIS } from "@/lib/reactions";

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
    const body = await req.json();
    const { emoji } = body;

    if (!emoji || !REACTION_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: "Invalid emoji" },
        { status: 400 }
      );
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Toggle: delete if exists, create if not
    const existing = await prisma.reaction.findUnique({
      where: {
        userId_postId_emoji: {
          userId: session.userId,
          postId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.reaction.create({
        data: {
          userId: session.userId,
          postId,
          emoji,
        },
      });
    }

    // Get updated reaction counts for this post
    const reactions = await prisma.reaction.groupBy({
      by: ["emoji"],
      where: { postId },
      _count: { emoji: true },
    });

    const reactionCounts: Record<string, number> = {};
    for (const r of reactions) {
      reactionCounts[r.emoji] = r._count.emoji;
    }

    // Broadcast to all clients
    const { broadcast } = await import("@/lib/broadcast");
    await broadcast("reaction-update", { postId, reactions: reactionCounts });

    return NextResponse.json({
      toggled: !existing,
      reactions: reactionCounts,
    });
  } catch (error) {
    console.error("Reaction error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
