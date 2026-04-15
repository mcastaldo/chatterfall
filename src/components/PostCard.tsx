"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import type { PostWithMeta } from "@/types";
import UserAvatar from "./UserAvatar";

interface PostCardProps {
  post: PostWithMeta;
  currentUserId?: string;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(post.favorited ?? false);
  const [favoriteCount, setFavoriteCount] = useState(post._count.favorites);
  const [downvoted, setDownvoted] = useState(post.downvoted ?? false);
  const [downvoteCount, setDownvoteCount] = useState(post._count.downvotes);

  const isAnonymous = post.anonymous || !post.author;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;

    setFavorited(!favorited);
    setFavoriteCount((c) => (favorited ? c - 1 : c + 1));

    try {
      await fetch(`/api/posts/${post.id}/favorite`, { method: "POST" });
    } catch {
      setFavorited(!favorited);
      setFavoriteCount((c) => (favorited ? c + 1 : c - 1));
    }
  };

  const handleDownvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) return;

    setDownvoted(!downvoted);
    setDownvoteCount((c) => (downvoted ? c - 1 : c + 1));

    try {
      await fetch(`/api/posts/${post.id}/downvote`, { method: "POST" });
    } catch {
      setDownvoted(!downvoted);
      setDownvoteCount((c) => (downvoted ? c + 1 : c - 1));
    }
  };

  const handleNavigate = () => {
    router.push(`/post/${post.id}`);
  };

  return (
    <div
      onClick={handleNavigate}
      className="cursor-pointer rounded-xl border border-brand-800/50 bg-brand-900/50 backdrop-blur p-4 hover:border-brand-700/50 transition-colors"
    >
      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <UserAvatar
          user={
            isAnonymous
              ? null
              : {
                  displayName: post.author?.displayName ?? null,
                  profileImg: post.author?.profileImg ?? null,
                }
          }
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {isAnonymous ? "Anonymous" : post.author?.displayName ?? "Unknown"}
          </p>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      {/* Content */}
      <p className="text-gray-200 text-sm whitespace-pre-wrap break-words mb-3">
        {post.content}
      </p>

      {/* Image */}
      {post.imageUrl && (
        <div className="mb-3 overflow-hidden rounded-lg">
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-4 pt-2 border-t border-brand-800/30">
        {/* Favorite */}
        <button
          onClick={handleFavorite}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            favorited
              ? "text-red-400"
              : "text-gray-400 hover:text-red-400"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={favorited ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{favoriteCount}</span>
        </button>

        {/* Downvote */}
        <button
          onClick={handleDownvote}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            downvoted
              ? "text-orange-400"
              : "text-gray-400 hover:text-orange-400"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill={downvoted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
          <span>{downvoteCount}</span>
        </button>

        {/* Comments */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNavigate();
          }}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>{post._count.comments}</span>
        </button>

        {/* Distance */}
        {post.distance != null && (
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {post.distance < 1
              ? `${Math.round(post.distance * 1000)}m`
              : `${post.distance.toFixed(1)}km`}
          </span>
        )}
      </div>
    </div>
  );
}
