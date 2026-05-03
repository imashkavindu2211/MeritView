"use server";

import { supabase } from "@/lib/supabase/client";
import { StudentResult } from "@/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function submitMarks(formData: FormData) {
  try {
    const nic = formData.get("nic") as string;
    const name = formData.get("name") as string;
    const province = formData.get("province") as string;
    const district = formData.get("district") as string;
    const category = formData.get("category") as string || "Open";
    const subjects = formData.getAll("subject") as string[];
    
    const { data: configRows } = await supabase.from("system_config").select("*");
    const iqEnabled = configRows?.find(c => c.key === "iq_marks_enabled")?.value !== "false";

    if (!nic || !name || !province || !district || subjects.length === 0) {
      return { success: false, error: "All student information fields are required." };
    }

    const isValid = (marks: number) => marks >= 0 && marks <= 100 && marks % 2 === 0;

    const paperEntries: { paper: number, gk: number, iq: number, total: number }[] = [];
    
    for (let i = 1; i <= 20; i++) {
      const gkVal = formData.get(`gk_paper_${i}`);
      const iqVal = formData.get(`iq_paper_${i}`);
      
      if (gkVal && gkVal !== "") {
        const gk = parseInt(gkVal as string, 10);
        const iq = iqEnabled && iqVal ? parseInt(iqVal as string, 10) : 0;
        
        if (!isValid(gk) || (iqEnabled && iqVal && !isValid(iq))) {
           return { success: false, error: `Invalid marks for Paper ${i}. Marks must be multiples of 2 (0-100).` };
        }
        
        paperEntries.push({
          paper: i,
          gk,
          iq,
          total: gk + iq
        });
      }
    }

    if (paperEntries.length === 0) {
      return { success: false, error: "Please enter marks for at least one paper." };
    }

    // First, delete any existing entries for this NIC and subjects to avoid conflicts
    await supabase.from("students_results")
      .delete()
      .eq("nic", nic)
      .in("subject", subjects);

    const insertRows: any[] = [];
    subjects.forEach(s => {
      paperEntries.forEach(p => {
        insertRows.push({
          nic,
          name,
          province,
          district,
          category,
          subject: s,
          iq_marks: p.iq,
          gk_marks: p.gk,
          total_marks: p.total,
          paper_number: p.paper,
          created_at: new Date().toISOString(),
          // Use a unique timestamp for each paper to avoid constraint violations
          exam_date: new Date(Date.now() + p.paper * 1000).toISOString()
        });
      });
    });

    const { error } = await supabase.from("students_results").insert(insertRows);

    if (error) {
      console.error("Database Error:", error);
      return { 
        success: false, 
        error: `Database Error [${error.code}]: ${error.message}${error.hint ? ' - ' + error.hint : ''}` 
      };
    }

    revalidatePath("/admin");
    revalidatePath("/leaderboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function searchStudent(nic: string): Promise<{ success: boolean; data?: StudentResult[]; error?: string }> {
  try {
    if (!nic) {
      return { success: false, error: "NIC is required." };
    }

    const { data, error } = await supabase
      .from("students_results")
      .select("*")
      .eq("nic", nic);

    if (error) {
      console.error(error);
      return { success: false, error: "Error fetching student result." };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Result not found for this NIC." };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function getStudentRank(
  resultId: string, 
  type: 'island' | 'province' | 'district',
  sortBy: 'total_marks' | 'iq_marks' | 'gk_marks' = 'total_marks',
  scope: 'subject' | 'general' | 'category' = 'subject'
) {
  try {
    const { data: student, error: studentError } = await supabase
      .from("students_results")
      .select("*")
      .eq("id", resultId)
      .single();
 
    if (studentError || !student) {
      return { rank: null, totalCandidates: 0, error: "Student not found" };
    }
 
    const { data: config } = await supabase.from("system_config").select("*");
    const systemRankingMode = config?.find(c => c.key === "ranking_mode")?.value || "general";
    const effectiveRankingMode = scope === 'category' ? 'categorized' : (scope === 'general' ? 'general' : systemRankingMode);

    let poolData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let finished = false;

    while (!finished) {
      let pageQuery = supabase
        .from("students_results")
        .select("nic, iq_marks, gk_marks, total_marks, subject, category, province, district")
        .range(from, from + pageSize - 1);

      if (scope === 'subject') pageQuery = pageQuery.eq('subject', student.subject);
      if (type === 'province') pageQuery = pageQuery.eq('province', student.province);
      else if (type === 'district') pageQuery = pageQuery.eq('district', student.district);
      if (effectiveRankingMode === 'categorized') pageQuery = pageQuery.eq('category', student.category);

      const { data, error } = await pageQuery;
      if (error) throw error;
      if (!data || data.length === 0) finished = true;
      else {
        poolData = poolData.concat(data);
        if (data.length < pageSize) finished = true;
        else from += pageSize;
      }
    }

    const uniquePool = new Map<string, number>();
    poolData.forEach(row => {
      const existing = uniquePool.get(row.nic) || 0;
      uniquePool.set(row.nic, existing + (row[sortBy] || 0));
    });

    const studentAggregateScore = (poolData as any[])
      .filter(r => r.nic === student.nic && (scope !== 'subject' || r.subject === student.subject))
      .reduce((sum, r) => sum + (r[sortBy] || 0), 0);

    let higherCount = 0;
    uniquePool.forEach(score => {
      if (score > studentAggregateScore) higherCount++;
    });

    return { rank: higherCount + 1, totalCandidates: uniquePool.size };
  } catch (error: any) {
    return { rank: null, totalCandidates: 0, error: error.message };
  }
}

export async function getCategoryPeakMarks(category: string, province?: string, district?: string) {
  try {
    let query = supabase.from("students_results").select("iq_marks, gk_marks").eq("category", category);
    if (province) query = query.eq("province", province);
    if (district) query = query.eq("district", district);

    const { data, error } = await query;
    if (error) throw error;

    let maxIQ = 0;
    let maxGK = 0;

    data?.forEach(row => {
      if (row.iq_marks > maxIQ) maxIQ = row.iq_marks;
      if (row.gk_marks > maxGK) maxGK = row.gk_marks;
    });

    return { success: true, maxIQ, maxGK };
  } catch (err: any) {
    return { success: false, error: err.message, maxIQ: 0, maxGK: 0 };
  }
}

export async function getAdminRankings(params: { subject?: string; province?: string; district?: string; category?: string; sortBy?: "total_marks" | "iq_marks" | "gk_marks" }) {
  try {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let finished = false;

    while (!finished) {
      let query = supabase
        .from("students_results")
        .select("*")
        .range(from, from + pageSize - 1);

      if (params.subject) query = query.eq("subject", params.subject);
      if (params.province) query = query.eq("province", params.province);
      if (params.district) query = query.eq("district", params.district);
      if (params.category) query = query.eq("category", params.category);

      const { data, error } = await query;
      if (error) throw error;
      
      if (!data || data.length === 0) {
        finished = true;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) finished = true;
        else from += pageSize;
      }
    }

    const candidatesMap = new Map<string, StudentResult & { total_aggregate: number, iq_aggregate: number, gk_aggregate: number, papers_count: number, allIds: string[], subjects: string[] }>();

    allData.forEach((row: any) => {
      if (!candidatesMap.has(row.nic)) {
        candidatesMap.set(row.nic, { 
          ...row, 
          total_aggregate: 0, 
          iq_aggregate: 0, 
          gk_aggregate: 0, 
          papers_count: 0,
          allIds: [],
          subjects: []
        });
      }
      const c = candidatesMap.get(row.nic)!;
      c.total_aggregate += row.total_marks;
      c.iq_aggregate += row.iq_marks;
      c.gk_aggregate += row.gk_marks;
      c.papers_count += 1;
      if (!c.allIds.includes(row.id)) c.allIds.push(row.id);
      if (!c.subjects.includes(row.subject)) c.subjects.push(row.subject);
    });

    const aggregatedData = Array.from(candidatesMap.values()).map(c => ({
      ...c,
      total_marks: c.total_aggregate,
      iq_marks: c.iq_aggregate,
      gk_marks: c.gk_aggregate
    }));

    const sortKey = params.sortBy || "total_marks";
    aggregatedData.sort((a: any, b: any) => b[sortKey] - a[sortKey]);

    return { success: true, data: aggregatedData as any[] };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] };
  }
}

export async function adminLogin(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  const validUser = process.env.ADMIN_USERNAME || "admin";
  const validPass = process.env.ADMIN_PASSWORD || "admin123";

  if (username === validUser && password === validPass) {
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 
    });
    return { success: true };
  }
  return { success: false, error: "Invalid credentials" };
}

export async function verifyAdminPassword(password: string) {
  const validPass = process.env.ADMIN_PASSWORD || "admin123";
  return password === validPass;
}

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return { success: true };
}

export async function deleteAllData() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized" };

  try {
    const { error } = await supabase
      .from("students_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) return { success: false, error: error.message };
    
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSystemConfig() {
  const { data, error } = await supabase
    .from("system_config")
    .select("*");
  
  if (error) return { 
    marks_entry: true, 
    view_rankings: true, 
    iq_marks_enabled: true,
    ranking_mode: "general",
    active_paper_number: "1"
  };
  
  const configMap: Record<string, string> = {};
  data.forEach(item => {
    configMap[item.key] = item.value;
  });
  
  return {
    marks_entry: configMap["marks_entry_enabled"] !== "false",
    view_rankings: configMap["view_rankings_enabled"] !== "false",
    iq_marks_enabled: configMap["iq_marks_enabled"] !== "false",
    ranking_mode: configMap["ranking_mode"] || "general",
    active_paper_number: configMap["active_paper_number"] || "1"
  };
}

export async function getUserPerformance(nic: string) {
  try {
    const { data, error } = await supabase
      .from("students_results")
      .select("iq_marks, gk_marks, total_marks, paper_number, subject")
      .eq("nic", nic)
      .order("paper_number", { ascending: true });

    if (error) throw error;

    const performanceMap = new Map<number, { iq: number, gk: number, total: number }>();
    data?.forEach(row => {
      performanceMap.set(row.paper_number, { iq: row.iq_marks, gk: row.gk_marks, total: row.total_marks });
    });

    return { 
      success: true, 
      data: Array.from(performanceMap.entries()).map(([paper, marks]) => ({
        paper: `Paper ${paper}`,
        ...marks
      }))
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleConfig(key: "marks_entry_enabled" | "view_rankings_enabled" | "ranking_mode" | "active_paper_number" | "iq_marks_enabled", currentValue: any) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized" };

  let newValue: string;
  if (key === "ranking_mode") {
    newValue = currentValue === "general" ? "categorized" : "general";
  } else if (key === "active_paper_number") {
    newValue = currentValue.toString();
  } else {
    newValue = (!currentValue).toString();
  }

  const { error } = await supabase
    .from("system_config")
    .upsert({ key: key, value: newValue }, { onConflict: 'key' });

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/enter-marks");
  revalidatePath("/result");
  return { success: true };
}

export async function deleteStudent(id: string) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized" };

  try {
    const { error } = await supabase
      .from("students_results")
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getOverallCandidateCount() {
  try {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let finished = false;

    while (!finished) {
      const { data, error } = await supabase
        .from("students_results")
        .select("nic")
        .range(from, from + pageSize - 1);
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        finished = true;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) finished = true;
        else from += pageSize;
      }

      if (allData.length >= 200000) finished = true;
    }
    
    const uniqueNics = new Set(allData.map(item => item.nic));
    return { success: true, count: uniqueNics.size };
  } catch (err: any) {
    return { success: false, error: err.message, count: 0 };
  }
}
