"use client";

import { getInitials } from "@/lib/utils";

interface UserAvatarProps {
  user: { displayName?: string | null; profileImg?: string | null } | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: 32,
  md: 40,
  lg: 64,
};

const textSizeMap = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
};

export default function UserAvatar({ user, size = "md" }: UserAvatarProps) {
  const px = sizeMap[size];
  const textSize = textSizeMap[size];

  if (user?.profileImg) {
    return (
      <img
        src={user.profileImg}
        alt={user.displayName || "User"}
        width={px}
        height={px}
        className="rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }

  if (user?.displayName) {
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-brand-600 text-white font-semibold ${textSize}`}
        style={{ width: px, height: px }}
      >
        {getInitials(user.displayName)}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gray-600 text-gray-300 font-semibold ${textSize}`}
      style={{ width: px, height: px }}
    >
      ?
    </div>
  );
}
