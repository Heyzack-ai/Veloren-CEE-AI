import { NextResponse } from "next/server";

// Prevent prerendering - this is a dynamic API route
export const dynamic = 'force-dynamic';

function base(): string {
  const raw = process.env.NEXT_PUBLIC_AUTH_URL || process.env.VITE_AUTH_URL || "";
  const url = raw?.trim() || "";
  if (!url) {
    console.error("Missing auth URL. Available env vars:", {
      NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
      VITE_AUTH_URL: process.env.VITE_AUTH_URL,
      NODE_ENV: process.env.NODE_ENV
    });
    throw new Error("Backend auth URL not configured");
  }
  return url.replace(/\/$/, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const baseUrl = base();
    const target = `${baseUrl}/api/auth/login`;
    
    console.log("Proxying login request to:", target);
    
    // Backend expects OAuth2PasswordRequestForm (application/x-www-form-urlencoded)
    // Convert JSON { email, password } to form data { username, password, grant_type }
    const formData = new URLSearchParams();
    formData.append('username', body.email);
    formData.append('password', body.password);
    formData.append('grant_type', 'password');
    
    const res = await fetch(target, {
      method: "POST",
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: formData.toString(),
    });
    
    console.log("Backend response status:", res.status);
    
    if (!res.ok) {
      const text = await res.text();
      const contentType = res.headers.get("content-type") || "application/json";
      const payload = contentType.includes("application/json") ? JSON.parse(text || "{}") : { message: text };
      return NextResponse.json(payload, { status: res.status });
    }
    
    const authData = await res.json();
    console.log("Auth data received:", { ...authData, access_token: authData.access_token ? "***" : undefined });
    
    // Fetch user data using the access token
    const userRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        Accept: "application/json",
      },
    });
    
    if (!userRes.ok) {
      const errorText = await userRes.text();
      console.error("Failed to fetch user data:", {
        status: userRes.status,
        statusText: userRes.statusText,
        error: errorText
      });
      return NextResponse.json(
        { 
          error: "Authentication succeeded but failed to fetch user data",
          details: errorText,
          status: userRes.status
        },
        { status: 500 }
      );
    }
    
    const userData = await userRes.json();
    console.log("User data fetched:", { id: userData.id, email: userData.email });
    
    // Transform backend response (snake_case) to frontend format (camelCase)
    const user = {
      id: String(userData.id),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      active: userData.active,
      lastLogin: userData.last_login ? new Date(userData.last_login) : undefined,
      createdAt: new Date(userData.created_at),
    };
    
    // Return combined response in the format frontend expects
    const response = NextResponse.json({
      user,
      token: authData.access_token,
      refresh_token: authData.refresh_token,
    });
    
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) response.headers.set("set-cookie", setCookie);
    
    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Login proxy failed" }, { status: 500 });
  }
}
