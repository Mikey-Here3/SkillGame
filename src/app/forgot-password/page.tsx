"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Gamepad2, ArrowRight, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to process request");
        return;
      }

      toast.success("If an account exists, a reset code has been sent");
      // Redirect to reset password with email as query param
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e10] px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]" />

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Gamepad2 size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold font-heading bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              SkillArena
            </span>
          </Link>
          
          <div className="mt-8 flex justify-center">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <KeyRound size={28} className="text-blue-400" />
            </div>
          </div>
          
          <h2 className="text-2xl font-bold mt-4 mb-2 font-heading">Reset Password</h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Enter the email associated with your account and we'll send you a secure reset code.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl glass-input text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 rounded-xl btn-neon text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Sending..." : "Send Reset Code"}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/login" className="text-muted-foreground hover:text-white text-sm transition-colors flex items-center justify-center gap-2 font-semibold">
            <ArrowRight size={14} className="rotate-180" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
