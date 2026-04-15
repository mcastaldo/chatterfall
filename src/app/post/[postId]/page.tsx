"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { LocationGate, useLocation } from "@/components/LocationGate";
import NavBar from "@/components/NavBar";
import PostCard from "@/components/PostCard";
import CommentCard from "@/components/CommentCard";
import CommentComposer from "@/components/CommentComposer";
import InfiniteScroll from "@/components/InfiniteScroll";
import type { PostWithMeta, CommentWithMeta } from "@/types";

function PostDetailContent() {
  const { postId } = useParams<{ postId: string }>();
  const { lat, lon } = useLocation();
  const [user, setUser] = useState<{
    id: string;
    username: string;
    displayName: string;
    profileImg: string | null;
  } | null>(null);
  const [post, setPost] = useState<PostWithMeta | null>(null);
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {});
  }, []);

  // Fetch the post
  useEffect(() => {
    fetch(`/api/posts/${postId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPost(data);
      })
      .catch(() => {});
  }, [postId]);

  // Fetch comments
  const fetchComments = useCallback(
    async (cursorParam?: string) => {
      const params = new URLSearchParams();
      if (cursorParam) params.set("cursor", cursorParam);

      const res = await fetch(
        `/api/posts/${postId}/comments?${params.toString()}`
      );
      if (!res.ok) return { comments: [], nextCursor: undefined };
      return res.json();
    },
    [postId]
  );

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchComments().then((data) => {
      setComments(data.comments ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    });
  }, [fetchComments]);

  // Load more
  const loadMore = useCallback(async () => {
    if (!cursor) return;
    const data = await fetchComments(cursor);
    setComments((prev) => [...prev, ...(data.comments ?? [])]);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
  }, [cursor, fetchComments]);

  // Socket connection
  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"
    );
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { userId: user?.id, lat, lon });
    });

    const handleNewComment = (data: {
      postId: string;
      comment: CommentWithMeta;
    }) => {
      if (data.postId === postId) {
        setComments((prev) => [...prev, data.comment]);
        // Update comment count on the post card
        setPost((prev) =>
          prev
            ? {
                ...prev,
                _count: { ...prev._count, comments: prev._count.comments + 1 },
              }
            : prev
        );
      }
    };

    socket.on("new-comment", handleNewComment);

    return () => {
      socket.off("new-comment", handleNewComment);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, lat, lon, postId]);

  const handleNewComment = () => {
    fetchComments().then((data) => {
      setComments(data.comments ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    });
    // Refresh post to update comment count
    fetch(`/api/posts/${postId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPost(data);
      });
  };

  return (
    <div className="min-h-screen">
      <NavBar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Link
          href="/"
          className="inline-flex items-center text-brand-400 hover:text-brand-300 text-sm font-medium"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to feed
        </Link>

        {/* Original post */}
        {post ? (
          <PostCard post={post} currentUserId={user?.id} />
        ) : (
          <div className="card text-center text-gray-400 py-6">
            Loading post...
          </div>
        )}

        {/* Comments section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Comments ({post?._count.comments ?? 0})
          </h2>

          {loading ? (
            <div className="text-center text-gray-400 py-8">
              Loading comments...
            </div>
          ) : (
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
              <div className="space-y-3">
                {comments.map((comment) => (
                  <CommentCard
                    key={comment.id}
                    comment={comment}
                    currentUserId={user?.id}
                  />
                ))}
                {comments.length === 0 && (
                  <p className="text-center text-gray-400 py-8">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>
            </InfiniteScroll>
          )}
        </div>

        <CommentComposer
          postId={postId}
          lat={lat}
          lon={lon}
          onComment={handleNewComment}
          isLoggedIn={!!user}
        />
      </main>
    </div>
  );
}

export default function PostDetailPage() {
  return (
    <LocationGate>
      <PostDetailContent />
    </LocationGate>
  );
}
