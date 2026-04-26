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
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Save OTP to user
    await prisma.user.update({
      where: { email },
      data: { otpCode, otpExpires },
    });

    // Send email
    const emailHtml = `
      <div style="font-family: sans-serif; text-align: center; padding: 20px;">
        <h2>Verify Your Email</h2>
        <p>Your verification code is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; color: #3b82f6;">${otpCode}</h1>
        <p>This code will expire in 10 minutes.</p>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject: "SkillArena - Your Verification Code",
      html: emailHtml,
    });

    if (!result.success) {
      console.error("Failed to send OTP:", result.error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("Send OTP Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
