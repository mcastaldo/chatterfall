"use client";

import { useState, useRef } from "react";
import { getOrCreateAnonIdClient, getAnonAvatarClient } from "@/lib/anonIdentity";

interface ChatInputProps {
  lat: number;
  lon: number;
  isLoggedIn: boolean;
  user?: { id: string; username: string; displayName: string; profileImg: string | null } | null;
  onPost: (optimisticPost?: any) => void;
}

export default function ChatInput({
  lat,
  lon,
  isLoggedIn,
  user,
  onPost,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(!isLoggedIn);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_CHARS = 500;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= MAX_CHARS) {
      setContent(val);
    }
    // Auto-resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 80) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent | React.KeyboardEvent
  ) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);

    // Get stable anonId + avatar for this browser (only used when posting anonymously)
    const anonId = anonymous ? getOrCreateAnonIdClient() : null;
    const anonAvatar = anonymous ? getAnonAvatarClient() : null;

    // Optimistic: show post immediately
    const optimisticPost = {
      id: `optimistic-${Date.now()}`,
      content: trimmed,
      imageUrl: imagePreview,
      lat,
      lon,
      anonymous,
      anonId,
      anonAvatar,
      createdAt: new Date().toISOString(),
      author: anonymous ? null : user ?? null,
      _count: { comments: 0, favorites: 0, downvotes: 0 },
      favorited: false,
      downvoted: false,
      distance: 0,
    };

    // Clear input immediately for snappy feel
    setContent("");
    const savedImage = imageFile;
    removeImage();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Show it in the feed right away
    onPost(optimisticPost);

    try {
      let imageUrl: string | null = null;

      // Upload image if present
      if (savedImage) {
        const formData = new FormData();
        formData.append("file", savedImage);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }
      }

      await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmed,
          anonymous,
          anonId,
          anonAvatar,
          lat,
          lon,
          imageUrl,
        }),
      });
    } catch {
      // ignore - post already shown optimistically
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Image preview */}
      {imagePreview && (
        <div className="relative inline-block mb-2">
          <img
            src={imagePreview}
            alt="Attachment preview"
            className="h-16 w-16 object-cover rounded-lg border border-brand-700"
          />
          <button
            onClick={removeImage}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-800 border border-brand-700 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3 h-3"
            >
              <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
            </svg>
          </button>
        </div>
      )}

      {/* Input container */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-lg bg-brand-800 border border-brand-700 overflow-hidden">
          <div className="flex items-end">
            {/* Image attach button (logged in only) */}
            {isLoggedIn && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-2.5 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M15.621 4.379a3 3 0 00-4.242 0l-7 7a3 3 0 004.241 4.243h.001l.497-.5a.75.75 0 011.064 1.057l-.498.501-.002.002a4.5 4.5 0 01-6.364-6.364l7-7a4.5 4.5 0 016.368 6.36l-3.455 3.553A2.625 2.625 0 119.52 9.52l3.45-3.451a.75.75 0 111.061 1.06l-3.45 3.451a1.125 1.125 0 001.587 1.595l3.454-3.553a3 3 0 000-4.242z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isLoggedIn
                  ? "Message nearby..."
                  : "Message anonymously..."
              }
              rows={1}
              className={`flex-1 bg-transparent text-gray-200 text-sm placeholder-gray-500 py-2.5 ${
                isLoggedIn ? "" : "pl-3"
              } pr-2 resize-none focus:outline-none`}
              style={{ maxHeight: 80 }}
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!content.trim() || submitting}
              className="flex-shrink-0 p-2.5 text-brand-400 hover:text-brand-300 disabled:text-gray-600 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom row: anonymous toggle + char count */}
        <div className="flex items-center justify-between mt-1.5 px-1">
          <div>
            {isLoggedIn ? (
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-3 h-3 rounded border-brand-600 bg-brand-900 text-brand-500 focus:ring-brand-500 focus:ring-offset-0"
                />
                <span className="text-[11px] text-gray-500">
                  Post anonymously
                </span>
              </label>
            ) : (
              <span className="text-[11px] text-gray-500">
                Posting as Anonymous
              </span>
            )}
          </div>
          <span
            className={`text-[11px] ${
              content.length > MAX_CHARS * 0.9
                ? "text-orange-400"
                : "text-gray-600"
            }`}
          >
            {content.length}/{MAX_CHARS}
          </span>
        </div>
      </form>
    </div>
  );
}
