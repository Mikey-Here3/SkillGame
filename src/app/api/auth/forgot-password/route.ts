import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendEmail } from "@/lib/email";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success even if user not found to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: "If an account exists, an OTP has been sent." });
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { email },
      data: { otpCode, otpExpires },
    });

    const emailHtml = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Password Reset</h2>
        <p>Your password reset code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; color: #3b82f6;">${otpCode}</h1>
        <p>This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "SkillArena - Password Reset",
      html: emailHtml,
    });

    return NextResponse.json({ message: "If an account exists, an OTP has been sent." });
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
