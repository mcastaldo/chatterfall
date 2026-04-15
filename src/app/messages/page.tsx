"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import UserAvatar from "@/components/UserAvatar";
import type { ConversationPreview } from "@/types";
import { formatDistanceToNow } from "date-fns";

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    username: string;
    displayName: string;
    profileImg: string | null;
  } | null>(null);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  useEffect(() => {
    if (!user) return;

    fetch("/api/messages/conversations")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setConversations(Array.isArray(data) ? data : data.conversations ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <NavBar user={user} />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>

        {loading ? (
          <div className="text-center text-gray-400 py-12">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">No conversations yet.</p>
            <p className="text-sm mt-2">
              Start a conversation from someone&apos;s profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link
                key={conv.user.id}
                href={`/messages/${conv.user.id}`}
                className="card flex items-center gap-4 hover:bg-brand-800/50 transition-colors cursor-pointer"
              >
                <UserAvatar user={conv.user} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white truncate">
                      {conv.user.displayName || conv.user.username}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {conv.lastMessage?.content || "No messages yet"}
                  </p>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="bg-brand-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
