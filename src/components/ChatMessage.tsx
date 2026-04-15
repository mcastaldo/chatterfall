"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "@/components/UserAvatar";
import { formatCount } from "@/lib/utils";
import type { PostWithMeta } from "@/types";

interface ChatMessageProps {
  post: PostWithMeta;
  currentUserId?: string;
  onThreadOpen: (postId: string) => void;
}

export default function ChatMessage({
  post,
  currentUserId,
  onThreadOpen,
}: ChatMessageProps) {
  const [favorited, setFavorited] = useState(post.favorited ?? false);
  const [favCount, setFavCount] = useState(post._count.favorites);
  const [downvoted, setDownvoted] = useState(post.downvoted ?? false);
  const [downvoteCount, setDownvoteCount] = useState(post._count.downvotes);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = favorited;
    const prevCount = favCount;
    setFavorited(!prev);
    setFavCount(prev ? prevCount - 1 : prevCount + 1);
    try {
      const res = await fetch(`/api/posts/${post.id}/favorite`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
    } catch {
      setFavorited(prev);
      setFavCount(prevCount);
    }
  };

  const toggleDownvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const prev = downvoted;
    const prevCount = downvoteCount;
    setDownvoted(!prev);
    setDownvoteCount(prev ? prevCount - 1 : prevCount + 1);
    try {
      const res = await fetch(`/api/posts/${post.id}/downvote`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
    } catch {
      setDownvoted(prev);
      setDownvoteCount(prevCount);
    }
  };

  const isAnonymous = post.anonymous || !post.author;
  const timestamp = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="group relative flex gap-3 px-4 py-1.5 hover:bg-brand-900/30 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isAnonymous ? (
          <div className="w-10 h-10 rounded-full bg-brand-800 flex items-center justify-center text-gray-500 text-lg font-bold">
            ?
          </div>
        ) : (
          <UserAvatar user={post.author} size="md" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author + Timestamp */}
        <div className="flex items-baseline gap-2">
          {isAnonymous ? (
            <span className="text-gray-500 italic text-sm">Anonymous</span>
          ) : (
            <span className="font-semibold text-white text-sm">
              {post.author?.displayName || post.author?.username}
            </span>
          )}
          <span className="text-xs text-gray-500">{timestamp}</span>
          {post.distance != null && (
            <span className="text-[11px] text-gray-500">
              •{" "}
              {post.distance < 1000
                ? `${Math.round(post.distance)}m away`
                : post.distance < 1609
                  ? `${(post.distance / 1000).toFixed(1)}km away`
                  : `${(post.distance / 1609).toFixed(1)}mi away`}
            </span>
          )}
        </div>

        {/* Message content */}
        <p className="text-gray-200 text-sm whitespace-pre-wrap break-words mt-0.5">
          {post.content}
        </p>

        {/* Image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="mt-2 max-h-72 rounded-lg object-cover"
          />
        )}

        {/* Action row - visible on hover */}
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Favorite */}
          <button
            onClick={toggleFavorite}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
              favorited
                ? "text-red-400 bg-red-400/10"
                : "text-gray-400 hover:text-red-400 hover:bg-brand-800/50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill={favorited ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4"
            >
              <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-1.9C4.045 12.733 2 10.352 2 7.5a4.5 4.5 0 018-2.828A4.5 4.5 0 0118 7.5c0 2.852-2.044 5.233-3.885 6.82a22.049 22.049 0 01-3.744 2.582l-.019.01-.005.003h-.002a.723.723 0 01-.692 0h-.002z" />
            </svg>
            {favCount > 0 && <span>{formatCount(favCount)}</span>}
          </button>

          {/* Downvote */}
          <button
            onClick={toggleDownvote}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
              downvoted
                ? "text-orange-400 bg-orange-400/10"
                : "text-gray-400 hover:text-orange-400 hover:bg-brand-800/50"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill={downvoted ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M10 18a.75.75 0 01-.67-.415l-4-8A.75.75 0 016 8.75h2.25V3a.75.75 0 01.75-.75h2a.75.75 0 01.75.75v5.75H14a.75.75 0 01.67 1.085l-4 8A.75.75 0 0110 18z"
                clipRule="evenodd"
              />
            </svg>
            {downvoteCount > 0 && <span>{formatCount(downvoteCount)}</span>}
          </button>

          {/* Thread / Reply */}
          <button
            onClick={() => onThreadOpen(post.id)}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-gray-400 hover:text-brand-400 hover:bg-brand-800/50 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12M2.5 2.5h15v11H8.75L5 17.25V13.5H2.5v-11z"
              />
            </svg>
            {post._count.comments > 0 && (
              <span>{formatCount(post._count.comments)}</span>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}
