import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface Matchup {
  id: string;
  round: number;
  player1Id: string | null; // null if TBD
  player2Id: string | null;
  winnerId: string | null;
  sessionId: string | null; // The associated GameSession for this match
  isBye: boolean;
}

export interface TournamentBrackets {
  rounds: number;
  matchups: Matchup[];
}

export async function generateBrackets(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { participants: true },
  });

  if (!tournament) throw new Error("Tournament not found");
  if (tournament.status !== "registration") throw new Error("Tournament is not in registration phase");

  // Get participants and shuffle for random seeding
  const participants = tournament.participants.map(p => p.userId);
  for (let i = participants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [participants[i], participants[j]] = [participants[j], participants[i]];
  }

  // Calculate bracket size (next power of 2)
  const size = Math.pow(2, Math.ceil(Math.log2(Math.max(2, participants.length))));
  const byes = size - participants.length;

  const matchups: Matchup[] = [];
  let currentRoundMatchCount = size / 2;
  const totalRounds = Math.log2(size);

  let pIndex = 0;

  // Generate Round 1
  for (let i = 0; i < currentRoundMatchCount; i++) {
    const p1 = participants[pIndex++] || null;
    let p2 = null;
    
    // Distribute byes
    if (i < currentRoundMatchCount - byes && pIndex < participants.length) {
      p2 = participants[pIndex++] || null;
    }

    const isBye = p2 === null;

    matchups.push({
      id: `r1-m${i + 1}`,
      round: 1,
      player1Id: p1,
      player2Id: p2,
      winnerId: isBye ? p1 : null,
      sessionId: null,
      isBye,
    });
  }

  // Generate subsequent rounds as placeholders
  for (let round = 2; round <= totalRounds; round++) {
    currentRoundMatchCount /= 2;
    for (let i = 0; i < currentRoundMatchCount; i++) {
      matchups.push({
        id: `r${round}-m${i + 1}`,
        round,
        player1Id: null,
        player2Id: null,
        winnerId: null,
        sessionId: null,
        isBye: false,
      });
    }
  }

  const bracketsData: TournamentBrackets = {
    rounds: totalRounds,
    matchups,
  };

  // Update tournament status and save brackets
  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      status: "active",
      brackets: bracketsData as any,
    },
  });

  return bracketsData;
}
