import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CookieAudit AI — Automated Web Privacy, Cookie Security & DPDP Compliance",
  description:
    "Audit any website URL in <15 seconds for India DPDP Act 2023/2025, EU GDPR, and OWASP Session Security. Grades compliance from 0 to 100 with AI auto-remediation powered by MiniMax M3.1 Flash.",
  keywords: [
    "Cookie Audit",
    "DPDP Act 2023",
    "DPDP Rules 2025",
    "GDPR Compliance",
    "OWASP Session Management",
    "Cookie Scanner",
    "Privacy Policy Audit",
    "MiniMax AI",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/20 selection:text-sky-300">
        {children}
      </body>
    </html>
  );
}
