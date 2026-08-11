import { createServerFn } from "@tanstack/react-start";

// Port of Singapore anchor point (PSA main terminals)
export const SINGAPORE = { lat: 1.2649, lon: 103.8323 } as const;

export type WeatherSnapshot = {
  observed_at: string;
  temp_c: number;
  wind_speed_kn: number;
  wind_deg: number;
  visibility_km: number;
  humidity: number;
  pressure_hpa: number;
  condition: string;
  icon: string;
  precipitation_mm_h: number;
  source: "openweathermap" | "open-meteo";
};

/**
 * Live weather at the Port of Singapore.
 * Uses OpenWeather when OPENWEATHER_API_KEY is set, else falls back to
 * Open-Meteo (no key required). Throws when both fail so the UI can render
 * an explicit unavailable state — no fabricated numbers.
 */
export const getSingaporeWeather = createServerFn({ method: "GET" }).handler(async (): Promise<WeatherSnapshot> => {
  const key = process.env.OPENWEATHER_API_KEY;
  if (key) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${SINGAPORE.lat}&lon=${SINGAPORE.lon}&units=metric&appid=${key}`;
    const res = await fetch(url);
    if (res.ok) {
      const j = await res.json() as any;
      return {
        observed_at: new Date((j.dt ?? Date.now() / 1000) * 1000).toISOString(),
        temp_c: j.main?.temp ?? 0,
        wind_speed_kn: (j.wind?.speed ?? 0) * 1.94384,
        wind_deg: j.wind?.deg ?? 0,
        visibility_km: (j.visibility ?? 0) / 1000,
        humidity: j.main?.humidity ?? 0,
        pressure_hpa: j.main?.pressure ?? 0,
        condition: j.weather?.[0]?.main ?? "—",
        icon: j.weather?.[0]?.icon ?? "",
        precipitation_mm_h: j.rain?.["1h"] ?? 0,
        source: "openweathermap",
      };
    }
  }
  // Fallback: Open-Meteo (no key)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${SINGAPORE.lat}&longitude=${SINGAPORE.lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m,pressure_msl,visibility,weather_code&wind_speed_unit=kn`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`weather_upstream_${res.status}`);
  const j = await res.json() as any;
  const c = j.current ?? {};
  return {
    observed_at: c.time ? new Date(c.time).toISOString() : new Date().toISOString(),
    temp_c: c.temperature_2m ?? 0,
    wind_speed_kn: c.wind_speed_10m ?? 0,
    wind_deg: c.wind_direction_10m ?? 0,
    visibility_km: (c.visibility ?? 0) / 1000,
    humidity: c.relative_humidity_2m ?? 0,
    pressure_hpa: c.pressure_msl ?? 0,
    condition: weatherCodeLabel(c.weather_code ?? 0),
    icon: "",
    precipitation_mm_h: c.precipitation ?? 0,
    source: "open-meteo",
  };
});

function weatherCodeLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code < 3) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code < 50) return "Fog";
  if (code < 70) return "Rain";
  if (code < 80) return "Snow";
  if (code < 100) return "Showers";
  return "Thunderstorm";
}

export type ThroughputPoint = { year: number; teu: number | null };

/**
 * World Bank — Container port traffic (TEU) for Singapore, indicator IS.SHP.GOOD.TU.
 * Public, no key required.
 */
export const getSingaporeContainerThroughput = createServerFn({ method: "GET" }).handler(async (): Promise<ThroughputPoint[]> => {
  const res = await fetch("https://api.worldbank.org/v2/country/SGP/indicator/IS.SHP.GOOD.TU?format=json&per_page=60");
  if (!res.ok) throw new Error(`worldbank_${res.status}`);
  const j = await res.json() as any;
  const rows: any[] = Array.isArray(j) && j[1] ? j[1] : [];
  return rows
    .map((r) => ({ year: Number(r.date), teu: r.value == null ? null : Number(r.value) }))
    .filter((r) => Number.isFinite(r.year))
    .sort((a, b) => a.year - b.year);
});

export type AisVessel = {
  mmsi: number;
  name?: string;
  lat: number;
  lon: number;
  sog?: number; // speed over ground (kn)
  cog?: number; // course over ground (deg)
  heading?: number;
  ship_type?: number;
  received_at: string;
};

export type AisSnapshot = {
  vessels: AisVessel[];
  collected_ms: number;
  observed_at: string;
  bbox: [number, number, number, number]; // [minLat, minLon, maxLat, maxLon]
  source: "aisstream" | "unavailable";
  reason?: string;
};

// Singapore Strait + PSA anchorages
const SG_BBOX: [number, number, number, number] = [1.05, 103.55, 1.55, 104.15];

/**
 * AIS snapshot around the Port of Singapore. Opens an outbound WebSocket to
 * AISStream, subscribes to the Singapore bounding box, collects position
 * reports for `windowMs` (default 4s), then closes and returns the unique
 * vessel list. Returns `source: "unavailable"` when AISSTREAM_API_KEY is
 * missing or the upstream connection fails — never fabricated positions.
 */
export const getAisSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<AisSnapshot> => {
  const apiKey = process.env.AISSTREAM_API_KEY;
  const observed_at = new Date().toISOString();
  if (!apiKey) {
    return { vessels: [], collected_ms: 0, observed_at, bbox: SG_BBOX, source: "unavailable", reason: "AISSTREAM_API_KEY not configured" };
  }
  const windowMs = 4000;
  try {
    // Cloudflare Workers outbound WebSocket via fetch Upgrade
    const resp = await fetch("https://stream.aisstream.io/v0/stream", {
      headers: { Upgrade: "websocket" },
    });
    const ws = (resp as unknown as { webSocket: WebSocket | null }).webSocket;
    if (!ws) throw new Error("no_websocket_upgrade");
    (ws as any).accept?.();

    const seen = new Map<number, AisVessel>();
    const sub = {
      APIKey: apiKey,
      BoundingBoxes: [[[SG_BBOX[0], SG_BBOX[1]], [SG_BBOX[2], SG_BBOX[3]]]],
      FilterMessageTypes: ["PositionReport", "ShipStaticData"],
    };
    ws.send(JSON.stringify(sub));

    await new Promise<void>((resolve) => {
      const done = () => { try { ws.close(); } catch {} resolve(); };
      const t = setTimeout(done, windowMs);
      ws.addEventListener("message", (ev: MessageEvent) => {
        try {
          const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
          const meta = msg?.MetaData ?? {};
          const mmsi = Number(meta.MMSI ?? msg?.Message?.PositionReport?.UserID);
          if (!mmsi) return;
          const pr = msg?.Message?.PositionReport;
          const sd = msg?.Message?.ShipStaticData;
          const cur = seen.get(mmsi) ?? {
            mmsi,
            lat: pr?.Latitude ?? meta.latitude ?? 0,
            lon: pr?.Longitude ?? meta.longitude ?? 0,
            received_at: meta.time_utc ?? observed_at,
          } as AisVessel;
          if (pr) {
            cur.lat = pr.Latitude ?? cur.lat;
            cur.lon = pr.Longitude ?? cur.lon;
            cur.sog = pr.Sog ?? cur.sog;
            cur.cog = pr.Cog ?? cur.cog;
            cur.heading = pr.TrueHeading ?? cur.heading;
          }
          if (sd) {
            cur.name = sd.Name?.trim?.() ?? cur.name;
            cur.ship_type = sd.Type ?? cur.ship_type;
          }
          seen.set(mmsi, cur);
        } catch {}
      });
      ws.addEventListener("close", () => { clearTimeout(t); resolve(); });
      ws.addEventListener("error", () => { clearTimeout(t); resolve(); });
    });

    return {
      vessels: Array.from(seen.values()),
      collected_ms: windowMs,
      observed_at,
      bbox: SG_BBOX,
      source: "aisstream",
    };
  } catch (err) {
    return {
      vessels: [],
      collected_ms: 0,
      observed_at,
      bbox: SG_BBOX,
      source: "unavailable",
      reason: err instanceof Error ? err.message : "ais_upstream_error",
    };
  }
});