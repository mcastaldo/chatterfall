"use client";

import { useState } from "react";
import { REACTION_EMOJIS } from "@/lib/reactions";

interface EmojiReactionsProps {
  postId: string;
  reactions: Record<string, { count: number; reacted: boolean }>;
  currentUserId?: string;
}

export default function EmojiReactions({
  postId,
  reactions,
  currentUserId,
}: EmojiReactionsProps) {
  const [localReactions, setLocalReactions] = useState(reactions);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sync from parent when reactions prop changes (e.g. from socket)
  // Use JSON comparison since it's a small object
  const reactionsKey = JSON.stringify(reactions);
  const [prevKey, setPrevKey] = useState(reactionsKey);
  if (reactionsKey !== prevKey) {
    setPrevKey(reactionsKey);
    setLocalReactions(reactions);
  }

  const toggleReaction = async (emoji: string) => {
    if (!currentUserId || busy) return;

    // Optimistic update
    const prev = localReactions;
    const current = localReactions[emoji];
    const wasReacted = current?.reacted ?? false;

    setLocalReactions((r) => {
      const updated = { ...r };
      if (wasReacted) {
        const newCount = (current?.count ?? 1) - 1;
        if (newCount <= 0) {
          delete updated[emoji];
        } else {
          updated[emoji] = { count: newCount, reacted: false };
        }
      } else {
        updated[emoji] = {
          count: (current?.count ?? 0) + 1,
          reacted: true,
        };
      }
      return updated;
    });

    setPickerOpen(false);
    setBusy(true);

    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on error
      setLocalReactions(prev);
    } finally {
      setBusy(false);
    }
  };

  const activeEmojis = Object.entries(localReactions).filter(
    ([, v]) => v.count > 0
  );

  return (
    <div className="flex items-center gap-1 mt-1 flex-wrap">
      {activeEmojis.map(([emoji, { count, reacted }]) => (
        <button
          key={emoji}
          onClick={() => toggleReaction(emoji)}
          disabled={!currentUserId}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors border ${
            reacted
              ? "border-brand-500/50 bg-brand-500/15 text-white"
              : "border-brand-800 bg-brand-900/50 text-gray-400 hover:border-brand-700 hover:bg-brand-800/50"
          } ${!currentUserId ? "cursor-default" : "cursor-pointer"}`}
        >
          <span className="text-sm leading-none">{emoji}</span>
          <span>{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      {currentUserId && (
        <div className="relative">
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs text-gray-500 hover:text-gray-300 hover:bg-brand-800/50 transition-colors border border-transparent hover:border-brand-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path d="M10 4.5a.75.75 0 01.75.75v3.25H14a.75.75 0 010 1.5h-3.25v3.25a.75.75 0 01-1.5 0v-3.25H6a.75.75 0 010-1.5h3.25V5.25A.75.75 0 0110 4.5z" />
            </svg>
          </button>

          {/* Picker popover */}
          {pickerOpen && (
            <>
              {/* Backdrop to close picker */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setPickerOpen(false)}
              />
              <div className="absolute bottom-full left-0 mb-1 z-50 flex gap-0.5 bg-brand-900 border border-brand-700 rounded-lg p-1.5 shadow-lg">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded-md text-lg hover:bg-brand-800 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
