"use client";

import { useEffect, useState } from "react";
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
            <UserAvatar user={profile} size="lg" />
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
