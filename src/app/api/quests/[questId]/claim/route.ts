import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ questId: string }> }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questId } = await params;

    const userQuest = await prisma.userQuest.findUnique({
      where: { userId_questId: { userId: user.userId, questId } },
      include: { quest: true },
    });

    if (!userQuest) {
      return NextResponse.json({ error: "Quest not found" }, { status: 404 });
    }

    if (!userQuest.completed) {
      return NextResponse.json({ error: "Quest not completed yet" }, { status: 400 });
    }

    if (userQuest.claimed) {
      return NextResponse.json({ error: "Already claimed" }, { status: 400 });
    }

    // Claim reward
    await prisma.$transaction([
      prisma.userQuest.update({
        where: { id: userQuest.id },
        data: { claimed: true },
      }),
      prisma.user.update({
        where: { id: user.userId },
        data: {
          coins: { increment: userQuest.quest.rewardCoins },
          balance: { increment: userQuest.quest.rewardCash },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.userId,
          type: "reward",
          amount: userQuest.quest.rewardCash,
          status: "completed",
          description: `Quest reward: ${userQuest.quest.title} (+${userQuest.quest.rewardCoins} coins)`,
        },
      }),
    ]);

    return NextResponse.json({ message: "Quest reward claimed!" });
  } catch (error) {
    console.error("POST quest claim error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
