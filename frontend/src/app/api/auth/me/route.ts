import { NextResponse } from "next/server";

function base(): string {
  const raw = process.env.NEXT_PUBLIC_AUTH_URL || process.env.VITE_AUTH_URL || "";
  const url = raw?.trim() || "";
  if (!url) {
    throw new Error("Backend auth URL not configured");
  }
  return url.replace(/\/$/, "");
}

export async function GET(req: Request) {
  const target = `${base()}/api/auth/me`;
  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;
    const res = await fetch(target, {
      method: "GET",
      headers,
    });
    
    if (!res.ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: res.status });
    }

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";
    const payload = contentType.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
    const response = NextResponse.json(payload, { status: res.status });
    
    // Forward set-cookie headers if any
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Auth check failed" }, { status: 500 });
  }
}
