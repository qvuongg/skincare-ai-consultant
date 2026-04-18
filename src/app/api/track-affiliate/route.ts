import { recordAffiliateEvent } from "@/lib/analytics/events";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  event_type: z.enum(["impression", "click"]),
  product_id: z.string().min(1),
  category: z.string().min(1),
  scan_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return Response.json({ error: "Invalid payload" }, { status: 400 });
    }

    await recordAffiliateEvent({
      event_type: parsed.data.event_type,
      product_id: parsed.data.product_id,
      category: parsed.data.category,
      scan_id: parsed.data.scan_id ?? null,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("track-affiliate:", e);
    return Response.json(
      { error: "Could not record event" },
      { status: 500 }
    );
  }
}
