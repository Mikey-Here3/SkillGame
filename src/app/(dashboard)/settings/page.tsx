"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Settings, Key, Bell, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const { token } = useAuthStore.getState();
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password changed successfully");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else {
        toast.error(data.error || "Failed to change password");
      }
    } catch {
      toast.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
          <Settings size={28} className="text-blue-400" /> Settings
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
          <Key size={18} className="text-blue-400" /> Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl glass-input text-sm" required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl glass-input text-sm" required minLength={6} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-4 rounded-xl glass-input text-sm" required />
          </div>
          <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl btn-neon text-sm font-semibold disabled:opacity-50">
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Notification Preferences */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
          <Bell size={18} className="text-purple-400" /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { key: "deposits", label: "Deposit updates" },
            { key: "withdrawals", label: "Withdrawal updates" },
            { key: "rewards", label: "Reward notifications" },
            { key: "games", label: "Game notifications" },
          ].map((pref) => (
            <label key={pref.key} className="flex items-center justify-between py-2 cursor-pointer">
              <span className="text-sm">{pref.label}</span>
              <input type="checkbox" defaultChecked className="rounded accent-blue-500" />
            </label>
          ))}
        </div>
      </div>

      {/* Account Info */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold font-heading mb-4 flex items-center gap-2">
          <Shield size={18} className="text-green-400" /> Account
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Username</span>
            <span>{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Role</span>
            <span className="capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass-card rounded-2xl p-6 border-red-500/20">
        <h3 className="text-lg font-semibold font-heading mb-4 text-red-400">Danger Zone</h3>
        <button onClick={() => logout()}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/30 transition-colors">
          <LogOut size={16} /> Logout from all sessions
        </button>
      </div>
    </div>
  );
}
