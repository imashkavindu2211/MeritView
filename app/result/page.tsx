"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { searchStudent, getStudentRank, getStudentCandidateStats } from "@/app/actions";
import { StudentResult } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trophy, Navigation, Loader2 } from "lucide-react";

function ResultPageContent() {
  const searchParams = useSearchParams();
  const nicParam = searchParams.get("nic");
  
  const [results, setResults] = useState<StudentResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const data = results[selectedIndex];

  // Ranks state
  const [activeRank, setActiveRank] = useState<{ rank: number | null; totalCandidates: number; type: string } | null>(null);
  const [loadingRank, setLoadingRank] = useState(false);
  
  // Stats state
  const [stats, setStats] = useState<{ categoryStats: any; subjectStats: any } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!nicParam) {
        setError("Invalid NIC provided.");
        setLoading(false);
        return;
      }
      
      const response = await searchStudent(nicParam);
      if (response.success && response.data && response.data.length > 0) {
        setResults(response.data);
      } else {
        setError(response.error || "Result not found");
      }
      setLoading(false);
    }
    
    fetchData();
  }, [nicParam]);

  useEffect(() => {
    async function fetchStats() {
      if (data) {
        const statsRes = await getStudentCandidateStats(data.id);
        if (statsRes.success) {
          setStats({ categoryStats: statsRes.categoryStats, subjectStats: statsRes.subjectStats });
        }
      }
    }
    fetchStats();
    // Clear active rank when switching subject
    setActiveRank(null);
  }, [data?.id]);

  async function fetchRank(type: "island" | "province" | "district") {
    if (!nicParam) return;
    setLoadingRank(true);
    setActiveRank(null);
    
    // Slight artificial delay for UX feeling of calculation
    await new Promise(r => setTimeout(r, 400));
    
    const rankData = await getStudentRank(data.id, type);
    setActiveRank({ rank: rankData.rank, totalCandidates: rankData.totalCandidates, type });
    setLoadingRank(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-neutral-500 font-medium tracking-wide animate-pulse">Fetching results...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-md mx-auto mt-20 text-center gap-4 flex flex-col items-center">
        <div className="bg-red-100 p-4 rounded-full text-red-600">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-800">No Results Found</h2>
        <p className="text-neutral-600">{error || "Could not fetch student result. Please double-check your NIC."}</p>
        <Button onClick={() => window.history.back()} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-4 sm:px-6 animate-in fade-in duration-700">
      {results.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {results.map((res, index) => (
            <Button
              key={res.id}
              onClick={() => setSelectedIndex(index)}
              variant={selectedIndex === index ? "default" : "outline"}
              className={`rounded-full px-6 font-bold transition-all ${selectedIndex === index ? 'scale-110 shadow-lg' : 'opacity-70 hover:opacity-100'}`}
            >
              {res.subject}
            </Button>
          ))}
        </div>
      )}
      <Card className="border-0 shadow-2xl shadow-primary/10 rounded-[3rem] bg-white overflow-hidden ring-1 ring-primary/5">
        <div className="h-4 bg-gradient-to-r from-primary/50 via-primary to-secondary w-full" />
        
        <CardHeader className="text-center pb-12 pt-16 border-b border-neutral-50 bg-neutral-50/30 px-8">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge className="px-4 py-1.5 rounded-full capitalize bg-primary/20 text-primary-foreground font-black tracking-widest text-xs border-0">
              {data.category === 'Open' ? 'Full Open' : 'Limited'} Stream
            </Badge>
            <Badge className="px-4 py-1.5 rounded-full capitalize bg-secondary/30 text-secondary-foreground font-black tracking-widest text-xs border-0">
              {data.subject}
            </Badge>
          </div>
          <CardTitle className="text-5xl font-black text-foreground tracking-tight mb-2">{data.name}</CardTitle>
          <CardDescription className="text-xl text-muted-foreground font-bold tracking-tight">Reg No: {data.nic}</CardDescription>
        </CardHeader>
        
        <CardContent className="p-10 md:p-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-6 bg-primary rounded-full" />
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Profile</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-5 p-6 bg-neutral-50/50 rounded-3xl border-2 border-neutral-100/50 hover:border-primary/20 transition-colors">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-primary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Province</p>
                    <p className="text-xl font-black text-foreground tracking-tight">{data.province}</p>
                  </div>
                </div>
                <div className="flex items-center gap-5 p-6 bg-neutral-50/50 rounded-3xl border-2 border-neutral-100/50 hover:border-primary/20 transition-colors">
                  <div className="bg-white p-3 rounded-2xl shadow-sm text-secondary-foreground">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">District</p>
                    <p className="text-xl font-black text-foreground tracking-tight">{data.district}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-6 bg-secondary rounded-full" />
                <h3 className="text-sm font-black text-muted-foreground uppercase tracking-[0.2em]">Scorecard</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-6 bg-primary/5 rounded-3xl border-2 border-primary/10 font-bold">
                  <span className="text-primary-foreground tracking-tight">IQ Assessment</span>
                  <span className="text-3xl font-black">{data.iq_marks}</span>
                </div>
                <div className="flex justify-between items-center p-6 bg-secondary/20 rounded-3xl border-2 border-secondary/30 font-bold">
                  <span className="text-secondary-foreground tracking-tight">General Knowledge</span>
                  <span className="text-3xl font-black">{data.gk_marks}</span>
                </div>
                <div className="mt-8 flex justify-between items-center p-8 bg-foreground text-background rounded-[2rem] shadow-2xl shadow-foreground/10 font-black">
                  <span className="text-lg uppercase tracking-widest opacity-80">Aggregate</span>
                  <span className="text-5xl tracking-tighter">{data.total_marks}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-16 pt-16 border-t-2 border-dashed border-neutral-200">
            {stats && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-lg font-black text-center uppercase tracking-widest text-primary underline decoration-primary/20 underline-offset-4 mb-8">
                     {data.category === 'Open' ? 'Full Open' : 'Limited'} - Distribution
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-2xl border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sri Lanka</p>
                      <p className="text-2xl font-black">{stats.categoryStats.island}</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-2xl border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Province</p>
                      <p className="text-2xl font-black">{stats.categoryStats.province}</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-2xl border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">District</p>
                      <p className="text-2xl font-black">{stats.categoryStats.district}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-black text-center uppercase tracking-widest text-secondary-foreground underline decoration-secondary/20 underline-offset-4 mb-8">
                     {data.subject} - Distribution
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-2xl border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Sri Lanka</p>
                      <p className="text-2xl font-black">{stats.subjectStats.island}</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-2xl border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Province</p>
                      <p className="text-2xl font-black">{stats.subjectStats.province}</p>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-2xl border text-center">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">District</p>
                      <p className="text-2xl font-black">{stats.subjectStats.district}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-10">
              <h3 className="text-2xl font-black text-foreground text-center tracking-tight">Performance Analytics</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { id: "island", label: "National", color: "text-amber-500", bg: "hover:bg-amber-50" },
                  { id: "province", label: "Provincial", color: "text-slate-400", bg: "hover:bg-slate-50" },
                  { id: "district", label: "District", color: "text-orange-400", bg: "hover:bg-orange-50" }
                ].map((item) => (
                  <Button 
                    key={item.id}
                    onClick={() => fetchRank(item.id as any)} 
                    variant="outline" 
                    className={`h-24 rounded-3xl text-lg font-black tracking-tight border-2 transition-all hover:scale-[1.05] active:scale-95 flex flex-col gap-1 items-center justify-center ${item.bg}`}
                  >
                    <Trophy className={`w-6 h-6 ${item.color}`} />
                    {item.label} Rank
                  </Button>
                ))}
              </div>

              {loadingRank && (
                <div className="flex justify-center p-12 bg-neutral-50 rounded-[2rem] animate-pulse">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              )}

              {activeRank && !loadingRank && (
                <div className="mt-8 p-10 bg-gradient-to-br from-primary/10 to-transparent rounded-[2.5rem] border-2 border-primary/20 text-center animate-in zoom-in-95 duration-500 shadow-inner">
                  <p className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-4">
                    Official {activeRank.type} {data.subject} Placement
                  </p>
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-8xl font-black text-foreground tracking-tighter mb-4">
                      <span className="text-4xl text-primary font-bold mr-1">#</span>{activeRank.rank}
                    </div>
                    <div className="h-1.5 w-24 bg-primary/30 rounded-full mb-6" />
                    <p className="text-lg text-muted-foreground font-bold italic">
                      Ranking among <span className="text-foreground not-italic underline decoration-primary/30 underline-offset-4">{activeRank.totalCandidates}</span> candidates in this subject
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-12 flex justify-center">
        <Button onClick={() => window.history.back()} variant="ghost" className="text-muted-foreground font-black tracking-widest uppercase text-xs hover:bg-primary/10 h-12 px-8 rounded-full transition-all">
          &larr; Return to Search
        </Button>
      </div>
    </div>
  );
}

// Ensure the page doesn't throw because of useSearchParams in missing suspense boundary
export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
      <ResultPageContent />
    </Suspense>
  );
}

// Also import AlertCircle for the error state at bottom
import { AlertCircle } from "lucide-react";
