import { NextResponse } from "next/server";

export const SEARCH_LIMIT_DEFAULT = 12;
export const SEARCH_LIMIT_MAX = 40;

export const NEARBY_LIMIT_DEFAULT = 40;
export const NEARBY_LIMIT_MAX = 80;
export const NEARBY_RADIUS_DEFAULT = 1200;
export const NEARBY_RADIUS_MAX = 5000;
export const NEARBY_RADIUS_MIN = 100;

export function clampInt(
  raw: number,
  fallback: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(raw)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(raw)));
}

export function clampSearchLimit(raw: number): number {
  return clampInt(raw, SEARCH_LIMIT_DEFAULT, 1, SEARCH_LIMIT_MAX);
}

export function clampNearbyLimit(raw: number): number {
  return clampInt(raw, NEARBY_LIMIT_DEFAULT, 1, NEARBY_LIMIT_MAX);
}

export function clampNearbyRadius(raw: number): number {
  return clampInt(raw, NEARBY_RADIUS_DEFAULT, NEARBY_RADIUS_MIN, NEARBY_RADIUS_MAX);
}

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Best-effort in-memory rate limit (per process). */
export function rateLimit(
  request: Request,
  {
    key,
    limit = 60,
    windowMs = 60_000,
  }: { key: string; limit?: number; windowMs?: number },
): NextResponse | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  let bucket = buckets.get(bucketKey);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(bucketKey, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const retry = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests", retryAfterSeconds: retry },
      {
        status: 429,
        headers: { "Retry-After": String(retry) },
      },
    );
  }
  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k);
    }
  }
  return null;
}
