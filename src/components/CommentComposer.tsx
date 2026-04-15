"use client";

import { useState } from "react";

interface CommentComposerProps {
  postId: string;
  lat: number;
  lon: number;
  onComment?: () => void;
}

export default function CommentComposer({
  postId,
  lat,
  lon,
  onComment,
}: CommentComposerProps) {
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          anonymous,
          lat,
          lon,
        }),
      });

      if (res.ok) {
        setContent("");
        setAnonymous(false);
        onComment?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-brand-800/30 bg-brand-900/30 backdrop-blur p-3"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        rows={2}
        className="w-full resize-none rounded-lg bg-brand-950/50 border border-brand-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="rounded border-brand-700 bg-brand-950 text-brand-500 focus:ring-brand-500"
          />
          Anonymous
        </label>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Posting...
            </span>
          ) : (
            "Comment"
          )}
        </button>
      </div>
    </form>
  );
}
