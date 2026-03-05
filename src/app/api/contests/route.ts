import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contests } from "@/db/schema";
import { contestSchema } from "@/lib/validators";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select()
      .from(contests)
      .orderBy(desc(contests.date));

    return NextResponse.json({ contests: result });
  } catch (error) {
    console.error("Failed to list contests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = contestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [contest] = await db
      .insert(contests)
      .values({
        name: data.name,
        description: data.description || null,
        defaultPrize: data.defaultPrize ?? null,
        date: data.date,
      })
      .returning();

    return NextResponse.json({ contest }, { status: 201 });
  } catch (error) {
    console.error("Failed to create contest:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
