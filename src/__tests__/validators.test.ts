import { describe, it, expect } from "vitest";
import {
  evmAddress,
  participantSchema,
  contestSchema,
  addWinnerSchema,
  updatePayoutSchema,
  batchPayoutSchema,
} from "@/lib/validators";

describe("evmAddress", () => {
  it("accepts a valid EVM address", () => {
    const result = evmAddress.safeParse(
      "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(
        "0x742d35cc6634c0532925a3b844bc9e7595f2bd18"
      );
    }
  });

  it("rejects an address without 0x prefix", () => {
    const result = evmAddress.safeParse(
      "742d35Cc6634C0532925a3b844Bc9e7595f2bD18"
    );
    expect(result.success).toBe(false);
  });

  it("rejects an address with wrong length", () => {
    const result = evmAddress.safeParse("0x742d35Cc6634");
    expect(result.success).toBe(false);
  });

  it("rejects non-hex characters", () => {
    const result = evmAddress.safeParse(
      "0xZZZd35Cc6634C0532925a3b844Bc9e7595f2bD18"
    );
    expect(result.success).toBe(false);
  });

  it("accepts a valid ENS name", () => {
    const result = evmAddress.safeParse("vitalik.eth");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("vitalik.eth");
    }
  });

  it("accepts a subdomain ENS name", () => {
    const result = evmAddress.safeParse("pay.vitalik.eth");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("pay.vitalik.eth");
    }
  });

  it("lowercases ENS names", () => {
    const result = evmAddress.safeParse("Vitalik.ETH");
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("vitalik.eth");
    }
  });

  it("rejects ENS name without .eth suffix", () => {
    const result = evmAddress.safeParse("vitalik.com");
    expect(result.success).toBe(false);
  });

  it("rejects empty ENS label", () => {
    const result = evmAddress.safeParse(".eth");
    expect(result.success).toBe(false);
  });

  it("lowercases the address", () => {
    const result = evmAddress.safeParse(
      "0xABCDEF1234567890ABCDEF1234567890ABCDEF12"
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe(
        "0xabcdef1234567890abcdef1234567890abcdef12"
      );
    }
  });
});

describe("participantSchema", () => {
  it("accepts valid data", () => {
    const result = participantSchema.safeParse({
      name: "Alice",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      notes: "VIP member",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = participantSchema.safeParse({
      name: "",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid wallet address", () => {
    const result = participantSchema.safeParse({
      name: "Alice",
      walletAddress: "not-a-wallet",
    });
    expect(result.success).toBe(false);
  });

  it("allows empty notes", () => {
    const result = participantSchema.safeParse({
      name: "Alice",
      walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
      notes: "",
    });
    expect(result.success).toBe(true);
  });
});

describe("contestSchema", () => {
  it("accepts valid YYYY-MM-DD date", () => {
    const result = contestSchema.safeParse({
      name: "Weekly Contest",
      date: "2026-03-01",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-date string", () => {
    const result = contestSchema.safeParse({
      name: "Weekly Contest",
      date: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty date", () => {
    const result = contestSchema.safeParse({
      name: "Weekly Contest",
      date: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects script injection in date", () => {
    const result = contestSchema.safeParse({
      name: "Weekly Contest",
      date: "<script>alert(1)</script>",
    });
    expect(result.success).toBe(false);
  });

  it("rejects date in wrong format", () => {
    const result = contestSchema.safeParse({
      name: "Weekly Contest",
      date: "03/01/2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("addWinnerSchema", () => {
  it("accepts valid data", () => {
    const result = addWinnerSchema.safeParse({
      participantId: "abc123",
      prizeNote: "1st place",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty participantId", () => {
    const result = addWinnerSchema.safeParse({
      participantId: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("updatePayoutSchema", () => {
  it("accepts valid payout status", () => {
    for (const status of ["pending", "paid", "failed"] as const) {
      const result = updatePayoutSchema.safeParse({ payoutStatus: status });
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid payout status", () => {
    const result = updatePayoutSchema.safeParse({
      payoutStatus: "cancelled",
    });
    expect(result.success).toBe(false);
  });
});

describe("batchPayoutSchema", () => {
  it("accepts valid batch data", () => {
    const result = batchPayoutSchema.safeParse({
      winnerIds: ["id1", "id2"],
      payoutStatus: "paid",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty winnerIds array", () => {
    const result = batchPayoutSchema.safeParse({
      winnerIds: [],
      payoutStatus: "paid",
    });
    expect(result.success).toBe(false);
  });
});
