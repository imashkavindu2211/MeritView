"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { getAdminRankings, adminLogout, deleteAllData, getSystemConfig, toggleConfig, deleteStudent } from "@/app/actions";
import { StudentResult } from "@/types";
import { PROVINCES, DISTRICTS, SUBJECTS } from "@/lib/constants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, RefreshCcw, Loader2, Trash2, Eye, EyeOff, Edit3, ShieldAlert, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

import { SubjectAutocomplete } from "@/components/SubjectAutocomplete";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("do_island");
  const [data, setData] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // System Config
  const [systemConfig, setSystemConfig] = useState({ marks_entry: true, view_rankings: true });
  const [configLoading, setConfigLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let category: "Do" | "Open" | undefined;
    let sortBy: "total_marks" | "iq_marks" | "gk_marks" = "total_marks";
    let filterProvince = undefined;
    let filterDistrict = undefined;

    // Parse tab config
    if (activeTab.includes("do_")) category = "Do";
    if (activeTab.includes("open_")) category = "Open";

    if (activeTab.includes("province")) filterProvince = selectedProvince || PROVINCES[0];
    if (activeTab.includes("district")) filterDistrict = selectedDistrict || DISTRICTS[0];

    if (activeTab === "iq_ranking") sortBy = "iq_marks";
    if (activeTab === "gk_ranking") sortBy = "gk_marks";

    const response = await getAdminRankings({
      category: category as any,
      subject: (selectedSubject && selectedSubject !== "ALL_SUBJECTS") ? selectedSubject : undefined,
      province: filterProvince,
      district: filterDistrict,
      sortBy
    });

    if (response.success) {
      setData(response.data || []);
    }
    setLoading(false);
  }, [activeTab, selectedProvince, selectedDistrict, selectedSubject]);

  const fetchConfig = useCallback(async () => {
    setConfigLoading(true);
    const config = await getSystemConfig();
    setSystemConfig(config);
    setConfigLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    fetchConfig();

    // Supabase Realtime Subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students_results',
        },
        (payload) => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, fetchConfig]);

  async function handleLogout() {
    await adminLogout();
    router.push("/");
  }

  async function handleDeleteAll() {
    if (!confirm("CRITICAL WARNING: This will permanently delete ALL student data from the database. This action cannot be undone. Are you absolutely sure?")) {
      return;
    }
    
    setLoading(true);
    const result = await deleteAllData();
    if (result.success) {
      alert("Database purged successfully.");
      fetchData();
    } else {
      alert("Error deleting data: " + result.error);
    }
    setLoading(false);
  }

  async function handleToggle(key: "marks_entry_enabled" | "view_rankings_enabled", current: boolean) {
    const result = await toggleConfig(key, current);
    if (result.success) {
      fetchConfig();
    } else {
      alert("Failed to update config: " + result.error);
    }
  }

  async function handleDeleteSingle(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    const result = await deleteStudent(id);
    if (result.success) {
      fetchData();
    } else {
      alert("Error deleting student: " + result.error);
    }
    setLoading(false);
  }

  const needsProvinceFilter = activeTab === "do_province" || activeTab === "open_province";
  const needsDistrictFilter = activeTab === "do_district" || activeTab === "open_district";
  const needsSubjectFilter = !activeTab.includes("ranking");

  return (
    <div className="w-full max-w-[98vw] mx-auto py-12 px-6 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-end mb-12 gap-8 bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] shadow-2xl shadow-primary/5 border ring-1 ring-primary/5">
        <div className="space-y-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-8 bg-primary rounded-full" />
            <h1 className="text-4xl font-black text-foreground tracking-tighter">Admin Dashboard</h1>
          </div>
          <p className="text-lg text-muted-foreground font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live monitoring of examination performance
          </p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <Button variant="outline" onClick={fetchData} className="flex-1 lg:flex-none h-14 rounded-2xl gap-2 font-bold bg-white hover:bg-primary/5 border-2 transition-all active:scale-95">
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button variant="destructive" onClick={handleLogout} className="flex-1 lg:flex-none h-14 rounded-2xl gap-2 font-bold shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95">
            <LogOut className="w-5 h-5" />
            End Session
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-8">
        <TabsList className="flex flex-wrap h-auto p-2 bg-neutral-100/50 backdrop-blur-sm rounded-[2rem] gap-2 border shadow-inner">
          {[
            { v: "do_island", l: "Do Island" },
            { v: "open_island", l: "Open Island" },
            { v: "do_province", l: "Do Province" },
            { v: "open_province", l: "Open Province" },
            { v: "do_district", l: "Do District" },
            { v: "open_district", l: "Open District" },
            { v: "iq_ranking", l: "IQ Peak" },
            { v: "gk_ranking", l: "GK Peak" }
          ].map((tab) => (
            <TabsTrigger 
              key={tab.v}
              value={tab.v} 
              className="flex-1 min-w-[140px] py-4 rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-lg transition-all"
            >
              {tab.l}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex flex-col md:flex-row gap-6">
          {needsSubjectFilter && (
            <div className="w-full md:w-80 animate-in slide-in-from-left-4 duration-500">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-primary/5 border ring-1 ring-primary/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 ml-1">Stream / Subject</p>
                <SubjectAutocomplete 
                  defaultValue={selectedSubject} 
                  onSelect={setSelectedSubject} 
                  showAllOption={true}
                  placeholder="All Subjects"
                  className="h-14"
                />
              </div>
            </div>
          )}

          {needsProvinceFilter && (
            <div className="w-full md:w-80 animate-in slide-in-from-left-4 duration-500">
              <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-primary/5 border ring-1 ring-primary/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 ml-1">Filter by Location</p>
                <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                  <SelectTrigger className="h-14 rounded-xl border-2 bg-neutral-50/50 font-bold text-foreground focus:ring-4 focus:ring-primary/10">
                    <SelectValue placeholder="All Provinces" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p} className="font-medium">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {needsDistrictFilter && (
            <div className="w-full md:w-80 animate-in slide-in-from-left-4 duration-500">
               <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-primary/5 border ring-1 ring-primary/5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 ml-1">Deep Filter</p>
                <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
                  <SelectTrigger className="h-14 rounded-xl border-2 bg-neutral-50/50 font-bold text-foreground focus:ring-4 focus:ring-primary/10">
                    <SelectValue placeholder="All Districts" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    {DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d} className="font-medium">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <Card className="border-0 shadow-2xl shadow-primary/10 bg-white rounded-[3rem] overflow-hidden ring-1 ring-primary/5">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-32 gap-6">
                <div className="relative">
                  <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
                  <Loader2 className="w-16 h-16 animate-spin text-primary absolute inset-0 [animation-delay:-0.5s]" />
                </div>
                <p className="font-black text-muted-foreground uppercase tracking-[0.3em] text-xs">Syncing rankings...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center p-32 bg-neutral-50/30">
                <div className="bg-white w-20 h-20 rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-6 text-muted-foreground/30">
                  <RefreshCcw className="w-10 h-10" />
                </div>
                <p className="text-2xl font-black text-foreground tracking-tight">No Results Found</p>
                <p className="text-muted-foreground font-medium mt-2">Try adjusting your filters or checking back later.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-neutral-50/50">
                    <TableRow className="hover:bg-transparent border-b-2 text-neutral-900">
                      <TableHead className="w-[80px] text-center font-black uppercase tracking-widest text-[10px]">Action</TableHead>
                      <TableHead className="w-[100px] text-center font-black uppercase tracking-widest text-[10px]">Pos</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px] py-6">Candidate Identity</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px]">Stream / Subject</TableHead>
                      <TableHead className="font-black uppercase tracking-widest text-[10px]">Origin</TableHead>
                      <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">IQ</TableHead>
                      <TableHead className="text-right font-black uppercase tracking-widest text-[10px]">GK</TableHead>
                      <TableHead className="text-right font-black text-primary uppercase tracking-widest text-[10px] pr-10">Aggregate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((student, index) => (
                      <TableRow key={student.id} className="group hover:bg-red-50/50 transition-all border-b last:border-0 border-neutral-100">
                        <TableCell className="py-6 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteSingle(student.id!, student.name)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl font-black text-sm shadow-sm transition-all group-hover:scale-110 ${
                              index === 0 ? 'bg-amber-400 text-white shadow-amber-200' : 
                              index === 1 ? 'bg-slate-300 text-white shadow-slate-100' : 
                              index === 2 ? 'bg-orange-300 text-white shadow-orange-100' : 
                              'bg-neutral-100 text-muted-foreground'
                            }`}>
                              {index + 1}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-black text-foreground tracking-tight text-lg">{student.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="bg-primary/10 px-3 py-1 rounded-lg">
                                <p className="text-xs font-black text-primary uppercase tracking-tighter">{student.category}</p>
                             </div>
                             <div className="bg-secondary/10 px-3 py-1 rounded-lg">
                                <p className="text-xs font-black text-secondary-foreground uppercase tracking-tighter">{student.subject}</p>
                             </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-4 bg-secondary rounded-full" />
                            <div>
                                <p className="text-sm font-black text-foreground">{student.district}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-50">{student.province}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-foreground opacity-70">{student.iq_marks}</TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-foreground opacity-70">{student.gk_marks}</TableCell>
                        <TableCell className="text-right pr-10">
                          <span className="inline-block py-2 px-6 rounded-2xl bg-foreground text-background font-black text-xl tabular-nums shadow-lg shadow-foreground/10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-primary/20 transition-all">
                            {student.total_marks}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>

      {/* Administrative Controls Section */}
      <div className="mt-20 border-t-2 border-dashed border-neutral-200 pt-16 pb-24">
        <div className="flex items-center gap-4 mb-10">
          <div className="bg-foreground text-background p-3 rounded-2xl shadow-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight uppercase">System Management</h2>
            <p className="text-muted-foreground font-medium">Global platform controls and data maintenance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Toggle Marks Entry */}
          <Card className={`border-0 shadow-xl rounded-[2.5rem] overflow-hidden transition-all duration-500 ${systemConfig.marks_entry ? 'bg-white ring-1 ring-primary/10' : 'bg-neutral-50 grayscale opacity-80'}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl ${systemConfig.marks_entry ? 'bg-primary/10 text-primary' : 'bg-neutral-200 text-neutral-500'}`}>
                  <Edit3 className="w-6 h-6" />
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${systemConfig.marks_entry ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {systemConfig.marks_entry ? 'Operational' : 'Disabled'}
                </div>
              </div>
              <CardTitle className="text-xl font-black mt-4">Marks Entry Phase</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium mb-8">
                Controls access to the "Enter Marks" form for candidates and staff.
              </p>
              <Button 
                onClick={() => handleToggle("marks_entry_enabled", systemConfig.marks_entry)}
                className={`w-full h-14 rounded-2xl font-black transition-all ${systemConfig.marks_entry ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'}`}
              >
                {systemConfig.marks_entry ? "Disable Mark Submission" : "Enable Mark Submission"}
              </Button>
            </CardContent>
          </Card>

          {/* Toggle View Rankings */}
          <Card className={`border-0 shadow-xl rounded-[2.5rem] overflow-hidden transition-all duration-500 ${systemConfig.view_rankings ? 'bg-white ring-1 ring-secondary/20' : 'bg-neutral-50 grayscale opacity-80'}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl ${systemConfig.view_rankings ? 'bg-secondary/20 text-secondary-foreground' : 'bg-neutral-200 text-neutral-500'}`}>
                   {systemConfig.view_rankings ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${systemConfig.view_rankings ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {systemConfig.view_rankings ? 'Visibility: High' : 'Visibility: Hidden'}
                </div>
              </div>
              <CardTitle className="text-xl font-black mt-4">Result Visibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium mb-8">
                Hides or shows the detailed rankings and scorecard for candidates.
              </p>
              <Button 
                onClick={() => handleToggle("view_rankings_enabled", systemConfig.view_rankings)}
                className={`w-full h-14 rounded-2xl font-black transition-all ${systemConfig.view_rankings ? 'bg-foreground text-background hover:bg-foreground/90' : 'bg-secondary text-secondary-foreground shadow-lg shadow-secondary/20'}`}
              >
                {systemConfig.view_rankings ? "Hide Candidates Results" : "Show Candidates Results"}
              </Button>
            </CardContent>
          </Card>

          {/* Purge Database */}
          <Card className="border-0 shadow-xl rounded-[2.5rem] bg-white ring-1 ring-destructive/10 overflow-hidden group hover:ring-destructive/30 transition-all">
             <div className="h-2 bg-destructive/10 group-hover:bg-destructive/30 transition-colors" />
             <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-destructive text-destructive-foreground">
                  Danger Zone
                </div>
              </div>
              <CardTitle className="text-xl font-black mt-4">Purge All Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground font-medium mb-8">
                Instantly wipe all candidate records and scores from the host database.
              </p>
              <Button 
                onClick={handleDeleteAll}
                variant="destructive"
                className="w-full h-14 rounded-2xl font-black shadow-lg shadow-destructive/20 hover:scale-[1.02] transform transition-all"
              >
                Empty Database Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
