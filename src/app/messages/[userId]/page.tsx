"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import MessageBubble from "@/components/MessageBubble";
import MessageComposer from "@/components/MessageComposer";
import type { MessageData } from "@/types";

export default function ConversationPage() {
  const { userId: recipientId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [user, setUser] = useState<{
    id: string;
    username: string;
    displayName: string;
    profileImg: string | null;
  } | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Auth check
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

  // Fetch messages
  const fetchMessages = useCallback(
    async (cursorParam?: string) => {
      const params = new URLSearchParams();
      if (cursorParam) params.set("cursor", cursorParam);

      const res = await fetch(
        `/api/messages/${recipientId}?${params.toString()}`
      );
      if (!res.ok) return { messages: [], nextCursor: undefined };
      return res.json();
    },
    [recipientId]
  );

  // Initial load
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchMessages().then((data) => {
      setMessages(data.messages ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      setLoading(false);
    });
  }, [user, fetchMessages]);

  // Load older messages
  const loadMore = useCallback(async () => {
    if (!cursor) return;
    const data = await fetchMessages(cursor);
    setMessages((prev) => [...(data.messages ?? []), ...prev]);
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
  }, [cursor, fetchMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket connection
  useEffect(() => {
    if (!user) return;

    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { userId: user.id });
    });

    const handleNewMessage = (message: MessageData) => {
      if (message.senderId === recipientId) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, recipientId]);

  const handleSend = () => {
    fetchMessages().then((data) => {
      setMessages(data.messages ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={user} />

      <div className="max-w-2xl mx-auto w-full px-4 py-4 flex-shrink-0">
        <Link
          href="/messages"
          className="inline-flex items-center text-brand-400 hover:text-brand-300 text-sm font-medium"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to conversations
        </Link>
      </div>

      <main className="max-w-2xl mx-auto w-full px-4 flex-1 flex flex-col min-h-0">
        <div className="card flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto space-y-3 p-2">
            {hasMore && (
              <button
                onClick={loadMore}
                className="btn-secondary w-full text-sm"
              >
                Load older messages
              </button>
            )}

            {loading ? (
              <div className="text-center text-gray-400 py-8">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id ?? i}
                  message={{
                    content: msg.content,
                    createdAt: msg.createdAt,
                    senderId: msg.senderId,
                  }}
                  currentUserId={user.id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="py-4">
          <MessageComposer recipientId={recipientId} onSend={handleSend} />
        </div>
      </main>
    </div>
  );
}
