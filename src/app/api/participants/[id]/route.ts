import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { participantSchema } from "@/lib/validators";
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

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Failed to get participant:", error);
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
    const validation = participantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [updated] = await db
      .update(participants)
      .set({
        name: data.name,
        walletAddress: data.walletAddress,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(eq(participants.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ participant: updated });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return NextResponse.json(
        { error: "A participant with this wallet address already exists" },
        { status: 409 }
      );
    }
    console.error("Failed to update participant:", error);
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
      .delete(participants)
      .where(eq(participants.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("FOREIGN KEY constraint failed")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot delete participant because they are a winner in one or more contests. Remove them from contests first.",
        },
        { status: 409 }
      );
    }
    console.error("Failed to delete participant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
