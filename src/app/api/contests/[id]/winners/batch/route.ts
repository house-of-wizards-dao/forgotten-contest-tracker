import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contestWinners } from "@/db/schema";
import { batchPayoutSchema } from "@/lib/validators";
import { eq, and, inArray } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId } = await params;
    const body = await request.json();
    const validation = batchPayoutSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const updated = await db
      .update(contestWinners)
      .set({
        payoutStatus: data.payoutStatus,
      })
      .where(
        and(
          eq(contestWinners.contestId, contestId),
          inArray(contestWinners.id, data.winnerIds)
        )
      )
      .returning();

    return NextResponse.json({
      updated: updated.length,
      winners: updated,
    });
  } catch (error) {
    console.error("Failed to batch update payouts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
