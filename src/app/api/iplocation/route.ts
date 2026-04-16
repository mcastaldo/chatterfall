import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * IP-based geolocation fallback using ipapi.co (free tier, no key required).
 * Returns approximate city-level coordinates.
 */
export async function GET(req: NextRequest) {
  try {
    // Get client IP from headers (Railway/Vercel set x-forwarded-for)
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const ip =
      forwardedFor?.split(",")[0].trim() || realIp || "";

    // If running locally, the IP will be a private address — fall back to "json" endpoint
    // which geolocates the request's source IP automatically
    const isPrivate =
      !ip ||
      ip === "::1" ||
      ip.startsWith("127.") ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.") ||
      ip.startsWith("172.");

    const url = isPrivate
      ? "https://ipapi.co/json/"
      : `https://ipapi.co/${ip}/json/`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Chatterfall/1.0" },
      // Don't cache — each user's IP is different
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Could not determine location from IP" },
        { status: 502 }
      );
    }

    const data = await res.json();

    if (!data.latitude || !data.longitude) {
      return NextResponse.json(
        { error: "Location data unavailable" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      lat: data.latitude,
      lon: data.longitude,
      city: data.city ?? null,
      region: data.region ?? null,
      country: data.country_name ?? null,
      approximate: true,
    });
  } catch (error) {
    console.error("IP location error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
