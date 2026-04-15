"use client";

import { useState, useRef } from "react";

interface PostComposerProps {
  lat: number;
  lon: number;
  onPost?: () => void;
  isLoggedIn?: boolean;
}

const MAX_CHARS = 500;

export default function PostComposer({ lat, lon, onPost, isLoggedIn = false }: PostComposerProps) {
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(!isLoggedIn);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force anonymous if not logged in
  const isAnonymous = !isLoggedIn || anonymous;

  const charCount = content.length;
  const canSubmit = content.trim().length > 0 && charCount <= MAX_CHARS && !uploading;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      let imageUrl: string | undefined;

      // Upload image first if one is attached (only for logged-in users)
      if (imageFile && isLoggedIn) {
        setUploading(true);
        const formData = new FormData();
        formData.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          imageUrl = data.url;
        } else {
          const err = await uploadRes.json();
          alert(err.error || "Failed to upload image");
          setLoading(false);
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl,
          anonymous: isAnonymous,
          lat,
          lon,
        }),
      });

      if (res.ok) {
        setContent("");
        if (isLoggedIn) setAnonymous(false);
        removeImage();
        onPost?.();
      }
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brand-800/50 bg-brand-900/50 backdrop-blur p-4"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isLoggedIn ? "What's happening nearby?" : "Post anonymously — what's happening nearby?"}
        rows={3}
        maxLength={MAX_CHARS}
        className="w-full resize-none rounded-lg bg-brand-950/50 border border-brand-800/50 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
      />

      {/* Image preview */}
      {imagePreview && (
        <div className="mt-2 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-48 rounded-lg border border-brand-800/50"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Image attach button - only for logged-in users */}
          {isLoggedIn && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-400 transition-colors"
                title="Attach image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </>
          )}

          {/* Anonymous toggle - only show if logged in (always anonymous otherwise) */}
          {isLoggedIn ? (
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
                className="rounded border-brand-700 bg-brand-950 text-brand-500 focus:ring-brand-500"
              />
              Post anonymously
            </label>
          ) : (
            <span className="text-xs text-gray-500">
              Posting as Anonymous
            </span>
          )}

          <span
            className={`text-xs ${
              charCount > MAX_CHARS
                ? "text-red-400"
                : charCount > MAX_CHARS * 0.9
                ? "text-yellow-400"
                : "text-gray-500"
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {uploading ? "Uploading..." : "Posting..."}
            </span>
          ) : (
            "Post"
          )}
        </button>
      </div>
    </form>
  );
}
