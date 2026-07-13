// ============================================================
// Smart Konstruksi — In-Memory Rate Limiter (Edge-compatible)
// Token bucket algorithm — works with Next.js Edge Middleware
// ============================================================
// NOTE: In-memory limiter resets on server restart.
// For multi-instance production, replace with @upstash/ratelimit + Redis.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// Clean stale entries every check (part of the checkRateLimit flow)
const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

export interface RateLimitConfig {
  /** Max requests in the window */
  maxRequests: number;
  /** Window size in seconds */
  windowSeconds: number;
}

export const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowSeconds: 60, // 60 req/min
};

export const LOGIN_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60, // 10 req/min — stricter for auth
};

export const UPLOAD_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowSeconds: 60, // 20 req/min
};

export const API_CONFIG: RateLimitConfig = {
  maxRequests: 100,
  windowSeconds: 60, // 100 req/min
};

/**
 * Check if a request should be rate limited.
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfter: number }`.
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  // Periodic inline cleanup (runs every ~50 checks)
  if (buckets.size > 1000 && Math.random() < 0.02) {
    for (const [k, bucket] of buckets.entries()) {
      if (now - bucket.lastRefill > STALE_THRESHOLD_MS) {
        buckets.delete(k);
      }
    }
  }

  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = {
      tokens: config.maxRequests - 1,
      lastRefill: now,
    };
    buckets.set(key, bucket);
    return { allowed: true, remaining: bucket.tokens };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((elapsed / windowMs) * config.maxRequests);

  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    const retryAfter = Math.ceil(
      (windowMs - (now - bucket.lastRefill)) / 1000
    );
    return { allowed: false, remaining: 0, retryAfter: Math.max(1, retryAfter) };
  }

  bucket.tokens -= 1;
  return { allowed: true, remaining: bucket.tokens };
}

/**
 * Get client IP from request — handles proxies/headers
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "127.0.0.1";
}

/**
 * Create a rate-limited 429 response
 */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: `Rate limit exceeded. Try again in ${retryAfter} second(s).`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    }
  );
}

/**
 * Security headers to add to every response
 */
export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);

  // Only set if not already present
  if (!headers.has("X-Frame-Options")) {
    headers.set("X-Frame-Options", "DENY");
  }
  if (!headers.has("X-Content-Type-Options")) {
    headers.set("X-Content-Type-Options", "nosniff");
  }
  if (!headers.has("Referrer-Policy")) {
    headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }
  if (!headers.has("X-XSS-Protection")) {
    headers.set("X-XSS-Protection", "1; mode=block");
  }
  if (!headers.has("Permissions-Policy")) {
    headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
