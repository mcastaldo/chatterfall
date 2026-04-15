import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        profileImg: true,

        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [postCount, commentCount, totalFavorites, totalDownvotes] =
      await Promise.all([
        prisma.post.count({
          where: { authorId: userId },
        }),
        prisma.comment.count({
          where: { authorId: userId },
        }),
        prisma.favorite.count({
          where: { post: { authorId: userId } },
        }),
        prisma.downvote.count({
          where: { post: { authorId: userId } },
        }),
      ]);

    const fameScore = totalFavorites - totalDownvotes + commentCount;

    return NextResponse.json({
      ...user,
      stats: {
        postCount,
        commentCount,
        totalFavorites,
        totalDownvotes,
        fameScore,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
