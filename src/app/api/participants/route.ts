import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { participants } from "@/db/schema";
import { participantSchema } from "@/lib/validators";
import { asc, or, like } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");

    let query = db.select().from(participants).orderBy(asc(participants.name));

    if (search) {
      const escaped = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
      const pattern = `%${escaped}%`;
      query = query.where(
        or(
          like(participants.name, pattern),
          like(participants.walletAddress, pattern)
        )
      ) as typeof query;
    }

    const result = await query;
    return NextResponse.json({ participants: result });
  } catch (error) {
    console.error("Failed to list participants:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = participantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [participant] = await db
      .insert(participants)
      .values({
        name: data.name,
        walletAddress: data.walletAddress,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json({ participant }, { status: 201 });
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
    console.error("Failed to create participant:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
