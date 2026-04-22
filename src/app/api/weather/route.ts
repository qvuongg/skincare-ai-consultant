import { NextResponse } from "next/server";

export const runtime = "nodejs";

const WEATHER_API_URL = "https://api.weatherapi.com/v1/current.json";
const FETCH_TIMEOUT_MS = 5000;

export async function GET(request: Request) {
  const apiKey = process.env.WEATHER_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      "WEATHER_API_KEY is not set. On Vercel, add it under " +
        "Project Settings → Environment Variables (all target environments), " +
        "then redeploy. .env.local is NOT read by deployed builds."
    );
    return NextResponse.json(
      { error: "Weather service unavailable." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const latRaw = searchParams.get("lat");
  const lonRaw = searchParams.get("lon");

  if (latRaw == null || lonRaw == null) {
    return NextResponse.json(
      { error: "Missing lat or lon query parameters." },
      { status: 400 }
    );
  }

  const lat = Number(latRaw);
  const lon = Number(lonRaw);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json(
      { error: "Invalid coordinates." },
      { status: 400 }
    );
  }

  const upstream = new URL(WEATHER_API_URL);
  upstream.searchParams.set("key", apiKey);
  upstream.searchParams.set("q", `${lat},${lon}`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(upstream, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      // Read body for diagnostics but don't leak upstream errors to the client.
      const detail = await res.text().catch(() => "");
      console.error("WeatherAPI HTTP", res.status, detail);
      return NextResponse.json(
        { error: "Weather provider unreachable." },
        { status: 502 }
      );
    }

    const json = (await res.json()) as {
      location?: { name?: string; region?: string; country?: string };
      current?: { uv?: number; humidity?: number };
    };

    const uv = json.current?.uv;
    const humidity = json.current?.humidity;
    const name = json.location?.name?.trim();
    const region = json.location?.region?.trim();
    const country = json.location?.country?.trim();

    if (typeof uv !== "number" || typeof humidity !== "number" || !name) {
      console.error("WeatherAPI unexpected shape:", json);
      return NextResponse.json(
        { error: "Unexpected weather response." },
        { status: 502 }
      );
    }

    // Prefer "Neighborhood, Region"; fall back to country when WeatherAPI
    // doesn't populate region (common for districts/beaches in Vietnam).
    // Dedupe when WeatherAPI returns the same value in multiple fields.
    const context =
      region && region !== name
        ? region
        : country && country !== name
          ? country
          : null;
    const city = context ? `${name}, ${context}` : name;

    return NextResponse.json({ uv, humidity, city });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    if (!aborted) console.error("Weather fetch failed:", err);
    return NextResponse.json(
      {
        error: aborted
          ? "Weather provider timed out."
          : "Weather provider error.",
      },
      { status: aborted ? 504 : 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
