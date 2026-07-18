import { z } from "astro/zod";

export const STATS_URL = "https://jagoba.dev/stats/visits.json";
const CACHE_TTL_MS = 60_000;

const serviceStatsSchema = z.object({
    visits: z.number(),
    share: z.number(),
    unique_paths: z.number(),
    first_visit_at: z.string(),
    last_visit_at: z.string(),
    top_paths: z.array(z.object({ path: z.string(), count: z.number() })),
    top_countries: z.array(z.object({ country: z.string(), count: z.number() })),
    top_browsers: z.array(z.object({ browser: z.string(), count: z.number() })),
    top_os: z.array(z.object({ os: z.string(), count: z.number() })),
    top_prefixes: z.array(z.object({ prefix: z.string(), count: z.number() })),
});

export const visitsStatsSchema = z.object({
    generated_at: z.string(),
    window: z.object({
        since: z.string(),
        until: z.string(),
        days_covered: z.number(),
    }),
    totals: z.object({
        visits: z.number(),
        unique_paths: z.number(),
        countries: z.number(),
        services: z.number(),
        first_visit_at: z.string(),
        last_visit_at: z.string(),
    }),
    by_service: z.record(z.string(), serviceStatsSchema),
    by_year: z.array(z.object({ year: z.number(), visits: z.number(), by_service: z.record(z.string(), z.number()) })),
    by_month: z.array(
        z.object({
            year: z.number(),
            month: z.number(),
            label: z.string(),
            visits: z.number(),
            by_service: z.record(z.string(), z.number()),
        }),
    ),
    by_day: z.array(z.object({ day: z.string(), visits: z.number(), by_service: z.record(z.string(), z.number()) })),
    by_hour_of_day: z.array(z.object({ hour: z.number(), visits: z.number() })),
    by_day_of_week: z.array(z.object({ dow: z.number(), name: z.string(), visits: z.number() })),
    top_paths_global: z.array(
        z.object({ path: z.string(), count: z.number(), by_service: z.record(z.string(), z.number()) }),
    ),
    top_countries_global: z.array(
        z.object({ country: z.string(), count: z.number(), by_service: z.record(z.string(), z.number()) }),
    ),
    top_browsers_global: z.array(z.object({ browser: z.string(), count: z.number() })),
    top_os_global: z.array(z.object({ os: z.string(), count: z.number() })),
    top_prefixes_global: z.array(z.object({ prefix: z.string(), count: z.number() })),
    top_services: z.array(z.object({ service: z.string(), count: z.number() })),
    bot_vs_human: z.object({ bot: z.number(), human: z.number(), bot_share: z.number() }),
});

export type VisitsStats = z.infer<typeof visitsStatsSchema>;
export type ServiceStats = z.infer<typeof serviceStatsSchema>;

let cache: { data: VisitsStats; fetchedAt: number } | null = null;

export async function fetchVisitsStats(): Promise<VisitsStats> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
    const response = await fetch(STATS_URL);
    if (!response.ok) throw new Error(`Stats endpoint returned ${response.status}`);
    const data = visitsStatsSchema.parse(await response.json());
    cache = { data, fetchedAt: Date.now() };
    return data;
}

const numberFormat = new Intl.NumberFormat("es-ES");
const percentFormat = new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 });
const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

export function formatNumber(value: number): string {
    return numberFormat.format(value);
}

export function formatShare(value: number): string {
    return percentFormat.format(value);
}

export function formatDate(iso: string): string {
    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Europe/Madrid",
    }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
    return new Intl.DateTimeFormat("es-ES", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Madrid",
    }).format(new Date(iso));
}

export function countryName(code: string): string {
    try {
        return regionNames.of(code) ?? code;
    } catch {
        return code;
    }
}

export function flagCode(code: string): string | null {
    const normalized = code.trim().toLowerCase();
    return /^[a-z]{2}$/.test(normalized) ? normalized : null;
}

export function dayLabel(day: string): string {
    return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" }).format(
        new Date(`${day}T12:00:00Z`),
    );
}

const DOW_NAMES_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function dowName(dow: number): string {
    return DOW_NAMES_ES[dow] ?? String(dow);
}
