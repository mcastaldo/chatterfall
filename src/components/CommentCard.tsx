"use client";

import { formatDistanceToNow } from "date-fns";
import type { CommentWithMeta } from "@/types";
import UserAvatar from "./UserAvatar";

interface CommentCardProps {
  comment: CommentWithMeta;
  currentUserId?: string;
}

export default function CommentCard({ comment }: CommentCardProps) {
  const isAnonymous = comment.anonymous || !comment.author;

  return (
    <div className="rounded-lg border border-brand-800/30 bg-brand-900/30 backdrop-blur p-3">
      <div className="flex items-center gap-2.5 mb-2">
        <UserAvatar
          user={
            isAnonymous
              ? null
              : {
                  displayName: comment.author?.displayName ?? null,
                  profileImg: comment.author?.profileImg ?? null,
                }
          }
          size="sm"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {isAnonymous
              ? "Anonymous"
              : comment.author?.displayName ?? "Unknown"}
          </p>
          <p className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      <p className="text-gray-200 text-sm whitespace-pre-wrap break-words mb-2">
        {comment.content}
      </p>

      <div className="flex items-center gap-4 pt-2 border-t border-brand-800/20">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {comment._count.favorites}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5"
          >
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
          {comment._count.downvotes}
        </span>
      </div>
    </div>
  );
}
