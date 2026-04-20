import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSenderIdentity,
  toTarget,
  getPartner,
  whereIdentity,
  type MsgIdentity,
} from "@/lib/messagingIdentity";
import { getAnonIdentity } from "@/lib/anonIdentity";

export async function GET() {
  try {
    const me = await getSenderIdentity();
    if (!me) {
      return NextResponse.json(
        { error: "Identity required" },
        { status: 401 }
      );
    }

    // All DMs involving me on either side
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [whereIdentity(me, "sender"), whereIdentity(me, "receiver")],
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

    // De-duplicate by partner
    const seen = new Map<
      string,
      {
        partner: MsgIdentity;
        lastMessage: {
          content: string;
          createdAt: Date;
          senderTarget: string;
        };
      }
    >();

    for (const msg of messages) {
      const partner = getPartner(msg, me);
      if (!partner) continue;
      const key = toTarget(partner);

      if (!seen.has(key)) {
        const sTarget = msg.senderId
          ? `u-${msg.senderId}`
          : msg.senderAnonId
            ? `a-${msg.senderAnonId}`
            : toTarget(me);

        seen.set(key, {
          partner,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            senderTarget: sTarget,
          },
        });
      }
    }

    // Build conversation list with unread counts + partner display info
    const conversations = await Promise.all(
      Array.from(seen.entries()).map(async ([key, { partner, lastMessage }]) => {
        // Count unread messages from this partner to me
        const unreadCount = await prisma.directMessage.count({
          where: {
            ...whereIdentity(partner, "sender"),
            ...whereIdentity(me, "receiver"),
            read: false,
          },
        });

        // Resolve partner display info
        let partnerDisplay: {
          kind: "user" | "anon";
          id: string;
          target: string;
          name: string;
          username?: string;
          profileImg?: string | null;
          anonAvatar?: string | null;
        };

        if (partner.kind === "user") {
          const user = await prisma.user.findUnique({
            where: { id: partner.id },
            select: { id: true, username: true, displayName: true, profileImg: true },
          });
          partnerDisplay = {
            kind: "user",
            id: partner.id,
            target: key,
            name: user?.displayName || user?.username || "Unknown",
            username: user?.username,
            profileImg: user?.profileImg ?? null,
          };
        } else {
          const identity = getAnonIdentity(partner.id);
          // Try to find a recent avatar from a post/comment by this anonId
          const recentPost = await prisma.post.findFirst({
            where: { anonId: partner.id, anonAvatar: { not: null } },
            select: { anonAvatar: true },
            orderBy: { createdAt: "desc" },
          });

          partnerDisplay = {
            kind: "anon",
            id: partner.id,
            target: key,
            name: identity.name,
            anonAvatar: recentPost?.anonAvatar ?? null,
          };
        }

        return {
          partner: partnerDisplay,
          lastMessage: {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt.toISOString(),
            senderTarget: lastMessage.senderTarget,
          },
          unreadCount,
        };
      })
    );

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Conversations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
