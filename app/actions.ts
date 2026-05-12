"use server";

import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
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
    const iq_marks = parseInt(formData.get("iq_marks") as string, 10);
    const gk_marks = parseInt(formData.get("gk_marks") as string, 10);
    const language = formData.get("language") as string || "Sinhala";
    const whatsapp = formData.get("whatsapp") as string;

    // Check system config
    const config = await getSystemConfig();
    if (!config.marks_entry) {
      return { success: false, error: "Marks submission is currently disabled by the administrator." };
    }

    const isValid = (marks: number) => marks >= 2 && marks <= 100 && marks % 2 === 0;

    if (!nic || !name || !province || !district || subjects.length === 0 || isNaN(iq_marks) || isNaN(gk_marks) || !whatsapp) {
      return { success: false, error: "All fields are required including WhatsApp number." };
    }

    if (!isValid(iq_marks) || !isValid(gk_marks)) {
      return { success: false, error: "ඇතුලත්කල ලකුණ වලංගු ලකුනක් නොවේ. නැවත උත්සහා කරන්න." };
    }

    const total_marks = iq_marks + gk_marks;

    // Fetch active exam date from config
    const { data: configData } = await supabaseAdmin.from("system_config").select("value").eq("key", "active_exam_date").single();
    const activeExamDate = configData?.value || new Date().toISOString().split('T')[0];

    // Use a single batch insert for all subjects
    const { error } = await supabaseAdmin.from("students_results").insert(
      subjects.map(s => ({
        nic,
        name,
        province,
        district,
        category,
        subject: s,
        iq_marks,
        gk_marks,
        total_marks,
        exam_date: activeExamDate,
        language,
        whatsapp
      }))
    );

    if (error) {
      if (error.code === '23505') {
        return { 
          success: false, 
          error: "Submission failed. Either the NIC is already used for one of these subjects, or the database still has a unique constraint on the NIC number (refer to supabase/schema.sql for the required update)." 
        };
      }
      console.error(error);
      return { success: false, error: "Database error. Failed to submit marks." };
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function searchStudent(nic: string, examDate?: string): Promise<{ success: boolean; data?: StudentResult[]; error?: string }> {
  try {
    if (!nic) {
      return { success: false, error: "NIC is required." };
    }

    // Check system config
    const config = await getSystemConfig();
    if (!config.view_rankings) {
      return { success: false, error: "Result viewing is currently disabled by the administrator." };
    }

    const activeDate = config.active_exam_date;
    let effectiveDate = activeDate;

    // If a different date is requested, check if it's an admin
    if (examDate && examDate !== activeDate) {
      const cookieStore = await cookies();
      if (cookieStore.get("admin_token")) {
        effectiveDate = examDate;
      }
    }

    const { data, error } = await supabaseAdmin
      .from("students_results")
      .select("*")
      .eq("nic", nic)
      .eq("exam_date", effectiveDate);

    if (error) {
      console.error(error);
      return { success: false, error: "Error fetching student result." };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Result not found for this NIC on the active exam date." };
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
  scope: 'subject' | 'general' | 'category' = 'subject',
  ignoreLanguage: boolean = false
) {
  try {
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students_results")
      .select("*")
      .eq("id", resultId)
      .single();
 
    if (studentError || !student) {
      return { rank: null, totalCandidates: 0, error: "Student not found" };
    }
 
    const { data: config } = await supabaseAdmin.from("system_config").select("*");
    const systemRankingMode = config?.find(c => c.key === "ranking_mode")?.value || "general";
 
    const effectiveRankingMode = scope === 'category' ? 'categorized' : (scope === 'general' ? 'general' : systemRankingMode);

    if (scope === 'subject') {
      // Legacy logic remains correct for subject-specific (one row per student per subject)
      let query = supabaseAdmin.from("students_results").select("id", { count: 'exact', head: true });
      query = query.eq('subject', student.subject);
      if (student.exam_date) query = query.eq('exam_date', student.exam_date);
      
      if (type === 'province') query = query.eq('province', student.province);
      else if (type === 'district') query = query.eq('district', student.district);
      if (effectiveRankingMode === 'categorized') query = query.eq('category', student.category);
      if (student.language && !ignoreLanguage) query = query.eq('language', student.language);

      const { count: totalCandidates } = await query;

      let higherScoresQuery = supabaseAdmin
        .from("students_results")
        .select("id", { count: 'exact', head: true })
        .eq('subject', student.subject)
        .gt(sortBy, student[sortBy]);
      
      if (student.exam_date) higherScoresQuery = higherScoresQuery.eq('exam_date', student.exam_date);

      if (type === 'province') higherScoresQuery = higherScoresQuery.eq('province', student.province);
      else if (type === 'district') higherScoresQuery = higherScoresQuery.eq('district', student.district);
      if (effectiveRankingMode === 'categorized') higherScoresQuery = higherScoresQuery.eq('category', student.category);
      if (student.language && !ignoreLanguage) higherScoresQuery = higherScoresQuery.eq('language', student.language);

      const { count: higherScoresCount } = await higherScoresQuery;
      const rank = (higherScoresCount || 0) + 1;
      return { rank, totalCandidates: totalCandidates || 0 };
    } else {
      // OVERALL RANK (Category scope) - Must count UNIQUE NICs
      // Fetch all candidate records for the pool
      let poolData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let finished = false;

      while (!finished) {
        let pageQuery = supabaseAdmin
          .from("students_results")
          .select("nic, " + sortBy)
          .range(from, from + pageSize - 1);

        if (type === 'province') pageQuery = pageQuery.eq('province', student.province);
        else if (type === 'district') pageQuery = pageQuery.eq('district', student.district);

        if (student.exam_date) pageQuery = pageQuery.eq('exam_date', student.exam_date);

        if (effectiveRankingMode === 'categorized') {
          pageQuery = pageQuery.eq('category', student.category);
        }

        if (student.language && !ignoreLanguage) {
          pageQuery = pageQuery.eq('language', student.language);
        }

        const { data, error } = await pageQuery;
        if (error) throw error;
        if (!data || data.length === 0) {
          finished = true;
        } else {
          poolData = poolData.concat(data);
          if (data.length < pageSize) finished = true;
          else from += pageSize;
        }
      }

      // Group by NIC to get unique candidates and their best score in this sort category
      const uniquePool = new Map<string, number>();
      (poolData as any[]).forEach(row => {
        const currentScore = row[sortBy];
        const existingScore = uniquePool.get(row.nic);
        if (existingScore === undefined || currentScore > existingScore) {
          uniquePool.set(row.nic, currentScore);
        }
      });

      const totalCandidates = uniquePool.size;
      const studentScore = student[sortBy];
      
      let higherCount = 0;
      uniquePool.forEach((score) => {
        if (score > studentScore) {
          higherCount++;
        }
      });

      return { rank: higherCount + 1, totalCandidates };
    }
  } catch (error: any) {
    return { rank: null, totalCandidates: 0, error: error.message };
  }
}

export async function getCategoryPeakMarks(category: string, province?: string, district?: string, examDate?: string) {
  try {
    const config = await getSystemConfig();
    const activeDate = config.active_exam_date;
    let effectiveDate = activeDate;

    if (examDate && examDate !== activeDate) {
      const cookieStore = await cookies();
      if (cookieStore.get("admin_token")) {
        effectiveDate = examDate;
      }
    }

    let query = supabaseAdmin
      .from("students_results")
      .select("iq_marks, gk_marks")
      .eq("category", category)
      .eq("exam_date", effectiveDate);
    
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

export async function getStudentCandidateStats(resultId: string) {
  try {
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students_results")
      .select("*")
      .eq("id", resultId)
      .single();

    if (studentError || !student) {
      return { success: false, error: "Student not found" };
    }

    const { subject, province, district } = student;

    // Helper for counts
    const getCount = async (filters: { subject?: string; province?: string; district?: string; examDate?: string }) => {
      let query = supabaseAdmin.from("students_results").select("id", { count: 'exact', head: true });
      if (filters.subject) query = query.eq('subject', filters.subject);
      if (filters.province) query = query.eq('province', filters.province);
      if (filters.district) query = query.eq('district', filters.district);
      if (filters.examDate) query = query.eq('exam_date', filters.examDate);
      // Stats could be filtered by language too if needed
      const { count } = await query;
      return count || 0;
    };

    // Main Category Counts (Island, Province, District)
    const [catIsland, catProvince, catDistrict] = await Promise.all([
      getCount({}),
      getCount({ province }),
      getCount({ district })
    ]);

    // Subject Counts (Island, Province, District)
    const [subIsland, subProvince, subDistrict] = await Promise.all([
      getCount({ subject }),
      getCount({ subject, province }),
      getCount({ subject, district })
    ]);

    return {
      success: true,
      categoryStats: { island: catIsland, province: catProvince, district: catDistrict },
      subjectStats: { island: subIsland, province: subProvince, district: subDistrict }
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getGlobalCandidateStats(subject: string, examDate?: string) {
  try {
    const config = await getSystemConfig();
    const activeDate = config.active_exam_date;
    let effectiveDate = activeDate;

    if (examDate && examDate !== activeDate) {
      const cookieStore = await cookies();
      if (cookieStore.get("admin_token")) {
        effectiveDate = examDate;
      }
    }

    // Helper for counts
    const getCount = async (filters: { subject?: string; examDate?: string }) => {
      let query = supabaseAdmin.from("students_results").select("id", { count: 'exact', head: true });
      if (filters.subject) query = query.eq('subject', filters.subject);
      query = query.eq('exam_date', filters.examDate || effectiveDate);
      const { count } = await query;
      return count || 0;
    };

    const catTotal = await getCount({ examDate: effectiveDate });
    const subTotal = await getCount({ subject, examDate: effectiveDate });

    return {
      success: true,
      categoryTotal: catTotal,
      subjectTotal: subTotal
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getAdminRankings(
  params: {
    subject?: string;
    province?: string;
    district?: string;
    category?: string;
    sortBy?: "total_marks" | "iq_marks" | "gk_marks";
    examDate?: string;
    language?: string;
  }
) {
  try {
    const config = await getSystemConfig();
    const activeDate = config.active_exam_date;
    let effectiveDate = activeDate;

    // If a different date is requested, check if it's an admin
    if (params.examDate && params.examDate !== activeDate) {
      const cookieStore = await cookies();
      if (cookieStore.get("admin_token")) {
        effectiveDate = params.examDate;
      }
    }

    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let finished = false;

    while (!finished) {
      let pageQuery = supabaseAdmin.from("students_results").select("id, nic, name, province, district, category, subject, iq_marks, gk_marks, total_marks, language, created_at, exam_date");

      if (params.subject) pageQuery = pageQuery.eq("subject", params.subject);
      if (params.province) pageQuery = pageQuery.eq("province", params.province);
      if (params.district) pageQuery = pageQuery.eq("district", params.district);
      if (params.category) pageQuery = pageQuery.eq("category", params.category);
      if (params.language) pageQuery = pageQuery.eq("language", params.language);
      
      // Always filter by the effective date
      pageQuery = pageQuery.eq("exam_date", effectiveDate);

      const sortColumn = params.sortBy || "total_marks";
      pageQuery = pageQuery.order(sortColumn, { ascending: false }).range(from, from + pageSize - 1);

      const { data, error } = await pageQuery;

      if (error) {
        console.error(error);
        return { success: false, error: error.message, data: [] };
      }

      if (!data || data.length === 0) {
        finished = true;
      } else {
        allData = allData.concat(data);
        if (data.length < pageSize) finished = true;
        else from += pageSize;
      }
      
      // Safety cap
      if (allData.length >= 200000) finished = true;
    }

    return { success: true, data: allData as StudentResult[] };
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
      maxAge: 60 * 60 * 24 // 1 day
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

/** 
 * ADMIN EXCLUSIVE ACTIONS 
 * (In a real app, these should check for admin_token cookie again or use supabaseAdmin Auth)
 */

export async function deleteAllData() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized" };

  try {
    const { error } = await supabaseAdmin
      .from("students_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all in supabaseAdmin without RLS issues sometimes

    if (error) return { success: false, error: error.message };
    
    revalidatePath("/");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getSystemConfig() {
  const { data, error } = await supabaseAdmin
    .from("system_config")
    .select("*");
  
  if (error) return { 
    marks_entry: true, 
    view_rankings: true, 
    ranking_mode: "general",
    active_exam_date: new Date().toISOString().split('T')[0]
  };
  
  const configMap: Record<string, boolean> = {};
  data.forEach(item => {
    configMap[item.key] = item.value === "true";
  });
  
  return {
    marks_entry: configMap["marks_entry_enabled"] ?? true,
    view_rankings: configMap["view_rankings_enabled"] ?? true,
    ranking_mode: data.find(c => c.key === "ranking_mode")?.value || "general",
    active_exam_date: data.find(c => c.key === "active_exam_date")?.value || new Date().toISOString().split('T')[0]
  };
}

export async function getUserPerformance(nic: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from("students_results")
      .select("iq_marks, gk_marks, total_marks, exam_date, subject")
      .eq("nic", nic)
      .order("exam_date", { ascending: true });

    if (error) throw error;

    // Group by exam_date and take average or max if user entered multiple subjects on same date
    // Actually, usually it's one set of marks for all subjects on that date in this app?
    // The current UI sends multiple subjects with same IQ/GK marks.
    // So for the chart, we just need unique (nic, exam_date) scores.
    const performanceMap = new Map<string, { iq: number, gk: number, total: number }>();
    data?.forEach(row => {
      performanceMap.set(row.exam_date, { iq: row.iq_marks, gk: row.gk_marks, total: row.total_marks });
    });

    return { 
      success: true, 
      data: Array.from(performanceMap.entries()).map(([date, marks]) => ({
        date,
        ...marks
      }))
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function toggleConfig(key: "marks_entry_enabled" | "view_rankings_enabled" | "ranking_mode" | "active_exam_date", currentValue: any) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized" };

  let newValue: string;
  if (key === "ranking_mode") {
    newValue = currentValue === "general" ? "categorized" : "general";
  } else if (key === "active_exam_date") {
    newValue = currentValue; // currentValue is the new date string in this case
  } else {
    newValue = (!currentValue).toString();
  }

  const { error } = await supabaseAdmin
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
    const { error } = await supabaseAdmin
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

export async function getOverallCandidateCount(examDate?: string) {
  try {
    const config = await getSystemConfig();
    const activeDate = config.active_exam_date;
    let effectiveDate = activeDate;

    if (examDate && examDate !== activeDate) {
      const cookieStore = await cookies();
      if (cookieStore.get("admin_token")) {
        effectiveDate = examDate;
      }
    }

    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let finished = false;

    while (!finished) {
      let query = supabaseAdmin
        .from("students_results")
        .select("nic")
        .eq("exam_date", effectiveDate)
        .range(from, from + pageSize - 1);
      
      const { data, error } = await query;
      
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

export async function getAdminContacts() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized", data: [] };

  try {
    const config = await getSystemConfig();
    const activeDate = config.active_exam_date;

    const { data, error } = await supabaseAdmin
      .from("students_results")
      .select("id, nic, whatsapp, name, total_marks, iq_marks, gk_marks")
      .eq("exam_date", activeDate)
      .order("total_marks", { ascending: false });

    if (error) throw error;

    // Group by NIC to get unique contacts (highest marks first since we ordered by total_marks)
    const contactsMap = new Map<string, { id: string, nic: string, whatsapp: string, name: string, total_marks: number, iq_marks: number, gk_marks: number, ids: string[] }>();
    data?.forEach(row => {
      if (row.whatsapp) {
        if (!contactsMap.has(row.nic)) {
          contactsMap.set(row.nic, { 
            id: row.id,
            nic: row.nic, 
            whatsapp: row.whatsapp, 
            name: row.name, 
            total_marks: row.total_marks,
            iq_marks: row.iq_marks,
            gk_marks: row.gk_marks,
            ids: [row.id]
          });
        } else {
          contactsMap.get(row.nic)?.ids.push(row.id);
        }
      }
    });

    return { success: true, data: Array.from(contactsMap.values()) };
  } catch (err: any) {
    return { success: false, error: err.message, data: [] };
  }
}
