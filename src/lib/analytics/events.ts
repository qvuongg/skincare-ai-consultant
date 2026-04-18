import { createAdminClient } from "@/lib/supabase/admin";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && url.startsWith("http") && key);
}

export async function recordSkinScan(
  concerns: string[]
): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured; skipping skin_scans insert");
    return null;
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("skin_scans")
    .insert({ concerns })
    .select("id")
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function recordAffiliateEvent(input: {
  event_type: "impression" | "click";
  product_id: string;
  category: string;
  scan_id?: string | null;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("affiliate_events").insert({
    event_type: input.event_type,
    product_id: input.product_id,
    category: input.category,
    scan_id: input.scan_id ?? null,
  });
  if (error) throw error;
}
