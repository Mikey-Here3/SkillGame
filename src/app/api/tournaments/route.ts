import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: { startTime: "desc" },
      include: {
        _count: { select: { participants: true } },
      },
      take: 50,
    });

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error("GET tournaments error:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}
