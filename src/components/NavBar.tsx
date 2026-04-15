"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import UserAvatar from "./UserAvatar";

interface NavBarProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    profileImg: string | null;
  } | null;
}

export default function NavBar({ user }: NavBarProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const count = Array.isArray(data)
          ? data.filter((n: { read: boolean }) => !n.read).length
          : data.unreadCount ?? 0;
        setUnreadCount(count);
      }
    } catch {
      // silently ignore
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    if (!user) return;
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, user]);

  const navLinks = [
    { href: "/", label: "Feed" },
    ...(user
      ? [
          { href: "/messages", label: "Messages" },
          { href: `/profile/${user.id}`, label: "Profile" },
        ]
      : []),
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-brand-800 bg-brand-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white tracking-tight">
            Chatterfall
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user && (
            <Link href="/notifications" className="relative p-2 text-gray-300 hover:text-white transition-colors">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
              <UserAvatar
                user={{
                  displayName: user.displayName,
                  profileImg: user.profileImg,
                }}
                size="sm"
              />
              <span className="hidden md:block text-sm text-gray-300">
                {user.displayName}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-400 transition-colors"
            >
              Login
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-800 bg-brand-950/95 backdrop-blur-md">
          <div className="flex flex-col px-4 py-3 gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-gray-300 hover:text-white py-2 transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
