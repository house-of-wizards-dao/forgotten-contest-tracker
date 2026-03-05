import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contests, contestWinners, participants } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

function escapeCsvField(value: string | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, id));

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    const winners = await db
      .select({
        name: participants.name,
        walletAddress: participants.walletAddress,
        payoutStatus: contestWinners.payoutStatus,
        prizeNote: contestWinners.prizeNote,
        prizeWizard: contestWinners.prizeWizard,
        prizeWarrior: contestWinners.prizeWarrior,
        prizeImpBox: contestWinners.prizeImpBox,
        payoutTxHash: contestWinners.payoutTxHash,
      })
      .from(contestWinners)
      .innerJoin(participants, eq(contestWinners.participantId, participants.id))
      .where(eq(contestWinners.contestId, id));

    const header = "Name,Wallet Address,Payout Status,Prize Note,Wizard,Warrior,Imp Box,Payout TX Hash";
    const rows = winners.map(
      (w) =>
        [
          escapeCsvField(w.name),
          escapeCsvField(w.walletAddress),
          escapeCsvField(w.payoutStatus),
          escapeCsvField(w.prizeNote),
          w.prizeWizard ? "Yes" : "No",
          w.prizeWarrior ? "Yes" : "No",
          w.prizeImpBox ? "Yes" : "No",
          escapeCsvField(w.payoutTxHash),
        ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const safeName = contest.name.replace(/[^a-zA-Z0-9_-]/g, "_") || "contest";
    const filename = `${safeName}_winners.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to export contest winners:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
