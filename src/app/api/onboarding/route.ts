import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const supabase = createAdminClient();

    // Lưu vào bảng leads (Bypass RLS bằng Admin Client)
    const { data: lead, error } = await supabase
      .from("leads")
      .insert([
        {
          user_name: data.user_name,
          location: data.location,
          weather_context: data.weather_context,
          environment: data.environment,
          habits: data.habits,
          current_treatments: data.current_treatments,
          primary_goal: data.primary_goal,
          raw_data: data,
        },
      ])
      .select()
      .single();

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
