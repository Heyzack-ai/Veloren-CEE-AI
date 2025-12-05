import { NextResponse } from "next/server";

// Prevent prerendering - this is a dynamic API route
export const dynamic = 'force-dynamic';

function base(): string {
  const raw = process.env.VITE_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_VITE_AUTH_URL || "https://veloren-dev.heyzack.ai";
  const url = raw?.trim() || "https://veloren-dev.heyzack.ai";
  return url.replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;
    const res = await fetch(`${base()}/api/auth/logout`, {
      method: "POST",
      headers,
    });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "application/json";
    const payload = ct.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
    const response = NextResponse.json(payload, { status: res.status });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Logout proxy failed" }, { status: 500 });
  }
}

