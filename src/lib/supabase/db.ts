import { createClient as createBrowserClient } from "./client";
import { createAdminClient } from "./admin";
import type { ProductCategoryId, PriceRange } from "@/types/skin-analysis";

export interface DBProduct {
  id: string;
  name: string;
  brand: string;
  key_ingredients: string[];
  skin_type_tags: string[];
  price_range: PriceRange;
  category: ProductCategoryId;
  image_url: string;
  affiliate_url: string;
  tagline?: string;
  rating?: number;
}

export interface DBLead {
  id: string;
  name: string;
  contact_info: string;
  skin_type_detected: string;
  primary_goal: string;
  created_at: string;
  raw_data?: any;
}

export interface DBScanStat {
  id: string;
  detected_concerns: string[];
  timestamp: string;
}

// Public functions using standard client
export async function fetchAllProducts() {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("brand", { ascending: true });
  
  if (error) throw error;
  return data as DBProduct[];
}

// Admin functions using admin client to bypass RLS
export async function addLead(data: Omit<DBLead, "id" | "created_at">) {
  const supabase = createAdminClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .insert([data])
    .select()
    .single();
  
  if (error) throw error;
  return lead;
}

export async function logScan(concerns: string[]) {
  const supabase = createAdminClient();
  const { data: scan, error } = await supabase
    .from("scan_stats")
    .insert([{ detected_concerns: concerns }])
    .select()
    .single();
  
  if (error) throw error;
  return scan;
}

export async function createProduct(product: Omit<DBProduct, "id">) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert([product])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProduct(id: string, updates: Partial<DBProduct>) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

export async function fetchLeads() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data as DBLead[];
}
