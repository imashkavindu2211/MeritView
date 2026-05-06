"use client";

import { useEffect, useState } from "react";
import { getAdminContacts, deleteStudent, verifyAdminPassword } from "@/app/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MessageCircle, User, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminContacts() {
  const [contacts, setContacts] = useState<{ nic: string, whatsapp: string, name: string, total_marks: number, iq_marks: number, gk_marks: number, ids: string[], rank?: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const result = await getAdminContacts();
      if (result.success && result.data) {
        // Calculate competition rank
        let lastScore = -1;
        let lastRank = 0;
        const ranked = result.data.map((c: any, i: number) => {
          if (c.total_marks !== lastScore) {
            lastRank = i + 1;
            lastScore = c.total_marks;
          }
          return { ...c, rank: lastRank };
        });
        setContacts(ranked);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  async function handleDeleteSingle(ids: string[], name: string) {
    if (!confirm(`Are you sure you want to delete all records for ${name}? This action cannot be undone.`)) {
      return;
    }
    
    const password = prompt("ADMIN AUTHORIZATION REQUIRED: Please enter the admin password to confirm deletion of this candidate's history:");
    if (!password) return;
    
    setLoading(true);
    const isValid = await verifyAdminPassword(password);
    if (!isValid) {
      alert("Unauthorized: Incorrect admin password.");
      setLoading(false);
      return;
    }

    const results = await Promise.all(ids.map(id => deleteStudent(id)));
    const allSuccessful = results.every(r => r.success);
    
    if (allSuccessful) {
      const result = await getAdminContacts();
      if (result.success && result.data) {
        let lastScore = -1;
        let lastRank = 0;
        const ranked = result.data.map((c: any, i: number) => {
          if (c.total_marks !== lastScore) {
            lastRank = i + 1;
            lastScore = c.total_marks;
          }
          return { ...c, rank: lastRank };
        });
        setContacts(ranked);
      }
    } else {
      alert("Error deleting some student records.");
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-6">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-primary text-white p-3 rounded-2xl shadow-lg">
          <MessageCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight">WhatsApp Contacts</h1>
          <p className="text-muted-foreground font-medium">Candidate NIC and WhatsApp directory</p>
        </div>
      </div>

      <Card className="border-0 shadow-2xl shadow-primary/10 bg-white rounded-[3rem] overflow-hidden ring-1 ring-primary/5">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-32 gap-6">
              <Loader2 className="w-16 h-16 animate-spin text-primary opacity-20" />
              <p className="font-black text-muted-foreground uppercase tracking-widest text-xs">Loading contacts...</p>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center p-32">
              <p className="text-xl font-bold text-muted-foreground">No contacts found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-neutral-50/50">
                  <TableRow className="border-b-2">
                    <TableHead className="font-black uppercase tracking-widest text-[10px] py-6 pl-10 w-20 text-center">Action</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] w-20 text-center">Rank</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">Candidate Name</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">NIC Number</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px]">WhatsApp</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">IQ</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-right">GK</TableHead>
                    <TableHead className="font-black uppercase tracking-widest text-[10px] pr-10 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.nic} className="hover:bg-primary/5 transition-all border-b last:border-0">
                      <TableCell className="py-6 pl-10 text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteSingle(contact.ids, contact.name)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-black text-primary text-sm tabular-nums">#{contact.rank}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User className="w-5 h-5" />
                          </div>
                          <p className="font-black text-foreground tracking-tight">{contact.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-muted-foreground tabular-nums">{contact.nic}</p>
                      </TableCell>
                      <TableCell>
                        <a 
                          href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-green-600 transition-all active:scale-95"
                        >
                          <MessageCircle className="w-3 h-3" />
                          {contact.whatsapp}
                        </a>
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-muted-foreground">{contact.iq_marks}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-muted-foreground">{contact.gk_marks}</TableCell>
                      <TableCell className="pr-10 text-right">
                        <span className="inline-block py-2 px-4 rounded-xl bg-primary/10 text-primary font-black tabular-nums">
                          {contact.total_marks}
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

      <div className="mt-10 flex justify-center">
        <Button variant="ghost" onClick={() => window.history.back()} className="font-black uppercase tracking-widest text-xs">
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
