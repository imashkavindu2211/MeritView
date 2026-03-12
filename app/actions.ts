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
    const category = formData.get("category") as "Open" | "DO";
    const iq_marks = parseInt(formData.get("iq_marks") as string, 10);
    const gk_marks = parseInt(formData.get("gk_marks") as string, 10);

    // Check system config
    const config = await getSystemConfig();
    if (!config.marks_entry) {
      return { success: false, error: "Marks submission is currently disabled by the administrator." };
    }

    if (!nic || !name || !province || !district || !category || isNaN(iq_marks) || isNaN(gk_marks)) {
      return { success: false, error: "All fields are required and marks must be valid numbers." };
    }

    const total_marks = iq_marks + gk_marks;

    const { error } = await supabase.from("students_results").insert({
      nic,
      name,
      province,
      district,
      category,
      iq_marks,
      gk_marks,
      total_marks,
    });

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: "A student with this NIC has already been entered." };
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

export async function searchStudent(nic: string): Promise<{ success: boolean; data?: StudentResult; error?: string }> {
  try {
    if (!nic) {
      return { success: false, error: "NIC is required." };
    }

    // Check system config
    const config = await getSystemConfig();
    if (!config.view_rankings) {
      return { success: false, error: "Result viewing is currently disabled by the administrator." };
    }

    const { data, error } = await supabase
      .from("students_results")
      .select("*")
      .eq("nic", nic)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: "Result not found for this NIC." };
      }
      console.error(error);
      return { success: false, error: "Error fetching student result." };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || "Something went wrong" };
  }
}

export async function getStudentRank(nic: string, type: 'island' | 'province' | 'district') {
  try {
    const { data: student, error: studentError } = await supabase
      .from("students_results")
      .select("*")
      .eq("nic", nic)
      .single();

    if (studentError || !student) {
      return { rank: null, totalCandidates: 0, error: "Student not found" };
    }

    let query = supabase.from("students_results").select("id", { count: 'exact', head: true });
    
    if (type === 'province') {
      query = query.eq('province', student.province);
    } else if (type === 'district') {
      query = query.eq('district', student.district);
    }

    const { count: totalCandidates, error: countError } = await query;

    if (countError) {
      return { rank: null, totalCandidates: 0, error: countError.message };
    }

    let higherScoresQuery = supabase
      .from("students_results")
      .select("id", { count: 'exact', head: true })
      .gt('total_marks', student.total_marks);

    if (type === 'province') {
      higherScoresQuery = higherScoresQuery.eq('province', student.province);
    } else if (type === 'district') {
      higherScoresQuery = higherScoresQuery.eq('district', student.district);
    }

    const { count: higherScoresCount, error: rankError } = await higherScoresQuery;

    if (rankError) {
      return { rank: null, totalCandidates: totalCandidates || 0, error: rankError.message };
    }

    // Rank is 1 + (number of people with strictly higher marks)
    const rank = (higherScoresCount || 0) + 1;

    return { rank, totalCandidates: totalCandidates || 0 };
  } catch (error: any) {
    return { rank: null, totalCandidates: 0, error: error.message };
  }
}

export async function getAdminRankings(
  params: {
    category?: "Open" | "DO";
    province?: string;
    district?: string;
    sortBy?: "total_marks" | "iq_marks" | "gk_marks";
  }
) {
  try {
    let query = supabase.from("students_results").select("*");

    if (params.category) query = query.eq("category", params.category);
    if (params.province) query = query.eq("province", params.province);
    if (params.district) query = query.eq("district", params.district);

    const sortColumn = params.sortBy || "total_marks";
    query = query.order(sortColumn, { ascending: false });

    // In a real app we might paginate
    const { data, error } = await query.limit(1000);

    if (error) {
      console.error(error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data as StudentResult[] };
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

export async function adminLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_token");
  return { success: true };
}

/** 
 * ADMIN EXCLUSIVE ACTIONS 
 * (In a real app, these should check for admin_token cookie again or use Supabase Auth)
 */

export async function deleteAllData() {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized" };

  try {
    const { error } = await supabase
      .from("students_results")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all in Supabase without RLS issues sometimes

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
  
  if (error) return { marks_entry: true, view_rankings: true };
  
  const configMap: Record<string, boolean> = {};
  data.forEach(item => {
    configMap[item.key] = item.value === "true";
  });
  
  return {
    marks_entry: configMap["marks_entry_enabled"] ?? true,
    view_rankings: configMap["view_rankings_enabled"] ?? true
  };
}

export async function toggleConfig(key: "marks_entry_enabled" | "view_rankings_enabled", currentValue: boolean) {
  const cookieStore = await cookies();
  if (!cookieStore.get("admin_token")) return { success: false, error: "Unauthorized" };

  const { error } = await supabase
    .from("system_config")
    .update({ value: (!currentValue).toString() })
    .eq("key", key);

  if (error) return { success: false, error: error.message };

  revalidatePath("/");
  revalidatePath("/enter-marks");
  revalidatePath("/result");
  return { success: true };
}
