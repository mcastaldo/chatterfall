"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import UserAvatar from "@/components/UserAvatar";
import type { UserPublic, UserStats } from "@/types";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    displayName: string;
    profileImg: string | null;
  } | null>(null);
  const [profile, setProfile] = useState<UserPublic | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Fetch current user
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCurrentUser(data);
      })
      .catch(() => {});
  }, []);

  // Fetch profile data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/users/${userId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setProfile(data.user ?? data);
        setStats(data.stats ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Image must be under 2MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const { url } = await uploadRes.json();

      const patchRes = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImg: url }),
      });
      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(err.error || "Could not save profile");
      }
      const updated = await patchRes.json();

      // Update both local state objects
      setCurrentUser((prev) =>
        prev ? { ...prev, profileImg: updated.profileImg } : prev
      );
      setProfile((prev) =>
        prev ? { ...prev, profileImg: updated.profileImg } : prev
      );
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileImg: null }),
      });
      if (!res.ok) throw new Error("Could not remove profile picture");
      setCurrentUser((prev) => (prev ? { ...prev, profileImg: null } : prev));
      setProfile((prev) => (prev ? { ...prev, profileImg: null } : prev));
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const isOwnProfile = currentUser?.id === userId;

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavBar user={currentUser} />
        <div className="text-center text-gray-400 py-24">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <NavBar user={currentUser} />
        <div className="text-center py-24">
          <h2 className="text-xl font-bold text-white">User not found</h2>
          <p className="text-gray-400 mt-2">
            This user does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar user={currentUser} />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="card text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <UserAvatar user={profile} size="lg" />
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-400 text-white flex items-center justify-center border-2 border-brand-950 transition-colors disabled:opacity-60"
                  title="Change profile picture"
                >
                  {uploadingAvatar ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 1H8.828a2 2 0 00-1.414.586L6.293 2.707A1 1 0 015.586 3H4zm6 11a4 4 0 100-8 4 4 0 000 8z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
            {isOwnProfile && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {profile.profileImg && !uploadingAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Remove picture
                  </button>
                )}
                {avatarError && (
                  <p className="text-xs text-red-400">{avatarError}</p>
                )}
              </>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-gray-400">@{profile.username}</p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-brand-900 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">
                  {stats.postCount ?? 0}
                </p>
                <p className="text-sm text-gray-400">Posts</p>
              </div>
              <div className="bg-brand-900 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">
                  {stats.commentCount ?? 0}
                </p>
                <p className="text-sm text-gray-400">Comments</p>
              </div>
              <div className="bg-brand-900 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">
                  {stats.totalFavorites ?? 0}
                </p>
                <p className="text-sm text-gray-400">Favorites</p>
              </div>
              <div className="bg-brand-900 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">
                  {stats.fameScore ?? 0}
                </p>
                <p className="text-sm text-gray-400">Fame</p>
              </div>
            </div>
          )}

          {isOwnProfile && (
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn-secondary"
            >
              {loggingOut ? "Logging out..." : "Log Out"}
            </button>
          )}

          {!isOwnProfile && currentUser && (
            <button
              onClick={() => router.push(`/messages/${userId}`)}
              className="btn-primary"
            >
              Send Message
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
