"use client";

import { useMemo } from "react";
import UserAvatar from "@/components/UserAvatar";
import { getAnonIdentity } from "@/lib/anonIdentity";
import type { PostWithMeta, PresenceEntry } from "@/types";

interface NearbyUsersProps {
  posts: PostWithMeta[];
  presence?: PresenceEntry[];
  onUserClick: (userId: string) => void;
}

interface AnonUser {
  anonId: string;
  anonAvatar: string | null;
  name: string;
  color: string;
  initial: string;
  online: boolean;
}

interface RegUser {
  id: string;
  username: string;
  displayName: string | null;
  profileImg: string | null;
  online: boolean;
}

export default function NearbyUsers({
  posts,
  presence = [],
  onUserClick,
}: NearbyUsersProps) {
  const { users, anonUsers, legacyAnonCount } = useMemo(() => {
    const regMap = new Map<string, RegUser>();
    const anonMap = new Map<string, AnonUser>();
    let legacy = 0;

    // Seed with currently-online users from presence (they haven't necessarily posted)
    for (const p of presence) {
      if (p.kind === "user") {
        regMap.set(p.id, {
          id: p.id,
          username: p.username ?? p.name,
          displayName: p.name,
          profileImg: p.profileImg ?? null,
          online: true,
        });
      } else {
        const id = getAnonIdentity(p.id);
        anonMap.set(p.id, {
          anonId: p.id,
          anonAvatar: p.anonAvatar ?? null,
          name: id.name,
          color: id.color,
          initial: id.initial,
          online: true,
        });
      }
    }

    // Merge in post authors (may include people who've posted but aren't currently connected)
    for (const post of posts) {
      if (post.anonymous || !post.author) {
        if (post.anonId) {
          const existing = anonMap.get(post.anonId);
          if (existing) {
            // Keep an avatar from the post if presence didn't supply one
            if (post.anonAvatar && !existing.anonAvatar) {
              existing.anonAvatar = post.anonAvatar;
            }
          } else {
            const id = getAnonIdentity(post.anonId);
            anonMap.set(post.anonId, {
              anonId: post.anonId,
              anonAvatar: post.anonAvatar ?? null,
              name: id.name,
              color: id.color,
              initial: id.initial,
              online: false,
            });
          }
        } else {
          legacy++;
        }
      } else {
        if (!regMap.has(post.author.id)) {
          regMap.set(post.author.id, {
            id: post.author.id,
            username: post.author.username,
            displayName: post.author.displayName,
            profileImg: post.author.profileImg,
            online: false,
          });
        }
      }
    }

    // Sort: online first, then alphabetical
    const sortFn = <T extends { online: boolean; name?: string; displayName?: string | null; username?: string }>(
      a: T,
      b: T
    ) => {
      if (a.online !== b.online) return a.online ? -1 : 1;
      const an = (a.name ?? a.displayName ?? a.username ?? "").toLowerCase();
      const bn = (b.name ?? b.displayName ?? b.username ?? "").toLowerCase();
      return an.localeCompare(bn);
    };

    return {
      users: Array.from(regMap.values()).sort(sortFn),
      anonUsers: Array.from(anonMap.values()).sort(sortFn),
      legacyAnonCount: legacy,
    };
  }, [posts, presence]);

  const totalCount = users.length + anonUsers.length + (legacyAnonCount > 0 ? 1 : 0);
  const onlineCount =
    users.filter((u) => u.online).length + anonUsers.filter((u) => u.online).length;

  return (
    <div className="w-[200px] flex-shrink-0 bg-brand-900/50 border-r border-brand-800 flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-brand-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Nearby
          </h3>
          <span className="text-[10px] text-gray-500">
            {onlineCount > 0 ? `${onlineCount} online` : totalCount}
          </span>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {users.length === 0 && anonUsers.length === 0 && legacyAnonCount === 0 ? (
          <p className="text-xs text-gray-500 px-2 py-4 text-center">
            No one nearby yet
          </p>
        ) : (
          <>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserClick(user.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-brand-800/50 transition-colors text-left group ${
                  user.online ? "" : "opacity-60"
                }`}
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar user={user} size="sm" />
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-brand-900 ${
                      user.online ? "bg-brand-500" : "bg-gray-600"
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white truncate transition-colors">
                  {user.displayName || user.username}
                </span>
              </button>
            ))}

            {anonUsers.map((anon) => (
              <div
                key={anon.anonId}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-brand-800/50 transition-colors ${
                  anon.online ? "" : "opacity-60"
                }`}
              >
                <div className="relative flex-shrink-0">
                  {anon.anonAvatar ? (
                    <img
                      src={anon.anonAvatar}
                      alt={anon.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ backgroundColor: anon.color }}
                    >
                      {anon.initial}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-brand-900 ${
                      anon.online ? "bg-brand-500" : "bg-gray-600"
                    }`}
                  />
                </div>
                <span className="text-sm text-gray-400 italic truncate">
                  {anon.name}
                </span>
              </div>
            ))}

            {legacyAnonCount > 0 && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-gray-500 text-xs font-bold">
                    ?
                  </div>
                </div>
                <span className="text-sm text-gray-500 italic truncate">
                  Anonymous
                </span>
                <span className="ml-auto text-[10px] text-gray-600">
                  {legacyAnonCount}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
