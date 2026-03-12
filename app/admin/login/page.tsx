"use client";

import { useState } from "react";
import { adminLogin } from "@/app/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await adminLogin(formData);

    setLoading(false);

    if (result.success) {
      router.push("/admin");
    } else {
      setError(result.error || "Login Failed");
    }
  }

  return (
    <div className="w-full max-w-xl mx-auto py-20 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-0 shadow-[0_32px_64px_-16px_rgba(210,230,250,0.5)] rounded-[2.5rem] bg-white overflow-hidden ring-1 ring-primary/5">
        <div className="h-3 bg-gradient-to-r from-secondary to-primary w-full" />
        <CardHeader className="text-center space-y-4 pb-10 pt-12 px-8">
          <div className="bg-secondary/50 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-secondary-foreground shadow-inner">
            <Lock className="w-10 h-10" />
          </div>
          <CardTitle className="text-4xl font-black text-foreground tracking-tight underline decoration-secondary/30 underline-offset-8 italic">Admin Gateway</CardTitle>
          <CardDescription className="text-lg font-medium text-muted-foreground pt-2">
            Authorized personnel only. Enter credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-10 pb-16">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2">System Identifier</Label>
              <Input id="username" name="username" required className="h-16 text-xl rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50" />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wider text-muted-foreground ml-2">Security Key</Label>
              <Input id="password" name="password" type="password" required className="h-16 text-xl rounded-2xl border-2 focus:border-primary/50 bg-neutral-50/50" />
            </div>

            {error && (
              <div className="p-5 rounded-2xl bg-destructive text-destructive-foreground flex items-center gap-4 shadow-lg shadow-destructive/20">
                <AlertCircle className="w-8 h-8 shrink-0" />
                <div>
                   <p className="text-lg uppercase font-black leading-none">Security Breach</p>
                   <p className="text-sm font-bold opacity-90 mt-1">{error}</p>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full h-16 text-xl rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transform transition-all bg-foreground text-background hover:bg-foreground/90" disabled={loading}>
              {loading ? "Verifying..." : "Initialize Session"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="mt-10 flex items-center justify-center gap-2 text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-bold uppercase tracking-widest">Secure Environment Active</span>
      </div>
    </div>
  );
}
