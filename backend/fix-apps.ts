import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing env vars");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const NIL_UUID = "00000000-0000-0000-0000-000000000000";
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", NIL_UUID);

  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Found buggy applications with NIL UUID:", data.length);
  
  if (data.length > 0) {
    const { error: delErr } = await supabase
      .from("applications")
      .delete()
      .eq("user_id", NIL_UUID);
    if (delErr) {
      console.error("Delete error:", delErr);
    } else {
      console.log("Deleted buggy applications.");
    }
  }
}

main();
