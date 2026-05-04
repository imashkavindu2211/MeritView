"use client";

import { useState } from "react";
import { Search, Loader2, BarChart3, ArrowRight } from "lucide-react";
import { getUserPerformance } from "@/app/actions";
import PerformanceChart from "./PerformanceChart";
import { Button } from "@/components/ui/button";

export default function HomeAnalytics() {
  const [nic, setNic] = useState("");
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState<any[] | null>(null);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!nic) return;
    setLoading(true);
    setError("");
    setPerformanceData(null);

    const result = await getUserPerformance(nic);
    if (result.success && result.data && result.data.length > 0) {
      setPerformanceData(result.data);
      // We don't have the user's name in getUserPerformance easily without another query, 
      // but we can assume we might want to fetch it or just show "Your Performance"
      setUserName("Your"); 
    } else {
      setError("No performance history found for this NIC.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-12 py-20 px-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
          <BarChart3 className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">Personal Analytics</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
          Track Your Progress
        </h2>
        <p className="text-muted-foreground font-medium text-lg max-w-2xl mx-auto">
          Enter your NIC number to visualize your performance growth across all examination dates.
        </p>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="relative w-full max-w-xl group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="Enter NIC Number (e.g. 200012345678)"
            value={nic}
            onChange={(e) => setNic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full h-20 pl-16 pr-40 bg-white border-2 border-neutral-100 rounded-[2rem] text-xl font-bold shadow-xl shadow-primary/5 focus:border-primary focus:ring-8 focus:ring-primary/5 outline-none transition-all placeholder:text-neutral-300"
          />
          <div className="absolute right-4 inset-y-4">
             <Button 
               onClick={handleSearch} 
               disabled={loading || !nic}
               className="h-full px-8 rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-primary/20"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyze"}
               {!loading && <ArrowRight className="w-4 h-4" />}
             </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-bold text-sm animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {performanceData && (
          <div className="w-full mt-10 animate-in fade-in zoom-in-95 duration-1000">
            <PerformanceChart data={performanceData} name={userName} />
          </div>
        )}
      </div>
    </div>
  );
}
