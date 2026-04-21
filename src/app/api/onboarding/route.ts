import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = createAdminClient();

    const name =
      typeof data.user_name === "string" && data.user_name.trim()
        ? data.user_name.trim()
        : typeof data.name === "string" && data.name.trim()
          ? data.name.trim()
          : "Khách ẩn danh";

    const contactInfo =
      typeof data.contact_info === "string" && data.contact_info.trim()
        ? data.contact_info.trim()
        : "Chưa cung cấp";

    const skinTypeDetected =
      typeof data.skin_type_detected === "string" && data.skin_type_detected.trim()
        ? data.skin_type_detected.trim()
        : "Chưa phân loại";

    const primaryGoal =
      typeof data.primary_goal === "string" && data.primary_goal.trim()
        ? data.primary_goal.trim()
        : "Chưa cung cấp";

    let { data: lead, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          contact_info: contactInfo,
          skin_type_detected: skinTypeDetected,
          primary_goal: primaryGoal,
          raw_data: data,
        },
      ])
      .select()
      .single();

    const shouldFallbackToLegacySchema =
      error?.code === "PGRST204" &&
      typeof error.message === "string" &&
      (error.message.includes("contact_info") || error.message.includes("skin_type_detected"));

    if (shouldFallbackToLegacySchema) {
      const legacyInsert = await supabase
        .from("leads")
        .insert([
          {
            user_name: name,
            location: data.location ?? null,
            weather_context: data.weather_context ?? null,
            environment: data.environment ?? null,
            habits: data.habits ?? null,
            current_treatments: data.current_treatments ?? null,
            primary_goal: primaryGoal,
            raw_data: data,
          },
        ])
        .select()
        .single();

      lead = legacyInsert.data;
      error = legacyInsert.error;
    }

    if (error) {
      console.error("Supabase insert error:", error);
      // Vẫn trả về 200 để không làm gián đoạn trải nghiệm người dùng nếu DB lỗi
      return NextResponse.json({ success: true, warning: "Database insert failed" });
    }

    return NextResponse.json({ success: true, lead });
  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
