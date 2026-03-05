import { sqliteTable, text, integer, uniqueIndex, check } from "drizzle-orm/sqlite-core";

export const PRIZE_TYPES = ["wizard", "warrior", "impBox"] as const;
export type PrizeType = typeof PRIZE_TYPES[number];
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";

export const participants = sqliteTable("participants", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const contests = sqliteTable("contests", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  check("date_format", sql`${table.date} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'`),
]);

export const contestWinners = sqliteTable("contest_winners", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  contestId: text("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  participantId: text("participant_id").notNull().references(() => participants.id, { onDelete: "restrict" }),
  payoutStatus: text("payout_status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  payoutTxHash: text("payout_tx_hash"),
  prizeNote: text("prize_note"),
  prizeWizard: integer("prize_wizard", { mode: "boolean" }).notNull().default(false),
  prizeWarrior: integer("prize_warrior", { mode: "boolean" }).notNull().default(false),
  prizeImpBox: integer("prize_imp_box", { mode: "boolean" }).notNull().default(false),
}, (table) => [
  uniqueIndex("contest_participant_unique").on(table.contestId, table.participantId),
]);
