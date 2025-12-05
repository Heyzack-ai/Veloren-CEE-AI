import { NextResponse } from "next/server";

function base(): string {
  const raw = process.env.VITE_AUTH_URL || process.env.NEXT_PUBLIC_AUTH_URL || process.env.NEXT_PUBLIC_VITE_AUTH_URL || "https://veloren-dev.heyzack.ai";
  const url = raw?.trim() || "https://veloren-dev.heyzack.ai";
  return url.replace(/\/$/, "");
}

async function proxy(req: Request, path: string) {
  const url = new URL(req.url);
  const search = url.search || "";
  const target = `${base()}/api/${path}${search}`;
  const method = req.method.toUpperCase();

  const headers: Record<string, string> = {
    Accept: req.headers.get("accept") || "application/json",
  };
  const cookie = req.headers.get("cookie");
  if (cookie) headers["Cookie"] = cookie;
  const auth = req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  const hasBody = !(method === "GET" || method === "HEAD" || method === "OPTIONS");
  let body: string | undefined;
  if (hasBody) {
    const ct = req.headers.get("content-type") || "application/json";
    headers["Content-Type"] = ct;
    body = await req.text();
  }

  const res = await fetch(target, { method, headers, body });
  const text = await res.text();
  const ct = res.headers.get("content-type") || "application/json";
  const payload = ct.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
  const response = NextResponse.json(payload, { status: res.status });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) response.headers.set("set-cookie", setCookie);
  return response;
}

export async function GET(req: Request, { params }: { params: { upstream: string[] } }) {
  return proxy(req, (params.upstream || []).join("/"));
}

export async function POST(req: Request, { params }: { params: { upstream: string[] } }) {
  return proxy(req, (params.upstream || []).join("/"));
}

export async function PATCH(req: Request, { params }: { params: { upstream: string[] } }) {
  return proxy(req, (params.upstream || []).join("/"));
}

export async function PUT(req: Request, { params }: { params: { upstream: string[] } }) {
  return proxy(req, (params.upstream || []).join("/"));
}

export async function DELETE(req: Request, { params }: { params: { upstream: string[] } }) {
  return proxy(req, (params.upstream || []).join("/"));
}

export async function OPTIONS(req: Request, { params }: { params: { upstream: string[] } }) {
  return proxy(req, (params.upstream || []).join("/"));
}

