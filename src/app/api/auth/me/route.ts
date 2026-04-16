import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        profileImg: true,

        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const { displayName, profileImg } = body;

    const data: Record<string, unknown> = {};

    if (typeof displayName === "string") {
      const trimmed = displayName.trim();
      data.displayName = trimmed.length > 0 ? trimmed.slice(0, 50) : null;
    }

    if (profileImg === null) {
      data.profileImg = null;
    } else if (typeof profileImg === "string") {
      // Only accept data URLs (from /api/upload) or http(s) URLs; cap length
      const valid =
        profileImg.startsWith("data:image/") ||
        profileImg.startsWith("http://") ||
        profileImg.startsWith("https://");
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid profile image" },
          { status: 400 }
        );
      }
      // Cap at ~3MB base64 payload just in case
      if (profileImg.length > 3_500_000) {
        return NextResponse.json(
          { error: "Profile image too large" },
          { status: 400 }
        );
      }
      data.profileImg = profileImg;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        email: true,
        profileImg: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
