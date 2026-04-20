"use client";

import { useState } from "react";

interface MessageComposerProps {
  recipientTarget: string;
  onSend?: () => void;
}

export default function MessageComposer({
  recipientTarget,
  onSend,
}: MessageComposerProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const canSend = content.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/messages/${recipientTarget}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (res.ok) {
        setContent("");
        onSend?.();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-brand-800/50 bg-brand-950/80 backdrop-blur p-3"
    >
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        className="flex-1 rounded-lg bg-brand-900/50 border border-brand-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <button
        type="submit"
        disabled={!canSend || loading}
        className="flex items-center justify-center rounded-lg bg-brand-500 p-2 text-white hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2l-7 20-4-9-9-4z" />
          </svg>
        )}
      </button>
    </form>
  );
}
