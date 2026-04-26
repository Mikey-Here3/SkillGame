"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";
import {
  Home,
  Gamepad2,
  Wallet,
  Trophy,
  Target,
  Users,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Gift,
  BarChart3,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/tournaments", label: "Tournaments", icon: Trophy },
  { href: "/leaderboard", label: "Leaderboard", icon: BarChart3 },
  { href: "/quests", label: "Quests", icon: Target },
  { href: "/referral", label: "Referral", icon: Gift },
];

const adminItems = [
  { href: "/admin", label: "Admin Panel", icon: Shield },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: Wallet },
  { href: "/admin/game-config", label: "Game Config", icon: Settings },
  { href: "/admin/bots", label: "Bot Control", icon: Gamepad2 },
  { href: "/admin/fraud", label: "Fraud Detection", icon: Shield },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden glass-card p-2 rounded-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0e0e10] border-r border-white/[0.06] z-40 flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Gamepad2 size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-heading bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                SkillArena
              </h1>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
                Compete & Win
              </p>
            </div>
          </Link>
        </div>

        {/* User Balance Quick View */}
        {user && (
          <div className="px-4 py-3 mx-3 mt-3 glass-card rounded-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Balance
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Coins
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-green-400 font-heading">
                Rs. {user.balance.toFixed(2)}
              </span>
              <span className="text-sm font-bold text-amber-400 font-heading">
                🪙 {user.coins}
              </span>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Menu
          </p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-gradient-to-r from-blue-500/20 to-purple-500/10 text-blue-400 border border-blue-500/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}

          {/* Admin Section */}
          {user?.role === "admin" && (
            <>
              <div className="pt-4 pb-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 mb-2">
                  Admin
                </p>
              </div>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-gradient-to-r from-red-500/20 to-orange-500/10 text-red-400 border border-red-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-white/[0.06] space-y-1">
          <Link
            href="/notifications"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
          >
            <Bell size={18} />
            Notifications
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
          >
            <User size={18} />
            Profile
          </Link>
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.04] transition-all"
          >
            <Settings size={18} />
            Settings
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
