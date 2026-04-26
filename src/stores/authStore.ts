"use client";

import { create } from "zustand";

export interface UserData {
  id: string;
  username: string;
  email: string;
  balance: number;
  coins: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  role: "user" | "admin";
  referralCode: string;
  status: string;
  notificationPreferences?: {
    deposits: boolean;
    withdrawals: boolean;
    rewards: boolean;
    games: boolean;
  };
  createdAt?: string;
}

interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: UserData | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: UserData, token: string) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
  updateCoins: (coins: number) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
    set({ token });
  },
  setLoading: (isLoading) => set({ isLoading }),

  login: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Silent fail
    }
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  updateBalance: (balance) => {
    const user = get().user;
    if (user) set({ user: { ...user, balance } });
  },

  updateCoins: (coins) => {
    const user = get().user;
    if (user) set({ user: { ...user, coins } });
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem("token");
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
