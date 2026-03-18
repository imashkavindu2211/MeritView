"use client";

import { useState } from "react";
import { searchStudent } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

export default function CheckResults() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="w-full max-w-xl mx-auto py-20 px-4 animate-in fade-in zoom-in-95 duration-700">
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
      <p className="text-center mt-10 text-muted-foreground font-medium">
        Problems accessing? Contact support.
      </p>
    </div>
  );
}
