/**
 * Messaging identity helpers.
 *
 * A "target" is a URL-safe string that encodes who someone is:
 *   u-<userId>   — registered user (cuid)
 *   a-<anonId>   — anonymous browser (12-char random)
 *
 * On the server side we resolve the *current* user's identity from the JWT
 * session, falling back to the cf_anon_id cookie.
 */

import { cookies } from "next/headers";
import { getSession } from "@/lib/auth";

export type MsgIdentity =
  | { kind: "user"; id: string }
  | { kind: "anon"; id: string };

/**
 * Parse a target string like "u-clxyz…" or "a-abc123" into an identity.
 */
export function parseTarget(target: string): MsgIdentity | null {
  if (target.startsWith("u-") && target.length > 2) {
    return { kind: "user", id: target.slice(2) };
  }
  if (target.startsWith("a-") && target.length > 2) {
    return { kind: "anon", id: target.slice(2) };
  }
  return null;
}

/**
 * Build a target string from an identity.
 */
export function toTarget(id: MsgIdentity): string {
  return `${id.kind === "user" ? "u" : "a"}-${id.id}`;
}

/**
 * Resolve the request sender's identity.
 * Prefers JWT session (logged-in user); falls back to the cf_anon_id cookie.
 * Returns null if neither is available.
 */
export async function getSenderIdentity(): Promise<MsgIdentity | null> {
  const session = await getSession();
  if (session) {
    return { kind: "user", id: session.userId };
  }

  // Anonymous fallback
  const cookieStore = await cookies();
  const anonId = cookieStore.get("cf_anon_id")?.value;
  if (anonId) {
    return { kind: "anon", id: anonId };
  }

  return null;
}

/**
 * Prisma where-clause fragment for one side of a DM conversation.
 */
export function whereIdentity(
  id: MsgIdentity,
  side: "sender" | "receiver"
): Record<string, string> {
  if (side === "sender") {
    return id.kind === "user"
      ? { senderId: id.id }
      : { senderAnonId: id.id };
  }
  return id.kind === "user"
    ? { receiverId: id.id }
    : { receiverAnonId: id.id };
}

/**
 * Create-data fragment for one side of a DM.
 */
export function createIdentity(
  id: MsgIdentity,
  side: "sender" | "receiver"
): Record<string, string> {
  if (side === "sender") {
    return id.kind === "user"
      ? { senderId: id.id }
      : { senderAnonId: id.id };
  }
  return id.kind === "user"
    ? { receiverId: id.id }
    : { receiverAnonId: id.id };
}

/**
 * Given a DM record, figure out who the partner is (the side that isn't `me`).
 */
export function getPartner(
  msg: {
    senderId: string | null;
    senderAnonId: string | null;
    receiverId: string | null;
    receiverAnonId: string | null;
  },
  me: MsgIdentity
): MsgIdentity | null {
  const isSender =
    (me.kind === "user" && msg.senderId === me.id) ||
    (me.kind === "anon" && msg.senderAnonId === me.id);

  if (isSender) {
    if (msg.receiverId) return { kind: "user", id: msg.receiverId };
    if (msg.receiverAnonId) return { kind: "anon", id: msg.receiverAnonId };
  } else {
    if (msg.senderId) return { kind: "user", id: msg.senderId };
    if (msg.senderAnonId) return { kind: "anon", id: msg.senderAnonId };
  }
  return null;
}
