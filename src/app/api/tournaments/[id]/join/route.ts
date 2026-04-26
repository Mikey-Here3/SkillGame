import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { _count: { select: { participants: true } } },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.status !== "registration" && tournament.status !== "upcoming") {
      return NextResponse.json({ error: "Tournament is not accepting registrations" }, { status: 400 });
    }

    if (tournament._count.participants >= tournament.maxParticipants) {
      return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
    }

    // Check if already joined
    const existing = await prisma.tournamentParticipant.findUnique({
      where: { tournamentId_userId: { tournamentId: id, userId: user.userId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already joined" }, { status: 400 });
    }

    // Check balance
    const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
    if (!dbUser || dbUser.balance < tournament.entryFee) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Deduct fee and join
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.userId },
        data: { balance: { decrement: tournament.entryFee } },
      }),
      prisma.transaction.create({
        data: {
          userId: user.userId,
          type: "game_fee",
          amount: -tournament.entryFee,
          status: "completed",
          description: `Tournament entry: ${tournament.title}`,
        },
      }),
      prisma.tournamentParticipant.create({
        data: { tournamentId: id, userId: user.userId = id },
      }),
    ]);

    return NextResponse.json({ message: "Joined tournament successfully" });
  } catch (error) {
    console.error("POST tournament join error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
