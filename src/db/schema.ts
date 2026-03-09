import { pgTable, text, timestamp, boolean, uniqueIndex, check } from "drizzle-orm/pg-core";

export const PRIZE_TYPES = ["wizard", "warrior", "impBox"] as const;
export type PrizeType = typeof PRIZE_TYPES[number];
import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";

export const participants = pgTable("participants", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
});

export const contests = pgTable("contests", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  description: text("description"),
  defaultPrize: text("default_prize").$type<"wizard" | "warrior" | "impBox">(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updated_at").notNull().$defaultFn(() => new Date()),
}, (table) => [
  check("date_format", sql`${table.date} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`),
]);

export const contestWinners = pgTable("contest_winners", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  contestId: text("contest_id").notNull().references(() => contests.id, { onDelete: "cascade" }),
  participantId: text("participant_id").notNull().references(() => participants.id, { onDelete: "restrict" }),
  payoutStatus: text("payout_status").$type<"pending" | "paid" | "failed">().notNull().default("pending"),
  payoutTxHash: text("payout_tx_hash"),
  prizeNote: text("prize_note"),
  prizeWizard: boolean("prize_wizard").notNull().default(false),
  prizeWarrior: boolean("prize_warrior").notNull().default(false),
  prizeImpBox: boolean("prize_imp_box").notNull().default(false),
}, (table) => [
  uniqueIndex("contest_participant_unique").on(table.contestId, table.participantId),
]);
