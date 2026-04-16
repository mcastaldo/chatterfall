"use client";

import { useEffect, useRef, useState } from "react";
import {
  getAnonIdentity,
  getOrCreateAnonIdClient,
  getAnonAvatarClient,
  setAnonAvatarClient,
} from "@/lib/anonIdentity";

// Small top-bar button that shows the current anonymous identity and
// lets the user pick a custom avatar (stored in localStorage).
export default function AnonIdentityButton() {
  const [anonId, setAnonId] = useState<string>("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAnonId(getOrCreateAnonIdClient());
    setAvatar(getAnonAvatarClient());

    const handler = () => setAvatar(getAnonAvatarClient());
    window.addEventListener("cf-anon-avatar-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("cf-anon-avatar-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const identity = anonId ? getAnonIdentity(anonId) : null;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > 1 * 1024 * 1024) {
      setError("Image must be under 1MB (stored on your device)");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Read failed"));
        reader.readAsDataURL(file);
      });
      setAnonAvatarClient(dataUrl);
      setAvatar(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setAnonAvatarClient(null);
    setAvatar(null);
  };

  if (!identity) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1 ml-1 flex items-center gap-1.5"
        title={`Your anonymous identity: ${identity.name}`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={identity.name}
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ backgroundColor: identity.color }}
          >
            {identity.initial}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-brand-900 border border-brand-700 rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-800 flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt={identity.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                style={{ backgroundColor: identity.color }}
              >
                {identity.initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {identity.name}
              </p>
              <p className="text-[11px] text-gray-500">Your anonymous identity</p>
            </div>
          </div>

          <div className="p-3 space-y-2">
            <p className="text-[11px] text-gray-400 leading-relaxed">
              This name and color are generated from a cookie on your device —
              others see them on your anonymous posts. You can also pick a
              profile picture, stored only in your browser.
            </p>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full text-sm bg-brand-700 hover:bg-brand-600 disabled:opacity-60 text-white rounded-md px-3 py-1.5 transition-colors"
            >
              {uploading
                ? "Uploading..."
                : avatar
                  ? "Change picture"
                  : "Upload picture"}
            </button>

            {avatar && (
              <button
                type="button"
                onClick={handleRemove}
                className="w-full text-xs text-gray-400 hover:text-red-400 py-1 transition-colors"
              >
                Remove picture
              </button>
            )}

            {error && (
              <p className="text-xs text-red-400 text-center">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
