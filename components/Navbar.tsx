"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Trophy, Search, LayoutDashboard } from "lucide-react";
import { getSystemConfig } from "@/app/actions";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [systemConfig, setSystemConfig] = useState<{ view_rankings: boolean }>({ view_rankings: true });

  useEffect(() => {
    async function fetchConfig() {
      try {
        const config = await getSystemConfig();
        // The action returns { iq_marks_enabled: boolean, view_rankings_enabled: boolean, ... }
        // Let's check the exact keys returned by getSystemConfig
        setSystemConfig({ view_rankings: config.view_rankings });
      } catch (e) {
        console.error("Failed to fetch config in Navbar", e);
      }
    }
    fetchConfig();
  }, []);

  return (
    <header className="bg-[#0a0a0f] border-b border-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-0 group">
            <div className="bg-[#e11d48] text-white w-9 h-9 flex items-center justify-center rounded-md font-black text-xl mr-2 shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
              A
            </div>
            <span className="font-bold text-2xl text-white tracking-tighter">
              MeritView
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {systemConfig.view_rankings && (
              <>
                <Link href="/check-results" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                  Results
                </Link>
                <Link href="/leaderboard" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
                  Leaderboard
                </Link>
              </>
            )}
            <Link href="/admin/login" className="text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest">
              Admin
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        {isOpen && (
          <div className="md:hidden pb-10 space-y-2 animate-in fade-in slide-in-from-top-5 duration-300">
            {systemConfig.view_rankings && (
              <>
                <Link 
                    href="/check-results" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  <div className="bg-primary/20 p-2 rounded-lg">
                    <Search className="w-4 h-4 text-primary" />
                  </div>
                  Results
                </Link>
                <Link 
                    href="/leaderboard" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                  <div className="bg-amber-400/20 p-2 rounded-lg">
                    <Trophy className="w-4 h-4 text-amber-400" />
                  </div>
                  Leaderboard
                </Link>
              </>
            )}
            <Link 
                href="/admin/login" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 text-sm font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all uppercase tracking-widest"
            >
              <div className="bg-blue-400/20 p-2 rounded-lg">
                <LayoutDashboard className="w-4 h-4 text-blue-400" />
              </div>
              Admin Control
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
