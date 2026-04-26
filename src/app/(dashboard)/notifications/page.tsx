"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Bell, CheckCheck, Wallet, Trophy, Gift, Gamepad2, Info } from "lucide-react";
import { toast } from "sonner";

type Notif = {
  id: string; title: string; message: string; type: string;
  read: boolean; createdAt: string;
};

export default function NotificationsPage() {
  const { token } = useAuthStore();
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    const res = await fetch("/api/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ markAll: true }),
    });
    toast.success("All notifications marked as read");
    fetchNotifs();
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "deposit": case "withdrawal": return <Wallet size={16} className="text-green-400" />;
      case "game": return <Gamepad2 size={16} className="text-blue-400" />;
      case "reward": return <Trophy size={16} className="text-amber-400" />;
      case "referral": return <Gift size={16} className="text-purple-400" />;
      default: return <Info size={16} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
            <Bell size={28} className="text-blue-400" /> Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated on your activity</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card text-xs font-semibold text-blue-400 hover:bg-blue-500/10">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`flex items-start gap-4 p-4 ${!n.read ? "bg-blue-500/5" : ""}`}>
              <div className="w-9 h-9 rounded-lg glass-card flex items-center justify-center flex-shrink-0 mt-0.5">
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold">{n.title}</h4>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
