"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { RouteData, RouteSummary } from "@/lib/types";

const TOKEN_KEY = "ybs_admin_token";

export function AdminEditor() {
  const [token, setToken] = useState("");
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [slug, setSlug] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY) ?? "");
  }, []);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-token": token,
    }),
    [token],
  );

  function saveToken(next: string) {
    setToken(next);
    localStorage.setItem(TOKEN_KEY, next);
  }

  async function loadList() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/routes", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load routes");
      setRoutes(data.routes as RouteSummary[]);
      setStatus(`Loaded ${data.routes.length} routes`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadRoute(nextSlug: string) {
    setSlug(nextSlug);
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/routes/${encodeURIComponent(nextSlug)}`, {
        headers,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load route");
      setJsonText(JSON.stringify(data.data as RouteData, null, 2));
      setStatus(`Editing ${nextSlug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }

  async function saveRoute() {
    setError(null);
    setLoading(true);
    try {
      const parsed = JSON.parse(jsonText) as RouteData;
      const res = await fetch(`/api/admin/routes/${encodeURIComponent(slug)}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setStatus(`Saved ${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function reloadIndex() {
    setError(null);
    const res = await fetch("/api/admin/reload", {
      method: "POST",
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Reload failed");
      return;
    }
    setStatus("Transit index reloaded");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-ink">
            Data admin
          </h1>
          <p className="text-sm text-ink-soft">
            Edit route JSON on disk. Use the{" "}
            <code className="text-xs">ADMIN_TOKEN</code> env value (production
            requires a strong token; local-dev may use{" "}
            <code className="text-xs">ybs-admin-local</code>).
          </p>
        </div>
        <Link href="/" className="text-sm font-semibold text-brand">
          ← App
        </Link>
      </div>

      <div className="surface p-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Admin token
        </label>
        <input
          type="password"
          value={token}
          onChange={(e) => saveToken(e.target.value)}
          className="mt-1 w-full rounded-2xl border border-line bg-white px-3 py-2.5 text-sm"
          placeholder="x-admin-token"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadList()}
            className="min-h-10 rounded-2xl bg-brand px-4 text-sm font-bold text-white"
          >
            Load routes
          </button>
          <button
            type="button"
            onClick={() => void reloadIndex()}
            className="min-h-10 rounded-2xl border border-line bg-white px-4 text-sm font-semibold"
          >
            Reload index
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
        <div className="max-h-[70vh] overflow-auto surface p-2">
          {routes.map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => void loadRoute(r.slug)}
              className={`mb-1 block w-full rounded-2xl px-3 py-2 text-left text-sm ${
                slug === r.slug ? "bg-brand text-white" : "hover:bg-brand/10"
              }`}
            >
              <span className="font-bold">{r.bus_line}</span>
              <span className="mt-0.5 block truncate text-[11px] opacity-80">
                {r.line_name}
              </span>
            </button>
          ))}
        </div>

        <div className="surface p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              {slug ? `JSON · ${slug}` : "Select a route"}
            </p>
            <button
              type="button"
              disabled={!slug || loading}
              onClick={() => void saveRoute()}
              className="min-h-10 rounded-2xl bg-accent px-4 text-sm font-bold text-accent-ink disabled:opacity-50"
            >
              Save to disk
            </button>
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
            className="h-[60vh] w-full rounded-2xl border border-line bg-[#0f1714] p-3 font-mono text-xs text-[#d7ebe3]"
            placeholder="Route JSON appears here"
          />
        </div>
      </div>

      {status ? <p className="mt-3 text-sm text-brand">{status}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
