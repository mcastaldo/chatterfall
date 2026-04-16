"use client";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "@/components/UserAvatar";
import type { PostWithMeta, CommentWithMeta } from "@/types";
import { getAnonIdentity, getOrCreateAnonIdClient, getAnonAvatarClient } from "@/lib/anonIdentity";

interface ThreadPanelProps {
  postId: string;
  post: PostWithMeta | null;
  currentUserId?: string;
  lat: number;
  lon: number;
  isLoggedIn: boolean;
  onClose: () => void;
}

export default function ThreadPanel({
  postId,
  post,
  currentUserId,
  lat,
  lon,
  isLoggedIn,
  onClose,
}: ThreadPanelProps) {
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(!isLoggedIn);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    const anonId = anonymous ? getOrCreateAnonIdClient() : null;
    const anonAvatar = anonymous ? getAnonAvatarClient() : null;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed, anonymous, anonId, anonAvatar, lat, lon }),
      });
      if (res.ok) {
        setContent("");
        await fetchComments();
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isAnonymous = (
    author: { displayName: string | null; username: string; profileImg: string | null } | null,
    anon: boolean
  ) => anon || !author;

  return (
    <div className="flex flex-col h-full w-80 bg-brand-950 border-l border-brand-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-800">
        <div className="flex items-center gap-2">
          <h2 className="text-white font-semibold text-sm">Thread</h2>
          <span className="text-xs text-gray-500">
            {comments.length} {comments.length === 1 ? "reply" : "replies"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-brand-800/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      {/* Original post */}
      {post && (
        <div className="px-4 py-3 border-b border-brand-800">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              {isAnonymous(post.author, post.anonymous) ? (
                post.anonId ? (
                  (() => {
                    const id = getAnonIdentity(post.anonId);
                    return post.anonAvatar ? (
                      <img
                        src={post.anonAvatar}
                        alt={id.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: id.color }}
                      >
                        {id.initial}
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand-800 flex items-center justify-center text-gray-500 text-lg font-bold">
                    ?
                  </div>
                )
              ) : (
                <UserAvatar user={post.author} size="md" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                {isAnonymous(post.author, post.anonymous) ? (
                  <span className="text-gray-400 italic text-sm">
                    {post.anonId ? getAnonIdentity(post.anonId).name : "Anonymous"}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <span className="font-semibold text-white text-sm">
                      {post.author?.displayName || post.author?.username}
                    </span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-3.5 h-3.5 text-brand-400 flex-shrink-0"
                      aria-label="Registered user"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-gray-200 text-sm whitespace-pre-wrap break-words mt-0.5">
                {post.content}
              </p>
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt="Post attachment"
                  className="mt-2 max-h-48 rounded-lg object-cover"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Replies divider */}
      <div className="flex items-center gap-2 px-4 py-2">
        <div className="flex-1 h-px bg-brand-800" />
        <span className="text-xs text-gray-500">
          {comments.length} {comments.length === 1 ? "reply" : "replies"}
        </span>
        <div className="flex-1 h-px bg-brand-800" />
      </div>

      {/* Comments list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-gray-500 text-sm py-8">
            No replies yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-2.5 px-2 py-1.5 rounded-lg hover:bg-brand-900/30 transition-colors"
            >
              <div className="flex-shrink-0 mt-0.5">
                {isAnonymous(comment.author, comment.anonymous) ? (
                  comment.anonId ? (
                    (() => {
                      const id = getAnonIdentity(comment.anonId);
                      return comment.anonAvatar ? (
                        <img
                          src={comment.anonAvatar}
                          alt={id.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: id.color }}
                        >
                          {id.initial}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-800 flex items-center justify-center text-gray-500 text-xs font-bold">
                      ?
                    </div>
                  )
                ) : (
                  <UserAvatar user={comment.author} size="sm" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  {isAnonymous(comment.author, comment.anonymous) ? (
                    <span className="text-gray-400 italic text-xs">
                      {comment.anonId ? getAnonIdentity(comment.anonId).name : "Anonymous"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="font-semibold text-white text-xs">
                        {comment.author?.displayName || comment.author?.username}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-3 h-3 text-brand-400 flex-shrink-0"
                        aria-label="Registered user"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-gray-200 text-xs whitespace-pre-wrap break-words mt-0.5">
                  {comment.content}
                </p>
                {comment.imageUrl && (
                  <img
                    src={comment.imageUrl}
                    alt="Comment attachment"
                    className="mt-1.5 max-h-32 rounded-lg object-cover"
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-brand-800">
        <div className="rounded-lg bg-brand-800 border border-brand-700 overflow-hidden">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isLoggedIn ? "Reply to thread..." : "Reply anonymously..."
            }
            rows={1}
            className="w-full bg-transparent text-gray-200 text-sm placeholder-gray-500 px-3 py-2 resize-none focus:outline-none max-h-20"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <div className="flex items-center gap-2">
              {isLoggedIn ? (
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="w-3 h-3 rounded border-brand-600 bg-brand-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
                  />
                  <span className="text-[10px] text-gray-500">Anonymous</span>
                </label>
              ) : (
                <span className="text-[10px] text-gray-500">
                  Commenting as Anonymous
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="text-brand-400 hover:text-brand-300 disabled:text-gray-600 transition-colors p-0.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
