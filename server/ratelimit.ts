import type { MiddlewareHandler } from "hono";
import type { AppVariables } from "./app";
import { getConnInfo } from "hono/bun";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  statusCode: number;
}

export default class InMemoryRateLimitStore {
  private store: Map<string, RateLimitRecord> = new Map();

  constructor(private cleanupIntervalMs: number = 60000) {
    setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  increment(key: string, windowMs: number): RateLimitRecord {
    const now = Date.now();
    const resetAt = now + windowMs;

    const record = this.store.get(key);

    if (!record || now > record.resetAt) {
      const newRecord = { count: 1, resetAt };
      this.store.set(key, newRecord);
      return newRecord;
    } else {
      record.count++;
      return record;
    }
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetAt) {
        this.store.delete(key);
      }
    }
  }
}

export function createRateLimiter(
  options: Partial<RateLimiterOptions> = {}
): MiddlewareHandler<AppVariables> {
  const opts: RateLimiterOptions = {
    windowMs: 60000,
    maxRequests: 100,
    message: "Too many requests, please try again later.",
    statusCode: 429,
    ...options,
  };

  const store = new InMemoryRateLimitStore();

  return async (c, next) => {
    const method = c.req.method;
    if (method === "GET" || method === "OPTIONS") {
      return next();
    }

    const info = getConnInfo(c);
    const ip = info.remote.address;

    const path = c.req.path;
    const key = `${ip}:${path}`;

    const record = store.increment(key, opts.windowMs);

    const remaining = Math.max(0, opts.maxRequests - record.count);
    const reset = Math.ceil((record.resetAt - Date.now()) / 1000);

    c.header("X-RateLimit-Limit", opts.maxRequests.toString());
    c.header("X-RateLimit-Remaining", remaining.toString());
    c.header("X-RateLimit-Reset", reset.toString());

    if (record.count > opts.maxRequests) {
      return c.text(opts.message!, opts.statusCode as any);
    }

    return next();
  };
}
