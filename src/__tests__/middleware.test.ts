import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";

function makeRequest(method: string, path: string, apiKey?: string) {
  const url = new URL(path, "http://localhost:3000");
  const headers = new Headers();
  if (apiKey) headers.set("X-API-Key", apiKey);
  return new NextRequest(url, { method, headers });
}

describe("middleware", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("allows GET requests without API key", () => {
    process.env.API_KEY = "secret";
    const req = makeRequest("GET", "/api/participants");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("blocks POST without API key when API_KEY is set", () => {
    process.env.API_KEY = "secret";
    const req = makeRequest("POST", "/api/participants");
    const res = middleware(req);
    expect(res.status).toBe(401);
  });

  it("allows POST with correct API key", () => {
    process.env.API_KEY = "secret";
    const req = makeRequest("POST", "/api/participants", "secret");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("blocks POST with wrong API key", () => {
    process.env.API_KEY = "secret";
    const req = makeRequest("POST", "/api/participants", "wrong");
    const res = middleware(req);
    expect(res.status).toBe(401);
  });

  it("allows all requests when no API_KEY is configured", () => {
    delete process.env.API_KEY;
    const req = makeRequest("POST", "/api/participants");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("allows non-API routes", () => {
    process.env.API_KEY = "secret";
    const req = makeRequest("GET", "/contests");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});
