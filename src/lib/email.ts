import { Resend } from "resend";

// Ensure RESEND_API_KEY is in your .env
const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

if (!resendApiKey) {
  console.warn("⚠️ RESEND_API_KEY is not set in environment variables. Emails will be mocked.");
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log("----------------------------------------");
    console.log("Mock Email Sent:");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Content:", html.replace(/<[^>]+>/g, '')); // Strip basic HTML for readability
    console.log("----------------------------------------");
    return { success: true, mocked: true };
  }

  try {
    const data = await resend.emails.send({
      from: "SkillArena <onboarding@resend.dev>", // Replace with your verified domain when going to production
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
    return { success: false, error };
  }
}
