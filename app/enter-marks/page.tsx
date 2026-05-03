"use client";

import { useEffect, useState } from "react";
import { PROVINCES, PROVINCE_DISTRICTS, SUBJECTS } from "@/lib/constants";
import { submitMarks, getSystemConfig } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ClipboardEdit, X, BookOpen, Layers } from "lucide-react";
import { SubjectAutocomplete } from "@/components/SubjectAutocomplete";
import { Badge } from "@/components/ui/badge";

export default function EnterMarks() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [nicError, setNicError] = useState(false);
  const [subjectLimitError, setSubjectLimitError] = useState(false);
  const [systemConfig, setSystemConfig] = useState<{ iq_marks_enabled: boolean }>({ iq_marks_enabled: true });

  useEffect(() => {
    async function fetchConfig() {
      const config = await getSystemConfig();
      setSystemConfig(config);
    }
    fetchConfig();
  }, []);

  const addSubject = (s: string) => {
    if (s && s !== "" && !selectedSubjects.includes(s)) {
      if (selectedSubjects.length >= 3) {
        setSubjectLimitError(true);
        setTimeout(() => setSubjectLimitError(false), 3000);
        return;
      }
      setSubjectLimitError(false);
      setSelectedSubjects([...selectedSubjects, s]);
    }
  };

  const removeSubject = (s: string) => {
    setSelectedSubjects(selectedSubjects.filter(sub => sub !== s));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
    
    if (!selectedCategory) {
      setMessage({ type: 'error', text: 'Please select a category (Open or limited).' });
      setLoading(false);
      return;
    }

    if (selectedSubjects.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one subject.' });
      setLoading(false);
      return;
    }

    formData.set("category", selectedCategory);
    selectedSubjects.forEach(s => formData.append("subject", s));

    const result = await submitMarks(formData);

    setLoading(false);

    if (result.success) {
      setMessage({ type: "success", text: "Marks successfully submitted! Redirecting..." });
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } else {
      setMessage({ type: "error", text: result.error || "Something went wrong." });
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6 md:py-16 px-3 sm:px-8">
      <Card className="border-0 shadow-2xl shadow-primary/10 rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-primary/5">
        <div className="h-3 bg-gradient-to-r from-primary/50 to-primary w-full" />
        <CardHeader className="text-center space-y-4 pb-10 pt-12">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 text-primary">
            <ClipboardEdit className="w-8 h-8" />
          </div>
          <CardTitle className="text-4xl font-black text-foreground tracking-tight">Bulk Marks Entry</CardTitle>
          <CardDescription className="text-lg text-muted-foreground font-medium">
            Enter marks for all 20 papers at once. All fields are optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleSubmit} className="space-y-16 animate-in fade-in zoom-in-95 duration-500">
            {message && message.type === 'error' && (
              <div className="p-5 rounded-2xl bg-destructive text-destructive-foreground flex items-center gap-4 shadow-lg shadow-destructive/20 animate-in slide-in-from-top-2 duration-500 font-black">
                <AlertCircle className="w-8 h-8 shrink-0" />
                <div className="flex-1">
                  <p className="text-lg uppercase tracking-tight leading-none">Registration Error</p>
                  <p className="text-sm opacity-90 mt-1 font-bold">{message.text}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                <h3 className="text-xl font-black text-foreground tracking-tight">Candidate Profile</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="nic" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">NIC Number</Label>
                  <Input 
                    id="nic" 
                    name="nic" 
                    placeholder="e.g. 199912345678" 
                    required 
                    disabled={loading} 
                    inputMode="numeric"
                    pattern="[0-9]*"
                    onInput={(e) => {
                      if (/[^0-9]/.test(e.currentTarget.value)) {
                        setNicError(true);
                        setTimeout(() => setNicError(false), 2000);
                      }
                      e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                    }}
                    className="rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50 h-14 font-bold" 
                  />
                  {nicError && (
                    <p className="text-[10px] text-destructive font-black animate-bounce mt-1 ml-1 uppercase tracking-widest">
                      ⚠️ Digits only! / ඉලක්කම් පමණක් ඇතුලත් කරන්න.
                    </p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                  <Input id="name" name="name" placeholder="Candidate Name" required disabled={loading} className="rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50 h-14 font-bold" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="province" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Province</Label>
                  <select 
                    id="province" 
                    name="province" 
                    className="flex h-14 w-full rounded-2xl border-2 border-input bg-neutral-50/50 px-4 py-2 text-base font-bold transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 appearance-none text-foreground"
                    required
                    defaultValue=""
                    disabled={loading}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                  >
                    <option value="" disabled>Select province</option>
                    {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="district" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">District</Label>
                  <select 
                    id="district" 
                    name="district" 
                    className="flex h-14 w-full rounded-2xl border-2 border-input bg-neutral-50/50 px-4 py-2 text-base font-bold transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 appearance-none text-foreground"
                    required
                    defaultValue=""
                    disabled={loading}
                  >
                    <option value="" disabled>Select district</option>
                    {selectedProvince && PROVINCE_DISTRICTS[selectedProvince].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {["Open", "limited"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`h-14 rounded-2xl border-2 font-black transition-all ${
                          selectedCategory === cat
                            ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/5"
                            : "border-neutral-100 bg-neutral-50/50 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Subjects (Up to 3)</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedSubjects.map(s => (
                      <Badge key={s} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border-primary/20 flex items-center gap-1 animate-in zoom-in-95">
                        <span className="font-bold text-[10px]">{s}</span>
                        <X 
                          className="w-3 h-3 cursor-pointer hover:bg-primary/20 rounded-full" 
                          onClick={() => !loading && removeSubject(s)} 
                        />
                      </Badge>
                    ))}
                  </div>
                  <SubjectAutocomplete 
                    placeholder="Search and add..."
                    onSelect={(s) => addSubject(s)}
                    className="h-14"
                    clearOnSelect={true}
                    disabled={loading}
                  />
                  {subjectLimitError && <p className="text-[10px] text-destructive font-black mt-1 ml-1 uppercase tracking-widest animate-bounce">⚠️ Limit Exceeded!</p>}
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-secondary rounded-full" />
                  <h3 className="text-xl font-black text-foreground tracking-tight">Paper Marks (1 - 15)</h3>
                </div>
                <Badge variant="outline" className="rounded-full px-4 py-1.5 border-2 font-black text-primary uppercase tracking-widest text-[10px]">
                  {systemConfig.iq_marks_enabled ? "IQ + GK Support Active" : "GK Only Mode"}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-neutral-50/50 p-8 rounded-[2rem] border-2 border-dashed border-neutral-200">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i + 1} className="bg-white p-5 rounded-2xl shadow-md border border-neutral-100 hover:border-primary/30 transition-all group">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="bg-primary/10 w-8 h-8 rounded-lg flex items-center justify-center text-primary font-black text-xs">
                        {i + 1}
                      </div>
                      <p className="font-black text-xs uppercase tracking-widest text-muted-foreground">Paper {i + 1}</p>
                    </div>
                    
                    <div className="space-y-4">
                      {systemConfig.iq_marks_enabled && (
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">IQ Marks</Label>
                          <Input 
                            name={`iq_paper_${i + 1}`} 
                            type="number" 
                            min="0" 
                            max="100" 
                            step="2" 
                            placeholder="IQ" 
                            disabled={loading} 
                            className="rounded-xl border-2 focus:border-primary/50 bg-neutral-50/50 h-10 font-bold text-center" 
                          />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">GK Marks</Label>
                        <Input 
                          name={`gk_paper_${i + 1}`} 
                          type="number" 
                          min="0" 
                          max="100" 
                          step="2" 
                          placeholder="GK" 
                          disabled={loading} 
                          className="rounded-xl border-2 focus:border-primary/50 bg-neutral-50/50 h-10 font-bold text-center" 
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-8 border-t-2 border-neutral-100">
              <Button type="submit" className={`h-16 rounded-2xl font-black shadow-lg transition-all transform active:scale-95 ${message?.type === 'success' ? 'w-full sm:w-20 bg-green-500 hover:bg-green-600' : 'w-full sm:flex-1 text-xl shadow-primary/20 hover:scale-[1.02]'}`} disabled={loading}>
                {loading ? (
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-white animate-bounce" />
                     <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                     <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                   </div>
                ) : message?.type === 'success' ? (
                   <CheckCircle2 className="w-8 h-8" />
                ) : (
                  "Record All Marks"
                )}
              </Button>

              {message && message.type === 'success' && (
                <div className="flex-1 bg-green-50 border-2 border-green-100 text-green-700 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <p className="text-sm font-black uppercase tracking-tight leading-none">{message.text}</p>
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
