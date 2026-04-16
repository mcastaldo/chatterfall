"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { LocationGate, useLocation } from "@/components/LocationGate";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import NearbyUsers from "@/components/NearbyUsers";
import ThreadPanel from "@/components/ThreadPanel";
import FeedFilters from "@/components/FeedFilters";
import NewMessagesPill from "@/components/NewMessagesPill";
import type { PostWithMeta, FeedFilters as FeedFiltersType } from "@/types";

const MapPanel = dynamic(() => import("@/components/MapPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-brand-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  ),
});

function useSocket(userId: string | null, lat: number, lon: number) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io();
    setSocket(s);

    s.on("connect", () => {
      s.emit("join", { userId, lat, lon });
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [userId, lat, lon]);

  return socket;
}

function FeedContent() {
  const { lat, lon, approximate, city } = useLocation();
  const router = useRouter();
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
  const [threadPostId, setThreadPostId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [newMessageCount, setNewMessageCount] = useState(0);

  // Map location
  const [mapLat, setMapLat] = useState(lat);
  const [mapLon, setMapLon] = useState(lon);
  const [usingMapLocation, setUsingMapLocation] = useState(false);
  const effectiveLat = usingMapLocation ? mapLat : lat;
  const effectiveLon = usingMapLocation ? mapLon : lon;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const socket = useSocket(user?.id ?? null, lat, lon);

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
    setNewMessageCount(0);

    fetchPosts().then((data) => {
      setPosts(data.posts ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    });
  }, [fetchPosts]);

  // Track if user is near bottom so we can auto-scroll on new messages
  const shouldAutoScroll = useRef(true);

  const handleScroll = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 150;
    shouldAutoScroll.current = nearBottom;

    // Clear unread count when user scrolls to bottom
    if (nearBottom) {
      setNewMessageCount(0);
    }
  }, []);

  // Auto-scroll to bottom when posts change
  const prevPostCount = useRef(0);
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el || posts.length === 0) return;

    const isNewPost = posts.length > prevPostCount.current;
    prevPostCount.current = posts.length;

    if (isNewPost && shouldAutoScroll.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [posts]);

  const scrollToBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setNewMessageCount(0);
    shouldAutoScroll.current = true;
  }, []);

  // Load older posts (scroll up)
  const loadOlder = useCallback(async () => {
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
    if (!socket) return;

    const handleNewPost = (post: PostWithMeta) => {
      setPosts((prev) => {
        // Replace any optimistic post with matching content
        const optimisticIdx = prev.findIndex(
          (p) => p.id.startsWith("optimistic-") && p.content === post.content
        );
        if (optimisticIdx !== -1) {
          const updated = [...prev];
          updated[optimisticIdx] = post;
          return updated;
        }
        return [post, ...prev];
      });

      // If user is scrolled up, increment unread count
      if (!shouldAutoScroll.current) {
        setNewMessageCount((c) => c + 1);
      }
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

    const handleNewComment = (data: { postId: string; commentCount: number }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId
            ? { ...p, _count: { ...p._count, comments: data.commentCount } }
            : p
        )
      );
    };

    const handleReactionUpdate = (data: { postId: string; reactions: Record<string, number> }) => {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== data.postId) return p;
          // Convert count-only data to full reaction shape, preserving current user's reacted state
          const updated: Record<string, { count: number; reacted: boolean }> = {};
          for (const [emoji, count] of Object.entries(data.reactions)) {
            updated[emoji] = {
              count,
              reacted: p.reactions?.[emoji]?.reacted ?? false,
            };
          }
          return { ...p, reactions: updated };
        })
      );
    };

    socket.on("new-post", handleNewPost);
    socket.on("favorite-update", handleFavoriteUpdate);
    socket.on("downvote-update", handleDownvoteUpdate);
    socket.on("new-comment", handleNewComment);
    socket.on("reaction-update", handleReactionUpdate);

    return () => {
      socket.off("new-post", handleNewPost);
      socket.off("favorite-update", handleFavoriteUpdate);
      socket.off("downvote-update", handleDownvoteUpdate);
      socket.off("new-comment", handleNewComment);
      socket.off("reaction-update", handleReactionUpdate);
    };
  }, [socket]);

  const handleNewPost = (optimisticPost?: PostWithMeta) => {
    if (optimisticPost) {
      setPosts((prev) => [optimisticPost, ...prev]);
    }
  };

  const handleMapLocationChange = (newLat: number, newLon: number) => {
    setMapLat(newLat);
    setMapLon(newLon);
    setUsingMapLocation(true);
  };

  const threadPost = threadPostId
    ? posts.find((p) => p.id === threadPostId) ?? null
    : null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-brand-800 bg-brand-950/95 backdrop-blur-md">
        <div className="flex items-center h-12 px-4">
          <span className="text-lg font-bold text-white tracking-tight mr-4">
            Chatterfall
          </span>

          <div className="flex items-center gap-2 text-sm text-gray-400 mr-auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="hidden sm:inline">
              {usingMapLocation
                ? "Custom location"
                : approximate
                  ? `Near ${city ?? "you"} (approx.)`
                  : "Your area"}
              {filters.range > 0
                ? ` \u2022 ${filters.range >= 1609 ? `${(filters.range / 1609).toFixed(1)} mi` : `${Math.round(filters.range)}m`}`
                : " \u2022 All posts"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {usingMapLocation && (
              <button
                onClick={() => { setUsingMapLocation(false); setMapLat(lat); setMapLon(lon); }}
                className="text-xs text-brand-400 hover:text-brand-300 px-2 py-1"
              >
                Reset location
              </button>
            )}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`p-2 rounded-lg transition-colors ${filtersOpen ? "bg-brand-800 text-white" : "text-gray-400 hover:text-white"}`}
              title="Filters"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
            <button
              onClick={() => setMapOpen(!mapOpen)}
              className={`p-2 rounded-lg transition-colors ${mapOpen ? "bg-brand-800 text-white" : "text-gray-400 hover:text-white"}`}
              title="Map"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </button>
            {user ? (
              <button
                onClick={() => router.push(`/profile/${user.id}`)}
                className="p-1 ml-1"
              >
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                  {user.profileImg ? (
                    <img src={user.profileImg} alt="" className="w-full h-full object-cover" />
                  ) : (
                    (user.displayName || user.username).charAt(0).toUpperCase()
                  )}
                </div>
              </button>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="text-sm text-brand-400 hover:text-brand-300 px-2 py-1 ml-1"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {filtersOpen && (
          <div className="border-t border-brand-800 px-4 py-2">
            <FeedFilters filters={filters} onChange={setFilters} />
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar - Nearby Users */}
        <div className="hidden lg:flex w-[200px] flex-shrink-0 border-r border-brand-800 bg-brand-900/30 flex-col overflow-y-auto">
          <NearbyUsers
            posts={posts}
            onUserClick={(userId) => router.push(`/profile/${userId}`)}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Messages */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-2"
          >
            {hasMore && (
              <div className="text-center py-3">
                <button
                  onClick={loadOlder}
                  disabled={loading}
                  className="text-xs text-brand-400 hover:text-brand-300 disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load older messages"}
                </button>
              </div>
            )}

            <div className="flex flex-col">
              {[...posts].reverse().map((post) => (
                <ChatMessage
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  onThreadOpen={(id) => setThreadPostId(id)}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {!loading && posts.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 mb-3 text-brand-700">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p className="text-lg font-medium">No messages yet</p>
                <p className="text-sm mt-1">Be the first to say something!</p>
              </div>
            )}
          </div>

          {/* New messages pill */}
          <NewMessagesPill
            count={newMessageCount}
            onClick={scrollToBottom}
            visible={newMessageCount > 0}
          />

          {/* Chat input */}
          <div className="flex-shrink-0 border-t border-brand-800 bg-brand-950/80 px-4 py-3">
            <ChatInput
              lat={lat}
              lon={lon}
              isLoggedIn={!!user}
              user={user}
              onPost={handleNewPost}
            />
          </div>
        </div>

        {/* Thread panel */}
        {threadPostId && (
          <div className="hidden sm:flex w-[380px] flex-shrink-0 border-l border-brand-800 bg-brand-950 flex-col">
            <ThreadPanel
              postId={threadPostId}
              post={threadPost}
              currentUserId={user?.id}
              lat={lat}
              lon={lon}
              isLoggedIn={!!user}
              onClose={() => setThreadPostId(null)}
            />
          </div>
        )}

        {threadPostId && (
          <div className="sm:hidden fixed inset-0 z-50 bg-brand-950 flex flex-col">
            <ThreadPanel
              postId={threadPostId}
              post={threadPost}
              currentUserId={user?.id}
              lat={lat}
              lon={lon}
              isLoggedIn={!!user}
              onClose={() => setThreadPostId(null)}
            />
          </div>
        )}

        {mapOpen && (
          <div className="hidden md:flex w-[420px] flex-shrink-0 border-l border-brand-800 bg-brand-950 flex-col">
            <MapPanel
              posts={posts}
              userLat={lat}
              userLon={lon}
              radius={filters.range}
              onLocationChange={handleMapLocationChange}
              onClose={() => setMapOpen(false)}
            />
          </div>
        )}
        {mapOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-brand-950 flex flex-col">
            <MapPanel
              posts={posts}
              userLat={lat}
              userLon={lon}
              radius={filters.range}
              onLocationChange={handleMapLocationChange}
              onClose={() => setMapOpen(false)}
            />
          </div>
        )}
      </div>
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
