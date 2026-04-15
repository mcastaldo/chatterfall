import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const session = await getSession();

    const post = await prisma.post.findUnique({
      where: { id: postId },
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
            comments: true,
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

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...post,
      favorited: session ? (post as unknown as { favorites: unknown[] }).favorites?.length > 0 : false,
      downvoted: session ? (post as unknown as { downvotes: unknown[] }).downvotes?.length > 0 : false,
      favorites: undefined,
      downvotes: undefined,
    });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
