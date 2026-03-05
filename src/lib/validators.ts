import { z } from "zod/v4";

const evmAddressRegex = /^0x[0-9a-fA-F]{40}$/;
const ensNameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.eth$/;

export const evmAddress = z
  .string()
  .refine(
    (val) => evmAddressRegex.test(val) || ensNameRegex.test(val.toLowerCase()),
    "Invalid wallet address. Must be a 0x hex address or an ENS name (e.g., name.eth)."
  )
  .transform((val) => val.toLowerCase());

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
  prizeWizard: z.boolean().optional().default(false),
  prizeWarrior: z.boolean().optional().default(false),
  prizeImpBox: z.boolean().optional().default(false),
});

export const updatePayoutSchema = z.object({
  payoutStatus: z.enum(["pending", "paid", "failed"]),
  payoutTxHash: z.string().optional().or(z.literal("")),
  prizeWizard: z.boolean().optional(),
  prizeWarrior: z.boolean().optional(),
  prizeImpBox: z.boolean().optional(),
});

export const batchPayoutSchema = z.object({
  winnerIds: z.array(z.string().min(1)).min(1),
  payoutStatus: z.enum(["pending", "paid", "failed"]),
});
