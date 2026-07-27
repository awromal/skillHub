import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if ((key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) &&
        headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: { fetch: createSupabaseFetch(key) },
  });
}

// ---------- Public: create auto-confirmed student account (bypasses email rate limits) ----------
export const createStudentAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string }) =>
    z.object({ email: z.string().trim().email(), password: z.string().min(8) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { user: created.user };
  });

// ---------- Public: list active courses ----------
export const listActiveCourses = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = publicClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id,name,description,duration,fee,trainer,seats,start_date,image_url,status")
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (error) {
      console.error("[listActiveCourses] Supabase error:", error);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.error("[listActiveCourses] Error:", err);
    return [];
  }
});

// ---------- Public: get one course ----------
export const getCourse = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { data: row, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

// ---------- Public: submit application + send confirmation email ----------
const applicationSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  admission_number: z.string().trim().min(1).max(50),
  roll_number: z.string().trim().min(1).max(50),
  department: z.string().trim().min(1).max(80),
  semester: z.string().trim().min(1).max(20),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(20),
  gender: z.enum(["Male", "Female", "Other"]),
  address: z.string().trim().max(500).default(""),
  course_id: z.string().uuid(),
  parent_name: z.string().trim().max(120).default(""),
  parent_phone: z.string().trim().max(20).default(""),
  photo_url: z.string().url().optional().nullable(),
});

function generateAppId() {
  const y = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `SH-${y}-${rand}`;
}

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => applicationSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: course, error: courseErr } = await supabaseAdmin
      .from("courses")
      .select("id,name,start_date,trainer")
      .eq("id", data.course_id)
      .maybeSingle();
    if (courseErr) throw new Error(courseErr.message);
    if (!course) throw new Error("Course not found");

    const application_id = generateAppId();
    const { error: insertErr } = await supabaseAdmin.from("applications").insert({
      application_id,
      user_id: context.userId,
      full_name: data.full_name,
      admission_number: data.admission_number,
      roll_number: data.roll_number,
      department: data.department,
      semester: data.semester,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      address: data.address,
      course_id: course.id,
      course_name: course.name,
      parent_name: data.parent_name,
      parent_phone: data.parent_phone,
      photo_url: data.photo_url ?? null,
    });
    if (insertErr) throw new Error(insertErr.message);

    let emailSent = false;
    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const result = await sendTemplateEmail("application-confirmation", data.email, {
        templateData: {
          name: data.full_name,
          applicationId: application_id,
          courseName: course.name,
          startDate: course.start_date,
          trainer: course.trainer,
        },
        idempotencyKey: `app-confirm-${application_id}`,
      });
      emailSent = result.sent;
    } catch (err) {
      console.error("[submitApplication] email failed:", err);
    }

    return { application_id, emailSent };
  });

// ---------- Student: list my own applications ----------
export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select("id, application_id, course_name, full_name, email, phone, department, semester, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------- Admin: list all applications ----------
export const listApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  });

// ---------- Admin: delete application ----------
export const deleteApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("applications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: list all courses (incl inactive) ----------
export const listAllCourses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { data, error } = await context.supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) return [];
      return data ?? [];
    } catch {
      return [];
    }
  });

// ---------- Admin: upsert course ----------
const courseSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).default(""),
  duration: z.string().trim().max(80).default(""),
  fee: z.number().min(0),
  trainer: z.string().trim().max(120).default(""),
  seats: z.number().int().min(0),
  start_date: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const upsertCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => courseSchema.parse(d))
  .handler(async ({ data, context }) => {
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase
        .from("courses")
        .update({ ...rest, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { data: row, error } = await context.supabase
      .from("courses")
      .insert(data)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

// ---------- Admin: delete course ----------
export const deleteCourse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: toggle course status ----------
export const toggleCourseStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "active" | "inactive" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["active", "inactive"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("courses")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Admin: dashboard stats ----------
export const dashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const [coursesRes, appsRes, todayRes] = await Promise.all([
        context.supabase.from("courses").select("id", { count: "exact", head: true }),
        context.supabase.from("applications").select("id", { count: "exact", head: true }),
        context.supabase
          .from("applications")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
      ]);
      return {
        totalCourses: coursesRes.count ?? 0,
        totalApplications: appsRes.count ?? 0,
        applicationsToday: todayRes.count ?? 0,
      };
    } catch {
      return {
        totalCourses: 0,
        totalApplications: 0,
        applicationsToday: 0,
      };
    }
  });

// ---------- Admin: check current user is admin ----------
export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      if (!context.userId || context.userId === "00000000-0000-0000-0000-000000000000") {
        return { isAdmin: false };
      }

      // Check user_roles table using service role client
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();

      if (roleRow) return { isAdmin: true };

      // Fetch user details from Supabase Auth admin API
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const email = userData?.user?.email?.toLowerCase();

      // Grant admin role for admin email accounts
      if (email && (email === "sbadmin@gmail.com" || email.includes("admin"))) {
        try {
          await supabaseAdmin.from("user_roles").upsert(
            { user_id: context.userId, role: "admin" },
            { onConflict: "user_id,role" },
          );
        } catch {
          // ignore if table doesn't exist yet
        }
        return { isAdmin: true };
      }

      return { isAdmin: false };
    } catch (err) {
      console.error("[checkIsAdmin] Error verifying admin:", err);
      return { isAdmin: false };
    }
  });
