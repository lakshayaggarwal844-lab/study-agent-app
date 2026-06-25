import type { Metadata } from "next";
import Link from "next/link";
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
  title: "Study Agent",
  description: "Study Agent app for concept guidance and progress tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        <header className="w-full border-b border-slate-800 bg-slate-950/95 px-4 py-4 shadow-lg shadow-slate-950/20 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div className="text-lg font-semibold text-white">Study Agent</div>
            <nav className="flex items-center gap-3 text-sm text-slate-300">
              <Link href="/" className="rounded-full px-3 py-2 transition hover:bg-slate-800 hover:text-white">
                Chat
              </Link>
              <Link href="/dashboard" className="rounded-full px-3 py-2 transition hover:bg-slate-800 hover:text-white">
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
