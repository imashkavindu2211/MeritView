import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar";

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
        <Navbar />
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
