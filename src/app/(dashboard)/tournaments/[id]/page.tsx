"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { Trophy, Users, ArrowLeft, Swords, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function TournamentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournament();
  }, [params.id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTournament(data.tournament);
      }
    } catch {
      toast.error("Failed to load tournament");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="text-center py-20">
        <Trophy size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <h2 className="text-xl font-bold font-heading mb-2">Tournament Not Found</h2>
        <button onClick={() => router.push("/tournaments")} className="text-blue-400 text-sm">
          ← Back to Tournaments
        </button>
      </div>
    );
  }

  const participants = tournament.participants || [];
  const brackets = tournament.brackets || { rounds: 0, matchups: [] };

  const getPlayerName = (id: string | null) => {
    if (!id) return "TBD";
    if (id === user?.id) return "You";
    const p = participants.find((p: any) => p.userId === id);
    return p ? (p.user?.username || p.userId) : "Player";
  };

  const renderBracketRound = (roundNum: number) => {
    const matchups = (brackets.matchups || []).filter((m: any) => m.round === roundNum);

    return (
      <div key={`round-${roundNum}`} className="flex flex-col justify-around gap-4 min-w-[200px]">
        <h3 className="text-center font-bold font-heading text-blue-400 mb-4 uppercase tracking-wider text-sm">
          {roundNum === brackets.rounds ? "Final" : `Round ${roundNum}`}
        </h3>
        {matchups.length === 0 ? (
          <div className="glass-card rounded-xl p-4 text-center text-muted-foreground text-sm">
            No matches yet
          </div>
        ) : (
          matchups.map((match: any) => (
            <div key={match.id} className="glass-card rounded-xl overflow-hidden border border-white/10 shadow-lg relative flex flex-col">
              {match.player1Id === user?.id || match.player2Id === user?.id ? (
                <div className="absolute top-0 right-0 w-2 h-full bg-blue-500" />
              ) : null}

              <div className={`p-3 border-b border-white/5 flex justify-between items-center ${match.winnerId === match.player1Id ? "bg-green-500/10 text-green-400" : match.winnerId ? "opacity-50" : ""}`}>
                <span className="font-semibold truncate pr-2">{getPlayerName(match.player1Id)}</span>
                {match.winnerId === match.player1Id && <Trophy size={14} />}
              </div>

              <div className={`p-3 flex justify-between items-center ${match.winnerId === match.player2Id ? "bg-green-500/10 text-green-400" : match.winnerId || match.isBye ? "opacity-50" : ""}`}>
                <span className="font-semibold truncate pr-2">
                  {match.isBye ? "BYE" : getPlayerName(match.player2Id)}
                </span>
                {match.winnerId === match.player2Id && <Trophy size={14} />}
              </div>

              {/* Action Button for the user's current match */}
              {!match.winnerId && !match.isBye && (match.player1Id === user?.id || match.player2Id === user?.id) && (
                <div className="p-2 bg-blue-500/20 border-t border-blue-500/30">
                  <button
                    onClick={() => router.push(`/game-room/${tournament.gameId}?tournament=${tournament.id}&match=${match.id}`)}
                    className="w-full text-xs font-bold uppercase tracking-wider py-1.5 bg-blue-500 hover:bg-blue-400 rounded text-white transition-colors"
                  >
                    Join Match
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="glass-card p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <button onClick={() => router.push("/tournaments")} className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors mb-4 text-sm font-semibold">
              <ArrowLeft size={16} /> Back to Tournaments
            </button>
            <h1 className="text-3xl md:text-4xl font-bold font-heading mb-2">{tournament.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm font-semibold">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1.5">
                <Swords size={14} /> {tournament.gameId}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Users size={14} /> {participants.length}/{tournament.maxParticipants} Joined
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <Trophy size={14} /> ${tournament.prizePool} Prize Pool
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Status</p>
              <p className="text-xl font-bold text-green-400 uppercase tracking-widest">{tournament.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bracket View */}
      <div className="glass-card p-6 md:p-8 rounded-3xl overflow-x-auto">
        <h2 className="text-2xl font-bold font-heading mb-8 flex items-center gap-3">
          <Trophy className="text-amber-400" /> Tournament Bracket
        </h2>

        {brackets.rounds > 0 ? (
          <div className="flex gap-8 md:gap-16 pb-8 min-w-max">
            {Array.from({ length: brackets.rounds }).map((_, i) => (
              <div key={i} className="flex flex-col relative">
                {renderBracketRound(i + 1)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>Brackets will be generated when the tournament starts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
