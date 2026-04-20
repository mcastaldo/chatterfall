/**
 * Bot runner — picks a random bot user and creates a post via Prisma,
 * then returns the post data so the caller can emit it over Socket.IO.
 *
 * Called from server.ts on a randomized interval.
 * Does nothing outside 7am–11pm local server time so the feed feels natural.
 */

import { PrismaClient } from "@prisma/client";
import { BOT_CITIES, BOT_DEFINITIONS, POST_TEMPLATES, getSeason, getTimeOfDay } from "./botData";

const prisma = new PrismaClient();

// Small jitter so multiple restarts don't all post at the same second
function jitter(ms: number): number {
  return ms + Math.floor(Math.random() * ms * 0.4 - ms * 0.2);
}

// Next interval: random between min and max minutes (ms)
export function nextBotInterval(): number {
  const minMs = 4 * 60 * 1000;  // 4 min
  const maxMs = 11 * 60 * 1000; // 11 min
  return jitter(minMs + Math.random() * (maxMs - minMs));
}

let botUserIds: { id: string; cityKey: string }[] | null = null;

// Track which templates were recently used to prevent repeats.
// We store the raw template string (before substitution).
// Keep the last 20 used — with ~100 templates in the pool that's an 80% exclusion window.
const recentTemplates: string[] = [];
const RECENT_WINDOW = 20;

function pickFreshTemplate(cityKey: string): { content: string; templateUsed: string } {
  const city = BOT_CITIES[cityKey];
  if (!city) return { content: "just a regular day out here", templateUsed: "" };

  const recentSet = new Set(recentTemplates);
  const available = POST_TEMPLATES.filter((t) => !recentSet.has(t));
  const pool = available.length >= 5 ? available : POST_TEMPLATES;
  const template = pool[Math.floor(Math.random() * pool.length)];

  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const content = template
    .replace("{food}", pick(city.foods))
    .replace("{place}", pick(city.places))
    .replace("{sport}", pick(city.sports))
    .replace("{weather}", pick(city.weather))
    .replace("{vibe}", pick(city.vibes))
    .replace("{city}", city.city.toLowerCase())
    .replace("{timeofday}", getTimeOfDay())
    .replace("{season}", getSeason());

  return { content, templateUsed: template };
}

async function loadBotIds() {
  if (botUserIds) return botUserIds;
  const emails = BOT_DEFINITIONS.map((b) => b.email);
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });

  botUserIds = users.map((u) => {
    const def = BOT_DEFINITIONS.find((b) => b.email === u.email)!;
    return { id: u.id, cityKey: def.cityKey };
  });

  return botUserIds;
}

export async function runBotTick(): Promise<object | null> {
  // Only post between 7am and 11pm server local time
  const hour = new Date().getHours();
  if (hour < 7 || hour >= 23) return null;

  try {
    const bots = await loadBotIds();
    if (!bots.length) {
      console.log("[bots] No bot users found — run npm run db:seed first");
      return null;
    }

    // Pick a random bot
    const bot = bots[Math.floor(Math.random() * bots.length)];
    const cityData = BOT_CITIES[bot.cityKey];
    if (!cityData) return null;

    const { content, templateUsed } = pickFreshTemplate(bot.cityKey);

    // Record this template as recently used
    recentTemplates.push(templateUsed);
    if (recentTemplates.length > RECENT_WINDOW) recentTemplates.shift();

    // Add a small lat/lon jitter so posts don't all stack on the exact city center
    const latJitter = (Math.random() - 0.5) * 0.08; // ±~5 miles
    const lonJitter = (Math.random() - 0.5) * 0.08;
    const lat = cityData.lat + latJitter;
    const lon = cityData.lon + lonJitter;

    // Reverse geocode city name (simple — just use city, state)
    const locationName = `${cityData.city}, ${cityData.state}`;

    const post = await prisma.post.create({
      data: {
        content,
        lat,
        lon,
        locationName,
        anonymous: false,
        authorId: bot.id,
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

    // Shape into PostWithMeta for the socket broadcast
    const postWithMeta = {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      lat: post.lat,
      lon: post.lon,
      anonymous: post.anonymous,
      anonId: null,
      anonAvatar: null,
      locationName: post.locationName,
      createdAt: post.createdAt.toISOString(),
      author: post.author,
      _count: post._count,
      favorited: false,
      downvoted: false,
      distance: 0,
      reactions: {},
    };

    console.log(
      `[bots] ${post.author?.displayName} (@${post.author?.username}) posted from ${locationName}: "${content.slice(0, 60)}..."`
    );

    return postWithMeta;
  } catch (err) {
    console.error("[bots] Error in bot tick:", err);
    return null;
  }
}
