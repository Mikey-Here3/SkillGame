"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#131315]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse-glow" />
          <p className="text-muted-foreground text-sm animate-pulse">
            Loading SkillArena...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Hide sidebar on game room pages for full-screen experience
  const isGameRoom = pathname.startsWith("/game-room");

  return (
    <div className="min-h-screen bg-[#131315]">
      {!isGameRoom && <Sidebar />}
      <div className={`${isGameRoom ? "" : "lg:pl-64"} min-h-screen flex flex-col`}>
        {!isGameRoom && <TopBar />}
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
