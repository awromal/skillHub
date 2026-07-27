import { createServerFn } from "@tanstack/react-start";

export const seedDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = "sbadmin@gmail.com";
    const password = "adminsb@sb";

    const { data: created } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin" },
    });

    if (created?.user) {
      try {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: created.user.id, role: "admin" },
          { onConflict: "user_id,role" },
        );
      } catch {
        // ignore if table doesn't exist
      }
    }
    return { seeded: true };
  } catch (err) {
    return { seeded: false };
  }
});
