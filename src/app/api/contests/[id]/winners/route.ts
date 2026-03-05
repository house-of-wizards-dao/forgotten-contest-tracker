import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contests, contestWinners, participants } from "@/db/schema";
import { addWinnerSchema } from "@/lib/validators";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId } = await params;
    const body = await request.json();
    const validation = addWinnerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify contest exists
    const [contest] = await db
      .select()
      .from(contests)
      .where(eq(contests.id, contestId));

    if (!contest) {
      return NextResponse.json(
        { error: "Contest not found" },
        { status: 404 }
      );
    }

    // Verify participant exists
    const [participant] = await db
      .select()
      .from(participants)
      .where(eq(participants.id, data.participantId));

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    const [winner] = await db
      .insert(contestWinners)
      .values({
        contestId,
        participantId: data.participantId,
        prizeNote: data.prizeNote || null,
      })
      .returning();

    return NextResponse.json({ winner }, { status: 201 });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return NextResponse.json(
        { error: "This participant is already a winner in this contest" },
        { status: 409 }
      );
    }
    console.error("Failed to add winner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
