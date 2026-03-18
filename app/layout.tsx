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
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20`}>
        <header className="bg-secondary text-secondary-foreground sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="font-extrabold text-2xl tracking-tight">
              <span className="bg-primary text-primary-foreground px-2 py-1 rounded-lg mr-1">M</span>eritView
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/admin/login" className="text-sm font-semibold text-secondary-foreground/80 hover:text-primary transition-all hover:scale-105">
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col items-center">
          {children}
        </main>
        <footer className="bg-secondary text-secondary-foreground border-t border-white/10 py-10 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-sm font-medium opacity-80">
              © Copyright by Amarasri Herath Technical Team
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
