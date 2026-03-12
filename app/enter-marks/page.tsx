"use client";

import { useState } from "react";
import { PROVINCES, PROVINCE_DISTRICTS, CATEGORIES } from "@/lib/constants";
import { submitMarks } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, ClipboardEdit } from "lucide-react";

export default function EnterMarks() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    const formData = new FormData(e.currentTarget);
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
    <div className="w-full max-w-3xl mx-auto py-16 px-4 sm:px-6">
      <Card className="border-0 shadow-2xl shadow-primary/10 rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-primary/5">
        <div className="h-3 bg-gradient-to-r from-primary/50 to-primary w-full" />
        <CardHeader className="text-center space-y-4 pb-10 pt-12">
          <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 text-primary">
            <ClipboardEdit className="w-8 h-8" />
          </div>
          <CardTitle className="text-4xl font-black text-foreground tracking-tight">Enter Marks</CardTitle>
          <CardDescription className="text-lg text-muted-foreground font-medium">
            Fill in the candidate details below to record their performance.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-12">
          <form onSubmit={handleSubmit} className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
            {message && (
              <div className={`p-5 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top-2 duration-500 shadow-lg ${
                message.type === 'success' 
                  ? 'bg-primary text-primary-foreground font-black shadow-primary/20' 
                  : 'bg-destructive text-destructive-foreground font-black shadow-destructive/20'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="w-8 h-8 shrink-0" /> : <AlertCircle className="w-8 h-8 shrink-0"/>}
                <div className="flex-1">
                  <p className="text-lg uppercase tracking-tight leading-none">{message.type === 'success' ? 'Success!' : 'Registration Error'}</p>
                  <p className="text-sm opacity-90 mt-1 font-bold">{message.text}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-primary rounded-full" />
                <h3 className="text-xl font-black text-foreground tracking-tight">Student Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="nic" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">NIC Number</Label>
                  <Input id="nic" name="nic" placeholder="e.g. 199912345678" required className="rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50 h-14" />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</Label>
                  <Input id="name" name="name" placeholder="Candidate Name" required className="rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50 h-14" />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="province" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Province</Label>
                  <select 
                    id="province" 
                    name="province" 
                    className="flex h-14 w-full rounded-2xl border-2 border-input bg-neutral-50/50 px-4 py-2 text-base font-medium transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 appearance-none text-foreground"
                    required
                    defaultValue=""
                    onChange={(e) => setSelectedProvince(e.target.value)}
                  >
                    <option value="" disabled className="bg-white text-foreground">Select province</option>
                    {PROVINCES.map((p) => <option key={p} value={p} className="bg-white text-foreground">{p}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="district" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">District</Label>
                  <select 
                    id="district" 
                    name="district" 
                    className="flex h-14 w-full rounded-2xl border-2 border-input bg-neutral-50/50 px-4 py-2 text-base font-medium transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 appearance-none text-foreground"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-white text-foreground">Select district</option>
                    {selectedProvince && PROVINCE_DISTRICTS[selectedProvince].map((d) => <option key={d} value={d} className="bg-white text-foreground">{d}</option>)}
                  </select>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label htmlFor="category" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">Category</Label>
                  <select 
                    id="category" 
                    name="category" 
                    className="flex h-14 w-full rounded-2xl border-2 border-input bg-neutral-50/50 px-4 py-2 text-base font-medium transition-all focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 appearance-none text-foreground"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled className="bg-white text-foreground">Select Category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c} className="bg-white text-foreground">{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-secondary rounded-full" />
                <h3 className="text-xl font-black text-foreground tracking-tight">Performance Data</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label htmlFor="iq_marks" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">IQ Marks</Label>
                  <Input id="iq_marks" name="iq_marks" type="number" min="0" max="100" placeholder="0-100" required className="rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50 h-14" />
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="gk_marks" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-1">GK Marks</Label>
                  <Input id="gk_marks" name="gk_marks" type="number" min="0" max="100" placeholder="0-100" required className="rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50 h-14" />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full text-xl h-16 rounded-2xl font-black shadow-lg shadow-primary/20 hover:scale-[1.02] transform transition-all" disabled={loading}>
              {loading ? "Processing..." : "Submit Marks"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
