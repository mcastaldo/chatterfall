import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { haversineDistance, fuzzCoordinates } from "@/lib/geo";
import { reverseGeocode } from "@/lib/geocode";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
    const lon = searchParams.get("lon") ? parseFloat(searchParams.get("lon")!) : null;
    const range = searchParams.get("range") ? parseFloat(searchParams.get("range")!) : 0;
    const postType = searchParams.get("postType") || "all";
    const userType = searchParams.get("userType") || "all";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};

    if (postType === "text") {
      where.imageUrl = null;
    } else if (postType === "image") {
      where.imageUrl = { not: null };
    }

    if (userType === "registered") {
      where.anonymous = false;
    }

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    const take = range > 0 ? undefined : 20;

    const posts = await prisma.post.findMany({
      where,
      ...(take && { take }),
      ...(cursor && { skip: 1, cursor: { id: cursor } }),
      orderBy: { createdAt: "desc" },
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
        reactions: {
          select: { emoji: true, userId: true },
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

    let result = posts.map((post) => {
      const distance =
        lat !== null && lon !== null && post.lat !== null && post.lon !== null
          ? haversineDistance(lat, lon, post.lat, post.lon)
          : undefined;

      // Aggregate reactions into { emoji: { count, reacted } }
      const reactionMap: Record<string, { count: number; reacted: boolean }> = {};
      for (const r of post.reactions) {
        if (!reactionMap[r.emoji]) {
          reactionMap[r.emoji] = { count: 0, reacted: false };
        }
        reactionMap[r.emoji].count++;
        if (session && r.userId === session.userId) {
          reactionMap[r.emoji].reacted = true;
        }
      }

      // Fuzz coordinates for privacy (~200m offset, deterministic per post)
      const fuzzed = fuzzCoordinates(post.lat, post.lon, post.id);

      return {
        ...post,
        lat: fuzzed.lat,
        lon: fuzzed.lon,
        favorited: session ? post.favorites?.length > 0 : false,
        downvoted: session ? post.downvotes?.length > 0 : false,
        favorites: undefined,
        downvotes: undefined,
        reactions: reactionMap,
        distance,
      };
    });

    if (range > 0 && lat !== null && lon !== null) {
      result = result.filter((post) => post.distance != null && post.distance <= range);

      if (cursor) {
        const cursorIndex = result.findIndex((p) => p.id === cursor);
        if (cursorIndex >= 0) {
          result = result.slice(cursorIndex + 1);
        }
      }

      result = result.slice(0, 20);
    }

    const nextCursor = result.length === 20 ? result[result.length - 1].id : null;

    return NextResponse.json({ posts: result, nextCursor });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    const body = await req.json();
    const { content, imageUrl, lat, lon, anonymous } = body;

    if (!anonymous && !session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!content || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: "Content, lat, and lon are required" },
        { status: 400 }
      );
    }

    // Reverse geocode the location (non-blocking, uses cache)
    let locationName: string | null = null;
    try {
      locationName = await reverseGeocode(lat, lon);
    } catch {
      // Silent fail — location name is optional
    }

    const post = await prisma.post.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        lat,
        lon,
        anonymous: !!anonymous,
        locationName,
        ...(session && !anonymous ? { authorId: session.userId } : {}),
      },
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
      },
    });

    // Broadcast with fuzzed coordinates for privacy
    const { broadcast } = await import("@/lib/broadcast");
    const broadcastFuzzed = fuzzCoordinates(post.lat, post.lon, post.id);
    await broadcast("new-post", {
      ...post,
      lat: broadcastFuzzed.lat,
      lon: broadcastFuzzed.lon,
      reactions: {},
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
