import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSenderIdentity,
  parseTarget,
  toTarget,
  whereIdentity,
  createIdentity,
} from "@/lib/messagingIdentity";
import { getAnonIdentity } from "@/lib/anonIdentity";

/**
 * GET /api/messages/[target]
 * Fetch messages between the current identity (session user or anonymous cookie)
 * and the target identity (prefixed string like "u-xxx" or "a-xxx").
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: rawTarget } = await params;
    const me = await getSenderIdentity();
    if (!me) {
      return NextResponse.json(
        { error: "Identity required (log in or enable cookies)" },
        { status: 401 }
      );
    }

    const target = parseTarget(rawTarget);
    if (!target) {
      return NextResponse.json(
        { error: "Invalid target" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");

    // Build the OR clause: me → target, target → me
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { ...whereIdentity(me, "sender"), ...whereIdentity(target, "receiver") },
          { ...whereIdentity(target, "sender"), ...whereIdentity(me, "receiver") },
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

    // Mark incoming messages as read
    await prisma.directMessage.updateMany({
      where: {
        ...whereIdentity(target, "sender"),
        ...whereIdentity(me, "receiver"),
        read: false,
      },
      data: { read: true },
    });

    const myTarget = toTarget(me);

    // Map to MessageData shape
    const mapped = messages.map((msg) => {
      const sTarget =
        msg.senderId
          ? `u-${msg.senderId}`
          : msg.senderAnonId
            ? `a-${msg.senderAnonId}`
            : myTarget;

      const senderName = msg.sender
        ? msg.sender.displayName || msg.sender.username
        : msg.senderAnonId
          ? getAnonIdentity(msg.senderAnonId).name
          : "Anonymous";

      return {
        id: msg.id,
        content: msg.content,
        imageUrl: msg.imageUrl,
        createdAt: msg.createdAt.toISOString(),
        senderTarget: sTarget,
        read: msg.read,
        sender: {
          name: senderName,
          profileImg: msg.sender?.profileImg ?? null,
        },
      };
    });

    const nextCursor =
      messages.length === 50 ? messages[messages.length - 1].id : null;

    return NextResponse.json({ messages: mapped, nextCursor, myTarget });
  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/[target]
 * Send a message from the current identity to the target identity.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: rawTarget } = await params;
    const me = await getSenderIdentity();
    if (!me) {
      return NextResponse.json(
        { error: "Identity required (log in or enable cookies)" },
        { status: 401 }
      );
    }

    const target = parseTarget(rawTarget);
    if (!target) {
      return NextResponse.json(
        { error: "Invalid target" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { content, imageUrl } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // For user targets, make sure the user exists
    if (target.kind === "user") {
      const exists = await prisma.user.findUnique({
        where: { id: target.id },
        select: { id: true },
      });
      if (!exists) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }

    const msg = await prisma.directMessage.create({
      data: {
        content: content.trim(),
        imageUrl: imageUrl || null,
        ...createIdentity(me, "sender"),
        ...createIdentity(target, "receiver"),
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

    const myTarget = toTarget(me);
    const senderName = msg.sender
      ? msg.sender.displayName || msg.sender.username
      : me.kind === "anon"
        ? getAnonIdentity(me.id).name
        : "Anonymous";

    const messageData = {
      id: msg.id,
      content: msg.content,
      imageUrl: msg.imageUrl,
      createdAt: msg.createdAt.toISOString(),
      senderTarget: myTarget,
      read: msg.read,
      sender: {
        name: senderName,
        profileImg: msg.sender?.profileImg ?? null,
      },
    };

    // Broadcast via internal endpoint (socket server picks it up)
    try {
      const targetTarget = toTarget(target);
      await fetch(`http://localhost:${process.env.PORT || 3000}/_internal/broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "new-message",
          data: messageData,
          targetIdentities: [targetTarget],
        }),
      });
    } catch {
      // Socket delivery is best-effort
    }

    return NextResponse.json(messageData, { status: 201 });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
