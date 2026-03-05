import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contestWinners } from "@/db/schema";
import { updatePayoutSchema } from "@/lib/validators";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string; winnerId: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId, winnerId } = await params;

    const [deleted] = await db
      .delete(contestWinners)
      .where(
        and(
          eq(contestWinners.id, winnerId),
          eq(contestWinners.contestId, contestId)
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Winner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove winner:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId, winnerId } = await params;
    const body = await request.json();
    const validation = updatePayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [updated] = await db
      .update(contestWinners)
      .set({
        payoutStatus: data.payoutStatus,
        payoutTxHash: data.payoutTxHash || null,
      })
      .where(
        and(
          eq(contestWinners.id, winnerId),
          eq(contestWinners.contestId, contestId)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Winner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ winner: updated });
  } catch (error) {
    console.error("Failed to update payout:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
