import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

/** Local-dev fallback only — never accepted when NODE_ENV=production. */
export const LOCAL_ADMIN_FALLBACK = "ybs-admin-local";

const MIN_PROD_TOKEN_LEN = 16;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Expected admin token.
 * - development: ADMIN_TOKEN or local fallback
 * - production: ADMIN_TOKEN required (strong); misconfig → empty (deny-all)
 */
export function adminTokenExpected(): string {
  const fromEnv = (process.env.ADMIN_TOKEN || "").trim();

  if (isProduction()) {
    if (
      !fromEnv ||
      fromEnv === LOCAL_ADMIN_FALLBACK ||
      fromEnv.length < MIN_PROD_TOKEN_LEN
    ) {
      return "";
    }
    return fromEnv;
  }

  return fromEnv || LOCAL_ADMIN_FALLBACK;
}

export function isAdminConfigured(): boolean {
  return adminTokenExpected().length > 0;
}

export function readAdminToken(request: Request): string {
  return (
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  );
}

function tokensEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    // Compare against self to keep roughly constant work on length mismatch.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function requireAdmin(request: Request): NextResponse | null {
  const expected = adminTokenExpected();
  if (!expected) {
    return NextResponse.json(
      {
        error: "Admin disabled",
        detail:
          "Set a strong ADMIN_TOKEN env (≥16 chars, not the local default) in production.",
      },
      { status: 503 },
    );
  }
  if (!tokensEqual(readAdminToken(request), expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
