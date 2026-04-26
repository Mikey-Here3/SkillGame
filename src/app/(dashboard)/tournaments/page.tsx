"use client";

import { useState, useEffect } from "react";
import { Trophy, Calendar, Users, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

type Tournament = {
  id: string;
  title: string;
  gameId: string;
  entryFee: number;
  prizePool: number;
  maxParticipants: number;
  status: string;
  startTime: string;
  _count?: { participants: number };
};

export default function TournamentsPage() {
  const { token } = useAuthStore();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments || []);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (tournamentId: string) => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Joined tournament!");
        fetchTournaments();
      } else {
        toast.error(data.error || "Failed to join");
      }
    } catch {
      toast.error("Failed to join tournament");
    }
  };

  const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500/20 text-blue-400",
    registration: "bg-green-500/20 text-green-400",
    active: "bg-red-500/20 text-red-400",
    completed: "bg-gray-500/20 text-gray-400",
    cancelled: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-heading flex items-center gap-3">
          <Trophy size={28} className="text-amber-400" /> Tournaments
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Compete in bracket tournaments for big prizes</p>
      </div>

      {/* Featured Banner */}
      <div className="glass-card rounded-2xl p-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-center">
        <Trophy size={40} className="mx-auto text-amber-400 mb-3" />
        <h2 className="text-xl font-bold font-heading mb-2">Competitive Tournaments</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          Join competitive bracket tournaments. Play elimination rounds and climb to the top for massive prize pools.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-400" />
        </div>
      )}

      {/* Empty State */}
      {!loading && tournaments.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-lg font-bold font-heading mb-2">No Tournaments Yet</h3>
          <p className="text-muted-foreground text-sm">Check back soon for upcoming tournaments!</p>
        </div>
      )}

      {/* Tournaments List */}
      <div className="space-y-4">
        {tournaments.map((t) => {
          const participantCount = t._count?.participants || 0;
          return (
            <div key={t.id} className="glass-card rounded-2xl p-6 hover:bg-white/[0.04] transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusColors[t.status] || statusColors.upcoming}`}>
                      {t.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-muted-foreground">
                      bracket
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold font-heading">{t.title}</h3>
                  <p className="text-sm text-muted-foreground">{t.gameId}</p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users size={12} /> {participantCount}/{t.maxParticipants}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(t.startTime).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(t.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Prize Pool</div>
                    <div className="text-xl font-bold font-heading text-amber-400">${t.prizePool}</div>
                    <div className="text-xs text-muted-foreground">Entry: ${t.entryFee}</div>
                  </div>

                  {t.status === "registration" || t.status === "upcoming" ? (
                    <button
                      onClick={() => handleJoin(t.id)}
                      className="px-6 py-3 rounded-xl text-sm font-semibold btn-neon"
                    >
                      Join
                    </button>
                  ) : t.status === "active" ? (
                    <Link href={`/tournaments/${t.id}`} className="px-6 py-3 rounded-xl text-sm font-semibold glass-card text-blue-400 hover:bg-white/[0.06]">
                      Watch
                    </Link>
                  ) : (
                    <span className="px-6 py-3 rounded-xl text-sm font-semibold glass-card text-muted-foreground cursor-not-allowed">
                      {t.status === "completed" ? "Ended" : "Closed"}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all"
                    style={{ width: `${(participantCount / t.maxParticipants) * 100}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
