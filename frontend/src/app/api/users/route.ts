import { NextResponse } from "next/server";

function upstream(): string {
  const raw = process.env.VITE_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_VITE_AUTH_URL || "https://veloren-dev.heyzack.ai";
  const url = raw?.trim() || "https://veloren-dev.heyzack.ai";
  return url.replace(/\/$/, "") + "/api/users";
}

export async function POST(req: Request) {
  const body = await req.text();
  try {
    const headers: Record<string, string> = {
      "Content-Type": req.headers.get("content-type") || "application/json",
      Accept: req.headers.get("accept") || "application/json",
    };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;

    const res = await fetch(upstream(), { method: "POST", headers, body });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "application/json";
    const payload = ct.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
    const response = NextResponse.json(payload, { status: res.status });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "User create proxy failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const role = url.searchParams.get("role");
  const active = url.searchParams.get("active");
  const target = new URL(upstream());
  if (role) target.searchParams.set("role", role);
  if (active) target.searchParams.set("active", active);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;

    const res = await fetch(target.toString(), { method: "GET", headers });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "application/json";
    const payload = ct.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
    const response = NextResponse.json(payload, { status: res.status });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "User list proxy failed" }, { status: 500 });
  }
}

