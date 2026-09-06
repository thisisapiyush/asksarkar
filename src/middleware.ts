import { NextRequest, NextResponse } from "next/server";

async function safeCompare(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode("ask-sarkar-auth-compare"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, enc.encode(a)),
    crypto.subtle.sign("HMAC", key, enc.encode(b)),
  ]);
  const bufA = new Uint8Array(sigA);
  const bufB = new Uint8Array(sigB);
  let r = 0;
  for (let i = 0; i < bufA.length; i++) r |= bufA[i] ^ bufB[i];
  return r === 0;
}

function denyAuth(): NextResponse {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Ask Sarkar admin"',
      "X-Robots-Tag": "noindex",
    },
  });
}

export async function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return new NextResponse("Admin credentials not configured", {
      status: 500,
      headers: { "X-Robots-Tag": "noindex" },
    });
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return denyAuth();
  }

  let user: string;
  let pass: string;
  try {
    const decoded = atob(authHeader.slice(6));
    const colon = decoded.indexOf(":");
    if (colon === -1) return denyAuth();
    user = decoded.slice(0, colon);
    pass = decoded.slice(colon + 1);
  } catch {
    return denyAuth();
  }

  const [userOk, passOk] = await Promise.all([
    safeCompare(user, expectedUser),
    safeCompare(pass, expectedPass),
  ]);

  if (!userOk || !passOk) {
    return denyAuth();
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex");
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
