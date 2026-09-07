import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/admin";
import { getScoreBand } from "@/lib/scoring/engine";

export const runtime = "nodejs";
export const alt = "Báo cáo phân tích làn da · Mika AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let overallScore = 78;
  let scoreBand = getScoreBand(78);
  let userName = "bạn";
  let skinType = "Da hỗn hợp";

  try {
    const admin = createAdminClient();
    const { data: report } = await admin
      .from("scan_reports")
      .select("overall_score, lead_id, leads(name, skin_type_detected, raw_data)")
      .eq("id", id)
      .maybeSingle();

    if (report) {
      overallScore = report.overall_score;
      scoreBand = getScoreBand(overallScore);
      const lead = Array.isArray(report.leads) ? report.leads[0] : report.leads;
      const raw = (lead as Record<string, unknown>)?.raw_data as Record<string, unknown> | undefined;
      userName =
        (lead as { name?: string })?.name ||
        (raw?.user_name as string) ||
        (raw?.name as string) ||
        "bạn";
      skinType =
        (lead as { skin_type_detected?: string })?.skin_type_detected ||
        "Da khỏe";
    }
  } catch (err) {
    console.error("OG Image generation DB error:", err);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #0f172a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
          padding: "48px 64px",
        }}
      >
        {/* Glow ambient circle */}
        <div
          style={{
            position: "absolute",
            top: "-15%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "400px",
            background: `radial-gradient(circle, ${scoreBand.color}40 0%, transparent 70%)`,
            filter: "blur(60px)",
          }}
        />

        {/* Top Brand Tag */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "8px 24px",
            borderRadius: "9999px",
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: scoreBand.color,
            }}
          />
          <span
            style={{
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#e4e4e7",
            }}
          >
            Mika AI · Skin Health Report
          </span>
        </div>

        {/* Main Content Layout */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            maxWidth: "1000px",
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "32px",
            padding: "40px 56px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Left Column: User details */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              maxWidth: "560px",
            }}
          >
            <span style={{ fontSize: "20px", color: "#a1a1aa" }}>
              Kết quả phân tích da của
            </span>
            <span
              style={{
                fontSize: "44px",
                fontWeight: 800,
                color: "#ffffff",
                letterSpacing: "-0.02em",
              }}
            >
              {userName}
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  padding: "6px 18px",
                  borderRadius: "9999px",
                  background: `${scoreBand.color}25`,
                  border: `1px solid ${scoreBand.color}60`,
                  color: scoreBand.color,
                  fontSize: "18px",
                  fontWeight: 700,
                }}
              >
                {scoreBand.label} {scoreBand.emoji}
              </div>
              <div
                style={{
                  padding: "6px 18px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#d4d4d8",
                  fontSize: "18px",
                  fontWeight: 600,
                }}
              >
                {skinType}
              </div>
            </div>
            <p
              style={{
                fontSize: "17px",
                color: "#71717a",
                marginTop: "16px",
                lineHeight: 1.5,
              }}
            >
              Phân tích 11 chỉ số sinh lý da & Phác đồ Routine cá nhân hóa
            </p>
          </div>

          {/* Right Column: Score Circular Badge */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${scoreBand.color}25 0%, rgba(255, 255, 255, 0.03) 70%)`,
              border: `4px solid ${scoreBand.color}`,
              boxShadow: `0 0 35px ${scoreBand.color}50`,
            }}
          >
            <span
              style={{
                fontSize: "68px",
                fontWeight: 800,
                color: scoreBand.color,
                lineHeight: 1,
              }}
            >
              {overallScore}
            </span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "#a1a1aa",
                marginTop: "6px",
                textTransform: "uppercase",
              }}
            >
              Điểm da
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
