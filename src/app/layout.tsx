import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillArena — Multiplayer Skill-Based Gaming Platform",
  description:
    "Compete in 11+ skill-based multiplayer games. Win prizes through your abilities. Fair play guaranteed.",
  keywords: ["gaming", "multiplayer", "skill-based", "esports", "compete"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} antialiased bg-[#131315] text-[#e4e2e4]`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
