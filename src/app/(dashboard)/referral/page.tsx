"use client";

import { useAuthStore } from "@/stores/authStore";
import { Gift, Copy, Users, Share2 } from "lucide-react";
import { toast } from "sonner";

export default function ReferralPage() {
  const { user } = useAuthStore();
  if (!user) return null;

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${user.referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(user.referralCode);
    toast.success("Referral code copied!");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
          <Gift size={28} className="text-purple-400" /> Referral Program
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Invite friends and earn coins together</p>
      </div>

      {/* How It Works */}
      <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <h3 className="font-semibold font-heading mb-4">How it works</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { step: "1", title: "Share Your Code", desc: "Send your unique referral code to friends", icon: Share2 },
            { step: "2", title: "Friend Joins", desc: "They sign up using your code", icon: Users },
            { step: "3", title: "Both Earn", desc: "You get 50 coins, they get 100 coins!", icon: Gift },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold mb-2">
                {s.step}
              </div>
              <h4 className="font-semibold text-sm">{s.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Your Code */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Your Referral Code</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 px-4 rounded-xl bg-[#0e0e10] border border-white/[0.08] flex items-center text-lg font-bold font-heading tracking-widest text-blue-400">
            {user.referralCode}
          </div>
          <button onClick={copyCode} className="h-12 px-5 rounded-xl btn-neon text-sm font-semibold flex items-center gap-2">
            <Copy size={16} /> Copy
          </button>
        </div>
      </div>

      {/* Referral Link */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Referral Link</h3>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 px-4 rounded-xl bg-[#0e0e10] border border-white/[0.08] flex items-center text-sm text-muted-foreground overflow-hidden">
            <span className="truncate">{referralLink}</span>
          </div>
          <button onClick={copyLink} className="h-12 px-5 rounded-xl glass-card text-sm font-semibold flex items-center gap-2 hover:bg-white/[0.06]">
            <Share2 size={16} /> Share
          </button>
        </div>
      </div>

      {/* Rewards Summary */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-semibold font-heading mb-4">Rewards</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-purple-500/10">
            <div className="text-2xl mb-1">🪙</div>
            <div className="text-xl font-bold font-heading text-amber-400">50</div>
            <div className="text-xs text-muted-foreground mt-1">You earn per referral</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-blue-500/10">
            <div className="text-2xl mb-1">🎁</div>
            <div className="text-xl font-bold font-heading text-blue-400">100</div>
            <div className="text-xs text-muted-foreground mt-1">Friend gets on signup</div>
          </div>
        </div>
      </div>
    </div>
  );
}
