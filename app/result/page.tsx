"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { searchStudent, getStudentRank, getOverallCandidateCount, getCategoryPeakMarks, getSystemConfig } from "@/app/actions";
import { StudentResult } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Trophy,
  Navigation,
  Loader2,
  User,
  ClipboardCheck,
  Award,
  PieChart,
  AlertCircle,
  BookOpen,
  Globe,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Layers,
  ChevronRight
} from "lucide-react";

function ResultPageContent() {
  const searchParams = useSearchParams();
  const nicParam = searchParams.get("nic");

  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overallCount, setOverallCount] = useState<number>(0);

  // Group results by subject
  const subjectAggregates = useMemo(() => {
    const map = new Map<string, { iq: number, gk: number, total: number, count: number, id: string }>();
    results.forEach(r => {
      const existing = map.get(r.subject) || { iq: 0, gk: 0, total: 0, count: 0, id: r.id };
      map.set(r.subject, {
        iq: existing.iq + (r.iq_marks || 0),
        gk: existing.gk + (r.gk_marks || 0),
        total: existing.total + (r.total_marks || 0),
        count: existing.count + 1,
        id: existing.id // Keep one ID for rank fetching
      });
    });
    return Array.from(map.entries()).map(([name, data]) => ({ name, ...data }));
  }, [results]);

  // Overall candidate data (sum of unique papers)
  const aggregatedData = useMemo(() => {
    if (results.length === 0) return null;
    
    // Get unique papers to avoid double counting if student has multiple subjects
    const uniquePapers = new Map<number, StudentResult>();
    results.forEach(r => {
      if (!uniquePapers.has(r.paper_number)) {
        uniquePapers.set(r.paper_number, r);
      }
    });

    const paperList = Array.from(uniquePapers.values());
    const iqTotal = paperList.reduce((sum, r) => sum + (r.iq_marks || 0), 0);
    const gkTotal = paperList.reduce((sum, r) => sum + (r.gk_marks || 0), 0);
    const totalTotal = paperList.reduce((sum, r) => sum + (r.total_marks || 0), 0);
    
    return {
      ...results[0],
      iq_marks: iqTotal,
      gk_marks: gkTotal,
      total_marks: totalTotal,
      papers_count: uniquePapers.size
    };
  }, [results]);

  const data = aggregatedData;

  // Ranks state
  const [islandRank, setIslandRank] = useState<{ rank: number | null; total: number } | null>(null);
  const [provinceRank, setProvinceRank] = useState<{ rank: number | null; total: number } | null>(null);
  const [districtRank, setDistrictRank] = useState<{ rank: number | null; total: number } | null>(null);
  
  const [subjectRanks, setSubjectRanks] = useState<Record<string, { island: number, province: number, district: number }>>({});
  
  const [loadingRanks, setLoadingRanks] = useState(false);
  const [viewMode, setViewMode] = useState<'total_marks' | 'iq_marks' | 'gk_marks'>('total_marks');
  const [rankingScope, setRankingScope] = useState<'general' | 'category'>('general');
  const [systemConfig, setSystemConfig] = useState<{ iq_marks_enabled: boolean }>({ iq_marks_enabled: true });

  const fetchAllRanks = useCallback(async (resultId: string, mode: 'total_marks' | 'iq_marks' | 'gk_marks') => {
    setLoadingRanks(true);
    try {
      // 1. Fetch Global Ranks
      const [island, province, district] = await Promise.all([
        getStudentRank(resultId, "island", mode, rankingScope),
        getStudentRank(resultId, "province", mode, rankingScope),
        getStudentRank(resultId, "district", mode, rankingScope)
      ]);

      setIslandRank({ rank: island.rank, total: island.totalCandidates });
      setProvinceRank({ rank: province.rank, total: province.totalCandidates });
      setDistrictRank({ rank: district.rank, total: district.totalCandidates });

      // 2. Fetch Subject-specific Ranks for each subject
      const sRanks: Record<string, any> = {};
      await Promise.all(subjectAggregates.map(async (subj) => {
        const [sIsland, sProvince, sDistrict] = await Promise.all([
          getStudentRank(subj.id, "island", mode, "subject"),
          getStudentRank(subj.id, "province", mode, "subject"),
          getStudentRank(subj.id, "district", mode, "subject")
        ]);
        sRanks[subj.name] = {
          island: sIsland.rank,
          province: sProvince.rank,
          district: sDistrict.rank
        };
      }));
      setSubjectRanks(sRanks);

    } catch (e) {
      console.error("Error fetching ranks", e);
    }
    setLoadingRanks(false);
  }, [rankingScope, subjectAggregates]);

  useEffect(() => {
    async function fetchData() {
      if (!nicParam) {
        setError("Invalid NIC provided.");
        setLoading(false);
        return;
      }

      const [studentData, globalData] = await Promise.all([
        searchStudent(nicParam),
        getOverallCandidateCount()
      ]);

      if (studentData.success && studentData.data && studentData.data.length > 0) {
        setResults(studentData.data);
      } else {
        setError(studentData.error || "Result not found");
      }

      if (globalData.success) {
        setOverallCount(globalData.count);
      }

      const config = await getSystemConfig();
      setSystemConfig(config);

      setLoading(false);
    }

    fetchData();
  }, [nicParam]);

  useEffect(() => {
    if (data) {
      fetchAllRanks(data.id, viewMode);
    }
  }, [data?.id, viewMode, rankingScope, fetchAllRanks]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 bg-white px-6">
        <div className="relative">
          <div className="absolute inset-0 bg-rose-500 rounded-full blur-2xl opacity-10 animate-pulse" />
          <Loader2 className="w-16 h-16 animate-spin text-rose-600 opacity-20" />
          <Loader2 className="w-16 h-16 animate-spin text-rose-500 absolute inset-0 [animation-delay:-0.5s]" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">Syncing Candidate Analytics</h3>
          <p className="text-rose-600/60 font-black text-[9px] uppercase tracking-[0.4em] animate-pulse">Aggregating Subject Performance</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-24 px-6 animate-in fade-in zoom-in duration-1000">
        <div className="bg-white rounded-[3.5rem] p-16 shadow-2xl shadow-rose-900/5 text-center border border-rose-50 flex flex-col items-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 to-transparent pointer-events-none" />
          <div className="bg-rose-50 p-10 rounded-[3rem] text-rose-600 mb-10 ring-8 ring-rose-50/50 group-hover:scale-110 transition-transform duration-700">
            <AlertCircle className="w-20 h-20" />
          </div>
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-6 leading-none">Record Not Found</h2>
          <p className="text-slate-500 font-bold mb-12 leading-relaxed text-xl opacity-70 max-w-md">
            {error || "The identity credentials provided do not match any candidates in our secure database."}
          </p>
          <Button onClick={() => window.history.back()} className="w-full h-20 rounded-[2.5rem] bg-rose-600 text-white text-lg font-black hover:bg-rose-700 shadow-xl">
            ← Attempt New Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-4 md:py-8 px-2 sm:px-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* CANDIDATE PROFILE */}
      <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-xl ring-1 ring-rose-100 relative overflow-hidden border border-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 border-4 border-white shadow-lg">
            <User className="w-12 h-12 md:w-16 md:h-16" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
                <Badge className="bg-rose-600 text-white border-0 px-3 py-1 font-black uppercase text-[8px] tracking-widest">Candidate</Badge>
                <Badge variant="outline" className="border-2 px-3 py-1 font-black uppercase text-[8px] tracking-widest">Papers: {data.papers_count} / 15</Badge>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">{data.name}</h2>
              <p className="text-rose-600/60 font-black text-lg md:text-xl mt-1 tracking-tight">Registry: {data.nic}</p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl ring-1 ring-rose-50 shadow-sm">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black text-slate-700">{data.province}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl ring-1 ring-rose-50 shadow-sm">
                <Navigation className="w-4 h-4 text-rose-500" />
                <span className="text-xs font-black text-slate-700">{data.district}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OVERALL PERFORMANCE CARD */}
      <div className="bg-white rounded-[2rem] shadow-lg ring-1 ring-rose-100 overflow-hidden border border-white relative">
        <div className="bg-rose-50/30 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-900/40">Overall Aggregate Merit</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pool Size: <span className="text-rose-600">{overallCount}</span></span>
        </div>

        <div className="p-8 md:p-12 flex flex-col items-center">
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-rose-500 rounded-full blur-2xl opacity-10" />
            <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-white border-8 border-white shadow-xl flex flex-col items-center justify-center p-6 ring-1 ring-rose-100/50">
              <div className="absolute inset-1 bg-gradient-to-br from-rose-800 via-rose-600 to-rose-400 rounded-full flex flex-col items-center justify-center text-white shadow-inner">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Grand Total</p>
                <span className="text-5xl md:text-7xl font-black tracking-tighter">{systemConfig.iq_marks_enabled ? data.total_marks : data.gk_marks}</span>
                <div className="h-0.5 w-12 bg-white/40 rounded-full my-2" />
                <p className="text-xs font-black opacity-90">/ 1500</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            {[
              { label: 'Island Rank', icon: Trophy, rank: islandRank?.rank },
              { label: 'Province Rank', icon: Globe, rank: provinceRank?.rank },
              { label: 'District Rank', icon: PieChart, rank: districtRank?.rank }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-3xl shadow-md border border-rose-50 flex items-center gap-6 group hover:border-rose-300 transition-all">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:rotate-12 transition-transform">
                  <item.icon className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                  <p className="text-3xl font-black text-slate-900 leading-none">
                    {loadingRanks ? <Loader2 className="w-6 h-6 animate-spin text-rose-100" /> : item.rank ? item.rank.toString().padStart(2, '0') : '--'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUBJECT WISE BREAKDOWN */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <Award className="w-8 h-8 text-rose-600" />
           <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Subject Wise Aggregate</h3>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {subjectAggregates.map((subj) => {
            const ranks = subjectRanks[subj.name];
            return (
              <div key={subj.name} className="bg-white rounded-[2rem] p-8 shadow-xl ring-1 ring-rose-100 border border-white group hover:shadow-2xl transition-all duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b border-rose-50 pb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                      <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{subj.name}</h4>
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Aggregated Performance across {subj.count} Papers</p>
                  </div>
                  <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-lg shadow-slate-900/10 flex flex-col items-center min-w-[160px]">
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Subject Score</p>
                     <span className="text-4xl font-black tabular-nums">{systemConfig.iq_marks_enabled ? subj.total : subj.gk}</span>
                     <p className="text-xs opacity-40 font-black mt-1">/ 1500</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Subject Island', icon: Trophy, rank: ranks?.island },
                    { label: 'Subject Province', icon: Globe, rank: ranks?.province },
                    { label: 'Subject District', icon: PieChart, rank: ranks?.district }
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl border border-dashed border-rose-200 flex items-center gap-6">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-rose-400">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                        <p className="text-3xl font-black text-slate-700 leading-none">
                           {loadingRanks ? <Loader2 className="w-6 h-6 animate-spin text-rose-100" /> : item.rank ? item.rank.toString().padStart(2, '0') : '--'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <Button onClick={() => window.history.pushState({}, '', '/')} variant="ghost" className="text-rose-900/30 font-black tracking-widest uppercase text-[10px] hover:bg-rose-50 hover:text-rose-600 h-12 px-10 rounded-full transition-all">
          &larr; Return to Home
        </Button>
      </div>

      <div className="h-20" />
    </div>
  );
}

export default function ResultPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-rose-50/10 to-white selection:bg-rose-100 selection:text-rose-900">
      <Suspense fallback={
        <div className="p-20 flex flex-col items-center justify-center min-h-screen gap-10 bg-white">
          <div className="w-20 h-20 relative">
             <div className="absolute inset-0 border-4 border-rose-100 rounded-full" />
             <div className="absolute inset-0 border-4 border-rose-600 rounded-full border-t-transparent animate-spin" />
          </div>
          <p className="font-black text-rose-900/20 uppercase tracking-[0.6em] text-[11px] animate-pulse italic">Establishing Secure Protocol</p>
        </div>
      }>
        <ResultPageContent />
      </Suspense>
    </div>
  );
}
