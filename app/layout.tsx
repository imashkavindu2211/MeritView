import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MeritView | Examination Ranking",
  description: "Professional mobile-responsive web application for exam results and ranking",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.className} min-h-screen bg-[#f8f9fc] text-foreground flex flex-col selection:bg-primary/20`}>
        <header className="bg-[#0a0a0f] border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-0 group">
              <div className="bg-[#e11d48] text-white w-9 h-9 flex items-center justify-center rounded-md font-black text-xl mr-2 shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
                A
              </div>
              <span className="font-bold text-2xl text-white tracking-tighter">
                MeritView
              </span>
            </Link>
            <nav className="flex items-center gap-8">
              <Link href="/admin/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center">
          {children}
        </main>
        <footer className="bg-[#0a0a0f] border-t border-white/5 py-8 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-semibold text-gray-500 tracking-wide">
              © Copyright by Amarasri Herath Technical Team
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
