import Link from "next/link";
import { Gamepad2, Shield, Trophy, Zap, Users, Target } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0e0e10] overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/8 rounded-full blur-[80px] animate-float" style={{ animationDelay: "3s" }} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Gamepad2 size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold font-heading bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            SkillArena
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-semibold rounded-xl btn-neon"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 container-max pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 glass-card rounded-full text-xs text-muted-foreground animate-fade-in-up">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          11+ Skill-Based Games Available
        </div>

        <h1 className="text-5xl md:text-7xl font-bold font-heading leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Compete. Win.
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Prove Your Skills.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Join the ultimate skill-based gaming platform. No luck, no manipulation — just pure ability.
          Compete against real players and earn through your talent.
        </p>

        <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <Link href="/register" className="px-8 py-3.5 rounded-xl btn-neon text-base font-semibold">
            Start Playing Free
          </Link>
          <Link href="/games" className="px-8 py-3.5 rounded-xl glass-card text-base font-semibold hover:bg-white/10 transition-all">
            Browse Games
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          {[
            { label: "Active Games", value: "11+" },
            { label: "Fair Play", value: "100%" },
            { label: "Skill-Based", value: "Always" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold font-heading text-glow-blue">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 container-max pb-32">
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-4">
          Why SkillArena?
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          A fair, transparent, and thrilling gaming experience built for competitive players.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Real-Time Multiplayer", desc: "Play against real players in real-time. Low latency, high intensity.", color: "text-yellow-400" },
            { icon: Shield, title: "Fair Play Guaranteed", desc: "Server-authoritative games. No cheating, no manipulation of outcomes.", color: "text-green-400" },
            { icon: Trophy, title: "Tournaments", desc: "Join daily tournaments with bracket systems and big prize pools.", color: "text-amber-400" },
            { icon: Target, title: "11+ Skill Games", desc: "From reaction speed to chess blitz — find your competitive edge.", color: "text-blue-400" },
            { icon: Users, title: "Smart Matchmaking", desc: "Play against players of similar skill level for fair competition.", color: "text-purple-400" },
            { icon: Gamepad2, title: "Practice Mode", desc: "Hone your skills for free before entering competitive matches.", color: "text-cyan-400" },
          ].map((feature) => (
            <div key={feature.title} className="glass-card rounded-2xl p-6 group">
              <feature.icon size={28} className={`${feature.color} mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="text-lg font-semibold font-heading mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Games Preview */}
      <section className="relative z-10 container-max pb-32">
        <h2 className="text-3xl md:text-4xl font-bold font-heading text-center mb-12">
          Featured Games
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { icon: "⚡", name: "Reaction Speed", gradient: "from-yellow-500/20 to-orange-500/20" },
            { icon: "🍉", name: "Fruit Slice", gradient: "from-green-500/20 to-emerald-500/20" },
            { icon: "🧠", name: "Memory Match", gradient: "from-purple-500/20 to-pink-500/20" },
            { icon: "🔢", name: "Math Speed", gradient: "from-indigo-500/20 to-blue-500/20" },
            { icon: "⌨️", name: "Typing Battle", gradient: "from-cyan-500/20 to-teal-500/20" },
            { icon: "🎯", name: "Target Hit", gradient: "from-red-500/20 to-rose-500/20" },
            { icon: "♟️", name: "Chess Blitz", gradient: "from-slate-400/20 to-gray-500/20" },
            { icon: "📈", name: "Crash Timing", gradient: "from-emerald-500/20 to-lime-500/20" },
          ].map((game) => (
            <div
              key={game.name}
              className={`glass-card rounded-2xl p-5 text-center bg-gradient-to-br ${game.gradient} hover:scale-105 transition-transform cursor-pointer`}
            >
              <div className="text-4xl mb-3">{game.icon}</div>
              <div className="text-sm font-semibold font-heading">{game.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 container-max pb-20">
        <div className="glass-card rounded-3xl p-12 text-center bg-gradient-to-br from-blue-500/10 to-purple-500/10">
          <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
            Ready to Prove Your Skills?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Join thousands of competitive players. Sign up free and start your journey.
          </p>
          <Link href="/register" className="inline-block px-10 py-4 rounded-xl btn-neon text-lg font-semibold">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8">
        <div className="container-max flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-blue-400" />
            <span className="text-sm text-muted-foreground">© 2026 SkillArena. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/fair-play" className="hover:text-foreground transition-colors">Fair Play</Link>
            <span className="px-2 py-0.5 border border-red-500/30 rounded text-red-400 text-[10px] font-bold">18+</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
