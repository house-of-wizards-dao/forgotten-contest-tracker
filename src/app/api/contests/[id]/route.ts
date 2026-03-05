import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contests, contestWinners, participants } from "@/db/schema";
import { contestSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

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
        id: contestWinners.id,
        contestId: contestWinners.contestId,
        participantId: contestWinners.participantId,
        payoutStatus: contestWinners.payoutStatus,
        payoutTxHash: contestWinners.payoutTxHash,
        prizeNote: contestWinners.prizeNote,
        prizeWizard: contestWinners.prizeWizard,
        prizeWarrior: contestWinners.prizeWarrior,
        prizeImpBox: contestWinners.prizeImpBox,
        participant: {
          id: participants.id,
          name: participants.name,
          walletAddress: participants.walletAddress,
        },
      })
      .from(contestWinners)
      .innerJoin(participants, eq(contestWinners.participantId, participants.id))
      .where(eq(contestWinners.contestId, id));

    return NextResponse.json({ contest, winners });
  } catch (error) {
    console.error("Failed to get contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = contestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [updated] = await db
      .update(contests)
      .set({
        name: data.name,
        description: data.description || null,
        date: data.date,
        updatedAt: new Date(),
      })
      .where(eq(contests.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contest: updated });
  } catch (error) {
    console.error("Failed to update contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(contests)
      .where(eq(contests.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
