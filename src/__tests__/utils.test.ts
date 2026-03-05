import { describe, it, expect } from "vitest";
import { formatAddress, cn } from "@/lib/utils";

describe("formatAddress", () => {
  it("truncates a full address to 6...4 format", () => {
    expect(
      formatAddress("0x742d35cc6634c0532925a3b844bc9e7595f2bd18")
    ).toBe("0x742d...bd18");
  });

  it("returns ENS names without truncation", () => {
    expect(formatAddress("vitalik.eth")).toBe("vitalik.eth");
  });

  it("returns subdomain ENS names without truncation", () => {
    expect(formatAddress("pay.vitalik.eth")).toBe("pay.vitalik.eth");
  });
});

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-4", "px-2")).toBe("px-2");
  });

  it("handles conditional classes", () => {
    expect(cn("bg-red-500", false && "bg-blue-500")).toBe("bg-red-500");
  });
});
