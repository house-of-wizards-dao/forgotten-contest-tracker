import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contests, contestWinners, participants } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB

const VALID_PRIZES = ["wizard", "warrior", "impBox"] as const;
type Prize = (typeof VALID_PRIZES)[number];

const evmAddressRegex = /^0x[0-9a-fA-F]{40}$/;
const ensNameRegex =
  /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.eth$/;

function isValidWallet(value: string): boolean {
  return evmAddressRegex.test(value) || ensNameRegex.test(value.toLowerCase());
}

/**
 * Parse CSV text that may contain quoted fields.
 * Handles: double-quote escaping (""), commas inside quotes, CRLF/LF.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      if (text[i] === '"') {
        // Quoted field
        i++; // skip opening quote
        let field = "";
        while (i < len) {
          if (text[i] === '"') {
            if (i + 1 < len && text[i + 1] === '"') {
              field += '"';
              i += 2;
            } else {
              i++; // skip closing quote
              break;
            }
          } else {
            field += text[i];
            i++;
          }
        }
        row.push(field);
      } else {
        // Unquoted field
        let field = "";
        while (i < len && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") {
          field += text[i];
          i++;
        }
        row.push(field);
      }

      if (i < len && text[i] === ",") {
        i++; // skip comma, continue to next field
      } else {
        break; // end of row
      }
    }

    // Skip line endings
    if (i < len && text[i] === "\r") i++;
    if (i < len && text[i] === "\n") i++;

    // Skip completely empty trailing rows
    if (row.length === 1 && row[0] === "" && i >= len) break;

    rows.push(row);
  }

  return rows;
}

function mapHeaders(headerRow: string[]): { contestant: number; wallet: number; entries: number } | null {
  const normalized = headerRow.map((h) => h.trim().toLowerCase());
  const contestant = normalized.findIndex((h) => h === "contestant");
  const wallet = normalized.findIndex((h) => h === "wallet");
  const entries = normalized.findIndex((h) => h === "number of entries");

  if (contestant === -1 || wallet === -1 || entries === -1) return null;
  return { contestant, wallet, entries };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: contestId } = await params;

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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file");
    const prize = formData.get("prize");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "A CSV file is required" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 1MB limit" },
        { status: 400 }
      );
    }

    if (typeof prize !== "string" || !VALID_PRIZES.includes(prize as Prize)) {
      return NextResponse.json(
        { error: `Invalid prize type. Must be one of: ${VALID_PRIZES.join(", ")}` },
        { status: 400 }
      );
    }

    const prizeType = prize as Prize;

    // Read and parse CSV
    const csvText = await file.text();
    const rows = parseCsv(csvText);

    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain a header row and at least one data row" },
        { status: 400 }
      );
    }

    const headerMap = mapHeaders(rows[0]);
    if (!headerMap) {
      return NextResponse.json(
        { error: "CSV must have columns: Contestant, Wallet, Number of entries" },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors: { row: number; contestant: string; message: string }[] = [];

    // Process data rows (skip header at index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1; // 1-based, counting the header

      const contestantName = row[headerMap.contestant]?.trim() ?? "";
      const walletRaw = row[headerMap.wallet]?.trim() ?? "";
      const entriesRaw = row[headerMap.entries]?.trim() ?? "";

      // Skip fully empty rows
      if (!contestantName && !walletRaw && !entriesRaw) continue;

      // Validate contestant name
      if (!contestantName) {
        errors.push({ row: rowNumber, contestant: contestantName, message: "Contestant name is required" });
        continue;
      }

      // Validate wallet
      if (!walletRaw) {
        errors.push({ row: rowNumber, contestant: contestantName, message: "Wallet address is required" });
        continue;
      }

      if (!isValidWallet(walletRaw)) {
        errors.push({
          row: rowNumber,
          contestant: contestantName,
          message: "Invalid wallet address. Must be a 0x hex address or an ENS name (e.g., name.eth).",
        });
        continue;
      }

      const walletAddress = walletRaw.toLowerCase();

      // Validate number of entries
      const entriesNum = parseInt(entriesRaw, 10);
      if (isNaN(entriesNum) || entriesNum < 1) {
        errors.push({ row: rowNumber, contestant: contestantName, message: "Number of entries must be a positive integer" });
        continue;
      }

      // Upsert participant
      let participantId: string;

      const [existingParticipant] = await db
        .select()
        .from(participants)
        .where(eq(participants.walletAddress, walletAddress));

      if (existingParticipant) {
        participantId = existingParticipant.id;
        // Update name if different
        if (existingParticipant.name !== contestantName) {
          await db
            .update(participants)
            .set({ name: contestantName, updatedAt: new Date() })
            .where(eq(participants.id, existingParticipant.id));
        }
      } else {
        const [newParticipant] = await db
          .insert(participants)
          .values({ name: contestantName, walletAddress })
          .returning();
        participantId = newParticipant.id;
      }

      // Check if already a winner in this contest
      const [existingWinner] = await db
        .select()
        .from(contestWinners)
        .where(
          and(
            eq(contestWinners.contestId, contestId),
            eq(contestWinners.participantId, participantId)
          )
        );

      if (existingWinner) {
        skipped++;
        continue;
      }

      // Create contest winner record
      const prizeNote = entriesNum > 1 ? `${entriesNum} entries` : null;

      await db.insert(contestWinners).values({
        contestId,
        participantId,
        prizeNote,
        prizeWizard: prizeType === "wizard",
        prizeWarrior: prizeType === "warrior",
        prizeImpBox: prizeType === "impBox",
      });

      imported++;
    }

    return NextResponse.json({ imported, skipped, errors });
  } catch (error) {
    console.error("Failed to import CSV:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
