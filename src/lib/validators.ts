import { z } from "zod/v4";

const evmAddressRegex = /^0x[0-9a-fA-F]{40}$/;

export const evmAddress = z.string().regex(evmAddressRegex, "Invalid EVM wallet address").transform((addr) => addr.toLowerCase());

export const participantSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  walletAddress: evmAddress,
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export const contestSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional().or(z.literal("")),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export const addWinnerSchema = z.object({
  participantId: z.string().min(1),
  prizeNote: z.string().max(500).optional().or(z.literal("")),
});

export const updatePayoutSchema = z.object({
  payoutStatus: z.enum(["pending", "paid", "failed"]),
  payoutTxHash: z.string().optional().or(z.literal("")),
});

export const batchPayoutSchema = z.object({
  winnerIds: z.array(z.string().min(1)).min(1),
  payoutStatus: z.enum(["pending", "paid", "failed"]),
});
