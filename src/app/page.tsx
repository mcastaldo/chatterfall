"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { LocationGate, useLocation } from "@/components/LocationGate";
import NavBar from "@/components/NavBar";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import FeedFilters from "@/components/FeedFilters";
import InfiniteScroll from "@/components/InfiniteScroll";
import type { PostWithMeta, FeedFilters as FeedFiltersType } from "@/types";

function useSocket(userId: string | null, lat: number, lon: number) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { userId, lat, lon });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, lat, lon]);

  return socketRef;
}

function FeedContent() {
  const { lat, lon } = useLocation();
  const [user, setUser] = useState<{
    id: string;
    username: string;
    displayName: string;
    profileImg: string | null;
  } | null>(null);
  const [posts, setPosts] = useState<PostWithMeta[]>([]);
  const [filters, setFilters] = useState<FeedFiltersType>({
    range: 0,
    postType: "all",
    userType: "all",
    search: "",
  });
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const socketRef = useSocket(user?.id ?? null, lat, lon);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {});
  }, []);

  // Fetch posts
  const fetchPosts = useCallback(
    async (cursorParam?: string) => {
      const params = new URLSearchParams();
      params.set("lat", String(lat));
      params.set("lon", String(lon));
      if (cursorParam) params.set("cursor", cursorParam);
      if (filters.range) params.set("range", String(filters.range));
      if (filters.postType !== "all") params.set("postType", filters.postType);
      if (filters.userType !== "all") params.set("userType", filters.userType);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) return { posts: [], nextCursor: undefined };
      return res.json();
    },
    [lat, lon, filters]
  );

  // Initial load and filter changes
  useEffect(() => {
    setLoading(true);
    setPosts([]);
    setCursor(undefined);
    setHasMore(true);

    fetchPosts().then((data) => {
      setPosts(data.posts ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    });
  }, [fetchPosts]);

  // Load more for infinite scroll
  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    const data = await fetchPosts(cursor);
    setPosts((prev) => [...prev, ...(data.posts ?? [])]);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, [cursor, loading, fetchPosts]);

  // Socket events
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleNewPost = (post: PostWithMeta) => {
      setPosts((prev) => [post, ...prev]);
    };

    const handleFavoriteUpdate = (data: {
      postId: string;
      count: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, _count: { ...p._count, favorites: data.count } }
            : p
        )
      );
    };

    const handleDownvoteUpdate = (data: {
      postId: string;
      count: number;
    }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, _count: { ...p._count, downvotes: data.count } }
            : p
        )
      );
    };

    socket.on("new-post", handleNewPost);
    socket.on("favorite-update", handleFavoriteUpdate);
    socket.on("downvote-update", handleDownvoteUpdate);

    return () => {
      socket.off("new-post", handleNewPost);
      socket.off("favorite-update", handleFavoriteUpdate);
      socket.off("downvote-update", handleDownvoteUpdate);
    };
  }, [socketRef]);

  const handleNewPost = () => {
    fetchPosts().then((data) => {
      setPosts(data.posts ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    });
  };

  return (
    <div className="min-h-screen">
      <NavBar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {user && (
          <PostComposer lat={lat} lon={lon} onPost={handleNewPost} />
        )}

        <FeedFilters filters={filters} onChange={setFilters} />

        <InfiniteScroll loadMore={loadMore} hasMore={hasMore}>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={user?.id}
              />
            ))}
            {!loading && posts.length === 0 && (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg">No posts nearby yet.</p>
                <p className="text-sm mt-2">
                  Be the first to post something!
                </p>
              </div>
            )}
          </div>
        </InfiniteScroll>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <LocationGate>
      <FeedContent />
    </LocationGate>
  );
}
