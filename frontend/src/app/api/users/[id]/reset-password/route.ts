import { NextResponse } from "next/server";

function upstream(id: string): string {
  const raw = process.env.VITE_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_VITE_AUTH_URL || "https://api.dev.heyack.ai";
  const url = raw?.trim() || "https://api.dev.heyack.ai";
  return url.replace(/\/$/, "") + "/api/users/" + id + "/reset-password";
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  const current = new URL(req.url);
  const target = new URL(upstream(id));
  const np = current.searchParams.get("new_password");
  if (np) target.searchParams.set("new_password", np);
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;
    const res = await fetch(target.toString(), { method: "POST", headers });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "application/json";
    const payload = ct.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
    return NextResponse.json(payload, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Reset password proxy failed" }, { status: 500 });
  }
}

