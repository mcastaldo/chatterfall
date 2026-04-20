"use client";

import { formatDistanceToNow } from "date-fns";

interface MessageBubbleProps {
  message: {
    content: string;
    createdAt: string | Date;
    senderTarget: string;
  };
  myTarget: string;
}

export default function MessageBubble({
  message,
  myTarget,
}: MessageBubbleProps) {
  const isSent = message.senderTarget === myTarget;

  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isSent
            ? "bg-brand-600 text-white rounded-br-md"
            : "bg-brand-900 text-gray-100 rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <p
          className={`text-xs mt-1 ${
            isSent ? "text-brand-200" : "text-gray-400"
          }`}
        >
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </div>
  );
}
