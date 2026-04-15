"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { io, Socket } from "socket.io-client";
import { LocationGate, useLocation } from "@/components/LocationGate";
import NavBar from "@/components/NavBar";
import PostComposer from "@/components/PostComposer";
import PostCard from "@/components/PostCard";
import FeedFilters from "@/components/FeedFilters";
import InfiniteScroll from "@/components/InfiniteScroll";
import type { PostWithMeta, FeedFilters as FeedFiltersType } from "@/types";

// Dynamic import for MapPanel (Leaflet doesn't support SSR)
const MapPanel = dynamic(() => import("@/components/MapPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-brand-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  ),
});

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
  const [mapOpen, setMapOpen] = useState(false);

  // Custom map location (when user moves the marker on the map)
  const [mapLat, setMapLat] = useState(lat);
  const [mapLon, setMapLon] = useState(lon);
  const [usingMapLocation, setUsingMapLocation] = useState(false);

  // The effective lat/lon for fetching posts
  const effectiveLat = usingMapLocation ? mapLat : lat;
  const effectiveLon = usingMapLocation ? mapLon : lon;

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
      params.set("lat", String(effectiveLat));
      params.set("lon", String(effectiveLon));
      if (cursorParam) params.set("cursor", cursorParam);
      if (filters.range) params.set("range", String(filters.range));
      if (filters.postType !== "all") params.set("postType", filters.postType);
      if (filters.userType !== "all") params.set("userType", filters.userType);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/posts?${params.toString()}`);
      if (!res.ok) return { posts: [], nextCursor: undefined };
      return res.json();
    },
    [effectiveLat, effectiveLon, filters]
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

    const handleFavoriteUpdate = (data: { postId: string; count: number }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, _count: { ...p._count, favorites: data.count } }
            : p
        )
      );
    };

    const handleDownvoteUpdate = (data: { postId: string; count: number }) => {
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

  const handleMapLocationChange = (newLat: number, newLon: number) => {
    setMapLat(newLat);
    setMapLon(newLon);
    setUsingMapLocation(true);
  };

  const handleMapClose = () => {
    setMapOpen(false);
  };

  const handleResetLocation = () => {
    setUsingMapLocation(false);
    setMapLat(lat);
    setMapLon(lon);
  };

  return (
    <div className="min-h-screen flex">
      {/* Main feed */}
      <div className="flex-1 min-w-0">
        <NavBar user={user} />

        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          <PostComposer lat={lat} lon={lon} onPost={handleNewPost} isLoggedIn={!!user} />

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FeedFilters filters={filters} onChange={setFilters} />
            </div>
            {/* Map toggle button */}
            <button
              onClick={() => setMapOpen(!mapOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                mapOpen
                  ? "bg-brand-500 text-white"
                  : "bg-brand-900/50 border border-brand-800 text-gray-300 hover:text-white hover:border-brand-600"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Map
            </button>
          </div>

          {/* Map location indicator */}
          {usingMapLocation && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-800/50 border border-brand-700 text-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-brand-400 flex-shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-gray-300">
                Viewing posts from map location
              </span>
              <button
                onClick={handleResetLocation}
                className="ml-auto text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                Reset to my location
              </button>
            </div>
          )}

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

      {/* Map sidebar */}
      {mapOpen && (
        <div className="hidden md:flex w-[420px] flex-shrink-0 border-l border-brand-800 bg-brand-950 flex-col sticky top-0 h-screen">
          <MapPanel
            posts={posts}
            userLat={lat}
            userLon={lon}
            radius={filters.range}
            onLocationChange={handleMapLocationChange}
            onClose={handleMapClose}
          />
        </div>
      )}

      {/* Map overlay on mobile */}
      {mapOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-brand-950 flex flex-col">
          <MapPanel
            posts={posts}
            userLat={lat}
            userLon={lon}
            radius={filters.range}
            onLocationChange={handleMapLocationChange}
            onClose={handleMapClose}
          />
        </div>
      )}
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
