import { NextResponse } from "next/server";

function upstream(id: string): string {
  const raw = process.env.VITE_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_VITE_AUTH_URL || "";
  const url = raw?.trim() || "";
  return url.replace(/\/$/, "") + "/api/users/" + id;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.text();
  const id = params.id;
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: req.headers.get("accept") || "application/json",
    };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;
    const res = await fetch(upstream(id), {
      method: "PATCH",
      headers,
      body,
    });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "application/json";
    const payload = ct.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
    return NextResponse.json(payload, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "User update proxy failed" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const headers: Record<string, string> = {
      Accept: req.headers.get("accept") || "application/json",
    };
    const cookie = req.headers.get("cookie");
    if (cookie) headers.Cookie = cookie;
    const auth = req.headers.get("authorization");
    if (auth) headers.Authorization = auth;
    const res = await fetch(upstream(id), {
      method: "GET",
      headers,
    });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "application/json";
    const payload = ct.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
    return NextResponse.json(payload, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "User get proxy failed" }, { status: 500 });
  }
}
