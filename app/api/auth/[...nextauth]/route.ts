// Route handler — self-contained for Turbopack compatibility
import NextAuth from "next-auth";
import { NextRequest } from "next/server";
import { authConfig } from "@/lib/auth-config";

const { handlers } = NextAuth(authConfig);

/**
 * Next.js builds `request.url` from the Host header. When the app is reached
 * through a tunnel (devtunnels / ngrok), the upstream Host header stays
 * `localhost:3000` while the real public origin is in `x-forwarded-host`.
 * Auth.js derives callback/redirect URLs from `request.url`, so without this
 * normalization logins via tunnels redirect back to localhost.
 *
 * For production deployments set AUTH_URL to the canonical origin instead;
 * this helper only applies the forwarded host when present.
 */
async function normalizeTunnelHost(request: NextRequest): Promise<NextRequest> {
  // Forwarded hosts are useful for local tunnels, but must never override the
  // canonical AUTH_URL/NEXTAUTH_URL in production.
  if (process.env.NODE_ENV === "production") return request;

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (!forwardedHost) return request;

  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    url.protocol = forwardedProto.endsWith(":")
      ? forwardedProto
      : `${forwardedProto}:`;
  }
  // Set hostname + port explicitly — `url.host = ...` alone keeps the
  // original port (e.g. localhost:3000 -> tunnel:3000), which breaks tunnels.
  const fh = new URL(`https://${forwardedHost}`);
  url.hostname = fh.hostname;
  url.port = fh.port || "";

  // Preserve method + body (Request bodies are single-use, so clone first)
  const init: RequestInit = {
    method: request.method,
    headers: request.headers,
    body: ["GET", "HEAD"].includes(request.method)
      ? undefined
      : await request.clone().arrayBuffer(),
  };
  // @ts-expect-error -- duplex is required for streaming bodies in undici
  init.duplex = "half";
  return new NextRequest(url, init);
}

// Turbopack requires explicit function exports
export async function GET(request: NextRequest) {
  return handlers.GET(await normalizeTunnelHost(request));
}

export async function POST(request: NextRequest) {
  return handlers.POST(await normalizeTunnelHost(request));
}
