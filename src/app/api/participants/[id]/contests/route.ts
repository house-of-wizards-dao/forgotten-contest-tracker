import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contestWinners, contests, participants } from "@/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, id));

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const results = await db
      .select({
        winnerId: contestWinners.id,
        contestId: contests.id,
        contestName: contests.name,
        contestDate: contests.date,
        payoutStatus: contestWinners.payoutStatus,
        payoutTxHash: contestWinners.payoutTxHash,
        prizeNote: contestWinners.prizeNote,
        prizeWizard: contestWinners.prizeWizard,
        prizeWarrior: contestWinners.prizeWarrior,
        prizeImpBox: contestWinners.prizeImpBox,
      })
      .from(contestWinners)
      .innerJoin(contests, eq(contestWinners.contestId, contests.id))
      .where(eq(contestWinners.participantId, id));

    return NextResponse.json({ contests: results });
  } catch (error) {
    console.error("Failed to fetch participant contests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
