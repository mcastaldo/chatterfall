"use client";

import { useMemo } from "react";
import UserAvatar from "@/components/UserAvatar";
import type { PostWithMeta } from "@/types";

interface NearbyUsersProps {
  posts: PostWithMeta[];
  onUserClick: (userId: string) => void;
}

export default function NearbyUsers({ posts, onUserClick }: NearbyUsersProps) {
  const { users, anonymousCount } = useMemo(() => {
    const seen = new Map<
      string,
      { id: string; username: string; displayName: string | null; profileImg: string | null }
    >();
    let anonCount = 0;

    for (const post of posts) {
      if (post.anonymous || !post.author) {
        anonCount++;
      } else {
        if (!seen.has(post.author.id)) {
          seen.set(post.author.id, post.author);
        }
      }
    }

    return { users: Array.from(seen.values()), anonymousCount: anonCount };
  }, [posts]);

  const totalCount = users.length + (anonymousCount > 0 ? 1 : 0);

  return (
    <div className="w-[200px] flex-shrink-0 bg-brand-900/50 border-r border-brand-800 flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-3 border-b border-brand-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Nearby
          </h3>
          <span className="text-[10px] text-gray-500">{totalCount}</span>
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {users.length === 0 && anonymousCount === 0 ? (
          <p className="text-xs text-gray-500 px-2 py-4 text-center">
            No one nearby yet
          </p>
        ) : (
          <>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserClick(user.id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-brand-800/50 transition-colors text-left group"
              >
                <div className="relative flex-shrink-0">
                  <UserAvatar user={user} size="sm" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-brand-900" />
                </div>
                <span className="text-sm text-gray-300 group-hover:text-white truncate transition-colors">
                  {user.displayName || user.username}
                </span>
              </button>
            ))}

            {/* Anonymous entry */}
            {anonymousCount > 0 && (
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
                  {anonymousCount}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
