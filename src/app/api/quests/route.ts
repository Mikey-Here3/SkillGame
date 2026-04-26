import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);

    const quests = await prisma.quest.findMany({
      where: { isActive: true },
      orderBy: { type: "asc" },
    });

    // If user logged in, attach their progress
    if (user) {
      const userQuests = await prisma.userQuest.findMany({
        where: { userId: user.userId },
      });

      const questsWithProgress = quests.map((q) => {
        const uq = userQuests.find((uq) => uq.questId === q.id);
        return {
          ...q,
          userQuest: uq
            ? { progress: uq.progress, completed: uq.completed, claimed: uq.claimed }
            : undefined,
        };
      });

      return NextResponse.json({ quests: questsWithProgress });
    }

    return NextResponse.json({ quests });
  } catch (error) {
    console.error("GET quests error:", error);
    return NextResponse.json({ error: "Failed to fetch quests" }, { status: 500 });
  }
}
