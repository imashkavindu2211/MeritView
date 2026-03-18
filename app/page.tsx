import Link from "next/link";
import { ClipboardEdit, Search, Lock } from "lucide-react";
import { getSystemConfig } from "@/app/actions";

export default async function Home() {
  const config = await getSystemConfig();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-16 py-10">
      <div className="text-center space-y-6 max-w-3xl px-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
          Modern <span className="text-primary italic">Ranking</span> <br />
          Simplified for You
        </h1>
        <p className="text-xl text-muted-foreground font-black max-w-2xl mx-auto leading-relaxed">
          වැඩිම සිසුන් පිරිසකට උපාධි ගුරු වරම් හිමි කර දෙන ලංකාවේ එකම උපාධි ගුරු පන්තිය
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl px-4">
        {config.marks_entry ? (
          <Link href="/enter-marks" className="group">
            <div className="relative flex flex-col items-center justify-center p-10 h-80 bg-white border-2 border-transparent rounded-[2.5rem] shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30 group-hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <ClipboardEdit className="w-32 h-32" />
              </div>
              <div className="bg-primary/20 p-6 rounded-3xl mb-8 group-hover:scale-110 transition-transform duration-500">
                <ClipboardEdit className="w-12 h-12 text-primary-foreground" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                Enter Marks
              </h2>
              <p className="text-muted-foreground mt-4 text-center font-medium">
                Submit new candidate data with instant validation.
              </p>
            </div>
          </Link>
        ) : (
          <div className="relative flex flex-col items-center justify-center p-10 h-80 bg-neutral-100 border-2 border-neutral-200 rounded-[2.5rem] shadow-inner opacity-75 grayscale cursor-not-allowed">
            <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-sm">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="bg-neutral-200 p-6 rounded-3xl mb-8">
              <ClipboardEdit className="w-12 h-12 text-neutral-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-400">
              Entry Closed
            </h2>
            <p className="text-neutral-400 mt-4 text-center font-medium">
              Marks submission is currently disabled by administrator.
            </p>
          </div>
        )}

        {config.view_rankings ? (
          <Link href="/check-results" className="group">
            <div className="relative flex flex-col items-center justify-center p-10 h-80 bg-white border-2 border-transparent rounded-[2.5rem] shadow-xl shadow-primary/5 transition-all hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/30 group-hover:-translate-y-2 overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                <Search className="w-32 h-32" />
              </div>
              <div className="bg-secondary p-6 rounded-3xl mb-8 group-hover:scale-110 transition-transform duration-500">
                <Search className="w-12 h-12 text-secondary-foreground" />
              </div>
              <h2 className="text-3xl font-extrabold text-foreground group-hover:text-primary transition-colors">
                Check Results
              </h2>
              <p className="text-muted-foreground mt-4 text-center font-medium">
                Find and view detailed performance reports.
              </p>
            </div>
          </Link>
        ) : (
          <div className="relative flex flex-col items-center justify-center p-10 h-80 bg-neutral-100 border-2 border-neutral-200 rounded-[2.5rem] shadow-inner opacity-75 grayscale cursor-not-allowed">
            <div className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-sm">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="bg-neutral-200 p-6 rounded-3xl mb-8">
              <Search className="w-12 h-12 text-neutral-400" />
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-400">
               Results Hidden
            </h2>
            <p className="text-neutral-400 mt-4 text-center font-medium">
              Rankings are currently private. Check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
