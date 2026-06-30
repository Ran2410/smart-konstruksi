// Route handler — self-contained for Turbopack compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result: any = NextAuth(authConfig);
const handlers = result.handlers ?? result;

// Turbopack requires explicit function exports
export async function GET(request: Request) {
  return handlers.GET(request);
}

export async function POST(request: Request) {
  return handlers.POST(request);
}
