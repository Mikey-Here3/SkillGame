import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { amount, method, transactionId, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }
    const validMethods = ["easypaisa", "jazzcash", "paypal", "crypto", "bank"];
    if (!method || !validMethods.includes(method)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    const finalMetadata = {
      ...(metadata || {}),
      transactionId: transactionId || null,
    };

    const transaction = await prisma.transaction.create({
      data: {
        userId: payload.userId,
        type: "deposit",
        amount,
        status: "pending",
        method,
        description: `Deposit via ${method}`,
        metadata: finalMetadata,
      },
    });

    await prisma.notification.create({
      data: {
        userId: payload.userId,
        title: "Deposit Submitted",
        message: `Your deposit of $${amount} via ${method} is pending admin review.`,
        type: "deposit",
        metadata: { transactionId: transaction.id },
      },
    });

    return NextResponse.json({ message: "Deposit request submitted", transaction }, { status: 201 });
  } catch (error: unknown) {
    console.error("Deposit error:", error);
    return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deposits = await prisma.transaction.findMany({
      where: { userId: payload.userId, type: "deposit" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ deposits });
  } catch {
    return NextResponse.json({ error: "Failed to fetch deposits" }, { status: 500 });
  }
}
