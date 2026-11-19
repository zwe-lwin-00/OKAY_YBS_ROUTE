import { NextResponse } from "next/server";

export function adminTokenExpected(): string {
  return process.env.ADMIN_TOKEN || "ybs-admin-local";
}

export function readAdminToken(request: Request): string {
  return (
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    ""
  );
}

export function requireAdmin(request: Request): NextResponse | null {
  if (readAdminToken(request) !== adminTokenExpected()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
