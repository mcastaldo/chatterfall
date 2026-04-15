import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: session.userId },
          { receiverId: session.userId },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImg: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            displayName: true,
            profileImg: true,
          },
        },
      },
    });

    const conversationMap = new Map<
      string,
      {
        user: { id: string; username: string; displayName: string | null; profileImg: string | null };
        lastMessage: { content: string; createdAt: Date; senderId: string };
        unreadCount: number;
      }
    >();

    for (const msg of messages) {
      const partnerId =
        msg.senderId === session.userId ? msg.receiverId : msg.senderId;
      const partner =
        msg.senderId === session.userId ? msg.receiver : msg.sender;

      if (!conversationMap.has(partnerId)) {
        const unreadCount = await prisma.directMessage.count({
          where: {
            senderId: partnerId,
            receiverId: session.userId,
            read: false,
          },
        });

        conversationMap.set(partnerId, {
          user: partner,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: msg.senderId,
          },
          unreadCount,
        });
      }
    }

    const conversations = Array.from(conversationMap.values());

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
