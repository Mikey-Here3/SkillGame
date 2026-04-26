import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tournaments = await prisma.tournament.findMany({
      orderBy: { startTime: "desc" },
      include: {
        _count: {
          select: { participants: true }
        }
      }
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = getUserFromRequest(req as any);
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, gameId, entryFee, prizePool, maxParticipants, startTime, prizeDistribution } = body;

    const tournament = await prisma.tournament.create({
      data: {
        title,
        description,
        gameId,
        entryFee: parseFloat(entryFee),
        prizePool: parseFloat(prizePool),
        maxParticipants: parseInt(maxParticipants),
        startTime: new Date(startTime),
        prizeDistribution: prizeDistribution || [
          { rank: 1, percent: 50 },
          { rank: 2, percent: 30 },
          { rank: 3, percent: 20 },
        ],
        status: "upcoming",
      },
    });

    return NextResponse.json({ tournament });
  } catch (error) {
    console.error("Tournament creation error:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
