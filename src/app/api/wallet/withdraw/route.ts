import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount, method, accountDetails } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const validMethods = ["easypaisa", "jazzcash", "paypal", "crypto", "bank"];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json({ error: "Invalid withdrawal method" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }
    if (user.gamesPlayed < 10) {
      return NextResponse.json(
        { error: `Play at least 10 games before withdrawing. Currently: ${user.gamesPlayed}` },
        { status: 400 }
      );
    }

    const pending = await prisma.transaction.findFirst({
      where: { userId: payload.userId, type: "withdraw", status: "pending" },
    });
    if (pending) {
      return NextResponse.json({ error: "You already have a pending withdrawal" }, { status: 400 });
    }

    // Hold balance
    await prisma.user.update({
      where: { id: user.id },
      data: { balance: { decrement: amount } },
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId: payload.userId,
        type: "withdraw",
        amount,
        status: "pending",
        method,
        description: `Withdrawal via ${method}`,
        metadata: { accountDetails: accountDetails || null },
      },
    });

    await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: "Withdrawal Submitted",
        message: `Your withdrawal of $${amount} via ${method} is pending review.`,
        type: "withdrawal",
      },
    });

    return NextResponse.json({ message: "Withdrawal request submitted", transaction }, { status: 201 });
  } catch (error: unknown) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ error: "Failed to create withdrawal" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const withdrawals = await prisma.transaction.findMany({
      where: { userId: payload.userId, type: "withdraw" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ withdrawals });
  } catch {
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 });
  }
}
