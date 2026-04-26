"use client";

import { useAuthStore } from "@/stores/authStore";
import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopBar() {
  const { user } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await fetch("/api/notifications?unread=true", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // silent
      }
    }
    fetchNotifications();
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#131315]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center justify-between h-16 px-6 lg:pl-8">
        {/* Spacer for mobile menu button */}
        <div className="w-10 lg:hidden" />

        {/* Search */}
        <div className="hidden md:flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search games, tournaments..."
              className="w-full h-9 pl-9 pr-4 rounded-lg glass-input text-sm"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Balance */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-lg">
              <span className="text-xs text-muted-foreground">Balance:</span>
              <span className="text-sm font-bold text-green-400 font-heading">
                Rs. {user?.balance.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 glass-card rounded-lg">
              <span className="text-xs">🪙</span>
              <span className="text-sm font-bold text-amber-400 font-heading">
                {user?.coins || 0}
              </span>
            </div>
          </div>

          {/* Notifications */}
          <Link href="/notifications" className="relative p-2 glass-card rounded-lg hover:bg-white/[0.08] transition-all">
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <Link href="/profile" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.username?.charAt(0).toUpperCase() || "?"}
            </div>
            <span className="hidden md:block text-sm font-medium truncate max-w-[100px]">
              {user?.username || "User"}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
