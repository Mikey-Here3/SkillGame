import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { transactionId, action } = body;

    if (!transactionId || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "transactionId and action required" }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!transaction) return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    if (transaction.status !== "pending") {
      return NextResponse.json({ error: "Transaction is not pending" }, { status: 400 });
    }

    if (action === "approve") {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "approved", reviewedById: payload.userId, reviewedAt: new Date() },
      });

      if (transaction.type === "deposit") {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      }

      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: `${transaction.type === "deposit" ? "Deposit" : "Withdrawal"} Approved`,
          message: `Your ${transaction.type} of $${transaction.amount} has been approved.`,
          type: transaction.type === "deposit" ? "deposit" : "withdrawal",
        },
      });
    } else {
      await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: "rejected", reviewedById: payload.userId, reviewedAt: new Date() },
      });

      if (transaction.type === "withdraw") {
        await prisma.user.update({
          where: { id: transaction.userId },
          data: { balance: { increment: transaction.amount } },
        });
      }

      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          title: `${transaction.type === "deposit" ? "Deposit" : "Withdrawal"} Rejected`,
          message: `Your ${transaction.type} of $${transaction.amount} has been rejected.`,
          type: transaction.type === "deposit" ? "deposit" : "withdrawal",
        },
      });
    }

    return NextResponse.json({ message: `Transaction ${action}d successfully` });
  } catch (error: unknown) {
    console.error("Admin transaction error:", error);
    return NextResponse.json({ error: "Failed to process transaction" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "all";
    const status = url.searchParams.get("status") || "pending";

    const where: Record<string, unknown> = { status };
    if (type !== "all") where.type = type;

    const transactions = await prisma.transaction.findMany({
      where,
      include: { user: { select: { username: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
