"use client";

import { useState } from "react";
import { CATEGORIES, SUBJECTS } from "@/lib/constants";
import { searchStudent, getAdminRankings, getGlobalCandidateStats } from "@/app/actions";
import { StudentResult } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Search, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckResults() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Public Rankings state
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [rankings, setRankings] = useState<StudentResult[]>([]);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [totals, setTotals] = useState<{ categoryTotal: number; subjectTotal: number } | null>(null);

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const nic = formData.get("nic") as string;

    const result = await searchStudent(nic);
    setLoading(false);

    if (result.success && result.data) {
      router.push(`/result?nic=${nic}`);
    } else {
      setError(result.error || "Result not found");
    }
  }

  async function handleViewRankings() {
    if (!selectedCategory || !selectedSubject) return;
    setRankingsLoading(true);
    const [result, stats] = await Promise.all([
      getAdminRankings({ category: selectedCategory as any, subject: selectedSubject }),
      getGlobalCandidateStats(selectedCategory, selectedSubject)
    ]);
    if (result.success) {
      setRankings(result.data || []);
    }
    if (stats.success) {
      setTotals({ categoryTotal: stats.categoryTotal!, subjectTotal: stats.subjectTotal! });
    }
    setRankingsLoading(false);
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-12 px-4 space-y-12">
      <div className="max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-700">
        <Card className="border-0 shadow-[0_32px_64px_-16px_rgba(210,230,250,0.5)] rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-primary/5">
          <div className="h-3 bg-gradient-to-r from-primary/50 to-primary w-full" />
          <CardHeader className="text-center space-y-4 pb-10 pt-12 px-8">
            <div className="bg-primary/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-primary shadow-inner">
              <Search className="w-10 h-10" />
            </div>
            <CardTitle className="text-4xl font-black text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">Find Results</CardTitle>
            <CardDescription className="text-lg font-medium text-muted-foreground pt-2">
              Secure access to your examination performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-10 pb-16">
            <form onSubmit={handleSearch} className="space-y-8">
              <div className="space-y-3 relative group">
                <Label htmlFor="nic" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2">National Identity Card</Label>
                <div className="relative">
                  <Input 
                    id="nic" 
                    name="nic" 
                    placeholder="e.g. 199912345678" 
                    required 
                    className="pl-14 h-16 text-xl rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50 transition-all group-hover:bg-white"
                  />
                  <Search className="w-6 h-6 text-muted-foreground absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
                </div>
              </div>

              {error && (
                <div className="p-5 rounded-2xl bg-destructive text-destructive-foreground flex items-center gap-4 shadow-lg shadow-destructive/20">
                  <AlertCircle className="w-8 h-8 shrink-0" />
                  <div>
                     <p className="text-lg uppercase font-black leading-none">Access Denied</p>
                     <p className="text-sm font-bold opacity-90 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full h-16 text-xl rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transform transition-all group" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                ) : (
                  <span className="flex items-center gap-2">
                    Verify & Access <Search className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <Card className="border-0 shadow-2xl shadow-primary/5 rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-primary/5">
          <CardHeader className="p-10 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-neutral-50">
            <div>
              <CardTitle className="text-3xl font-black text-foreground tracking-tight">Public Rankings</CardTitle>
              <CardDescription className="text-base font-medium text-muted-foreground mt-2">
                Check top performers by category and subject.
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-14 rounded-2xl border-2 bg-neutral-50/50 px-4 font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="">Select Type</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-14 rounded-2xl border-2 bg-neutral-50/50 px-4 font-bold text-foreground focus:outline-none focus:border-primary/50 transition-all"
              >
                <option value="">Select Subject</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button 
                onClick={handleViewRankings} 
                disabled={!selectedCategory || !selectedSubject || rankingsLoading}
                className="h-14 rounded-2xl font-black shadow-lg shadow-primary/10"
              >
                {rankingsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trophy className="w-5 h-5" />}
                <span className="ml-2">View Rank</span>
              </Button>
            </div>
          </CardHeader>
          {totals && (
            <div className="bg-neutral-50/50 p-6 flex flex-wrap items-center justify-center gap-8 border-b border-neutral-100 animate-in fade-in duration-500">
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary rounded-full" />
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                    {selectedCategory === 'Open' ? 'Full Open' : selectedCategory} Total: <span className="text-foreground ml-1">{totals.categoryTotal}</span>
                  </p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-secondary rounded-full" />
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">
                    {selectedSubject} Total: <span className="text-foreground ml-1">{totals.subjectTotal}</span>
                  </p>
               </div>
            </div>
          )}
          <CardContent className="p-0">
            {rankingsLoading ? (
              <div className="p-32 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Fetching leaderboards...</p>
              </div>
            ) : rankings.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-neutral-50/50">
                    <TableRow>
                      <TableHead className="w-20 text-center font-black uppercase text-[10px] tracking-widest pl-10">Pos</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-6">Name</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">District</TableHead>
                      <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-10">Total Marks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankings.map((student, index) => (
                      <TableRow key={student.id} className="group hover:bg-primary/5 border-neutral-100">
                        <TableCell className="text-center pl-10">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl font-black text-sm ${
                            index === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 
                            index === 1 ? 'bg-slate-300 text-white shadow-lg shadow-slate-100' : 
                            index === 2 ? 'bg-orange-300 text-white shadow-lg shadow-orange-100' : 
                            'text-muted-foreground'
                          }`}>
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell className="py-6 font-black text-lg tracking-tight text-foreground">{student.name}</TableCell>
                        <TableCell className="font-bold text-muted-foreground">{student.district}</TableCell>
                        <TableCell className="text-right pr-10 whitespace-nowrap">
                            <span className="font-black text-xl tabular-nums bg-neutral-100 px-4 py-2 rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                {student.total_marks}
                            </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : selectedCategory && selectedSubject ? (
              <div className="p-32 text-center">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
                <p className="text-xl font-black text-foreground">No Records Yet</p>
                <p className="text-muted-foreground font-medium mt-1">Be the first to enter marks for this category!</p>
              </div>
            ) : (
              <div className="p-32 text-center text-muted-foreground/40 italic font-medium">
                Select a type and subject to view the leaderboard.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <p className="text-center mt-6 text-muted-foreground font-medium">
        Problems accessing? Contact support.
      </p>
    </div>
  );
}
