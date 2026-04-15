"use client";

import { useEffect, useRef, useCallback, useState, type ReactNode } from "react";

interface InfiniteScrollProps {
  loadMore: () => Promise<void>;
  hasMore: boolean;
  children: ReactNode;
}

export default function InfiniteScroll({
  loadMore,
  hasMore,
  children,
}: InfiniteScrollProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleLoadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      await loadMore();
    } finally {
      setLoading(false);
    }
  }, [loadMore, hasMore, loading]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleLoadMore, hasMore, loading]);

  return (
    <div>
      {children}
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
