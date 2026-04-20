"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import NavBar from "@/components/NavBar";
import MessageBubble from "@/components/MessageBubble";
import MessageComposer from "@/components/MessageComposer";
import { getAnonIdentity, getOrCreateAnonIdClient, getAnonAvatarClient } from "@/lib/anonIdentity";
import type { MessageData } from "@/types";

export default function ConversationPage() {
  const { userId: target } = useParams<{ userId: string }>();
  const [user, setUser] = useState<{
    id: string;
    username: string;
    displayName: string;
    profileImg: string | null;
  } | null>(null);
  const [myTarget, setMyTarget] = useState<string>("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Resolve partner display name from target
  useEffect(() => {
    if (target.startsWith("a-")) {
      const anonId = target.slice(2);
      setPartnerName(getAnonIdentity(anonId).name);
    } else if (target.startsWith("u-")) {
      // Fetch user info
      const userId = target.slice(2);
      fetch(`/api/users/${userId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setPartnerName(data.displayName || data.username || "User");
          }
        })
        .catch(() => {});
    }
  }, [target]);

  // Auth check — don't redirect if not logged in, just use anon
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setUser(data);
          setMyTarget(`u-${data.id}`);
        } else {
          const anonId = getOrCreateAnonIdClient();
          setMyTarget(`a-${anonId}`);
        }
      })
      .catch(() => {
        const anonId = getOrCreateAnonIdClient();
        setMyTarget(`a-${anonId}`);
      });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(
    async (cursorParam?: string) => {
      const params = new URLSearchParams();
      if (cursorParam) params.set("cursor", cursorParam);

      const res = await fetch(`/api/messages/${target}?${params.toString()}`);
      if (!res.ok) return { messages: [], nextCursor: undefined, myTarget: "" };
      return res.json();
    },
    [target]
  );

  // Initial load
  useEffect(() => {
    if (!myTarget) return;
    setLoading(true);
    fetchMessages().then((data) => {
      setMessages(data.messages ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      if (data.myTarget) setMyTarget(data.myTarget);
      setLoading(false);
    });
  }, [myTarget, fetchMessages]);

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

  // Socket connection for real-time DMs
  useEffect(() => {
    if (!myTarget) return;

    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      if (user) {
        socket.emit("join", { userId: user.id, user, lat: 0, lon: 0 });
      } else {
        const anonId = getOrCreateAnonIdClient();
        const anonAvatar = getAnonAvatarClient();
        socket.emit("join", { anonId, anonAvatar, lat: 0, lon: 0 });
      }
    });

    const handleNewMessage = (message: MessageData) => {
      // Only add if from our conversation partner
      if (message.senderTarget === target) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [myTarget, target, user]);

  const handleSend = () => {
    fetchMessages().then((data) => {
      setMessages(data.messages ?? []);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    });
  };

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
        {partnerName && (
          <h2 className="text-white font-semibold mt-2">{partnerName}</h2>
        )}
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
                    senderTarget: msg.senderTarget,
                  }}
                  myTarget={myTarget}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="py-4">
          <MessageComposer recipientTarget={target} onSend={handleSend} />
        </div>
      </main>
    </div>
  );
}
