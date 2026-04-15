import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.userId, receiverId: userId },
          { senderId: userId, receiverId: session.userId },
        ],
      },
      take: 50,
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: "asc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImg: true,
          },
        },
      },
    });

    await prisma.directMessage.updateMany({
      where: {
        senderId: userId,
        receiverId: session.userId,
        read: false,
      },
      data: { read: true },
    });

    const nextCursor =
      messages.length === 50 ? messages[messages.length - 1].id : null;

    return NextResponse.json({ messages, nextCursor });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await req.json();
    const { content, imageUrl } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const receiver = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!receiver) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const message = await prisma.directMessage.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        senderId: session.userId,
        receiverId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImg: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
