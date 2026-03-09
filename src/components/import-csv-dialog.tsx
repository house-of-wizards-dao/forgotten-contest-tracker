"use client";

import * as React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const PRIZE_OPTIONS = [
  { value: "wizard", label: "Wizard" },
  { value: "warrior", label: "Warrior" },
  { value: "impBox", label: "Imp Box" },
] as const;

interface CsvRow {
  contestant: string;
  wallet: string;
  entries: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors?: Array<{ row: number; contestant: string; message: string }>;
}

export interface ImportCsvDialogProps {
  open: boolean;
  onClose: () => void;
  contestId: string;
  onImportComplete: () => void;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        fields.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // Skip header row
  return lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    return {
      contestant: fields[0] ?? "",
      wallet: fields[1] ?? "",
      entries: fields[2] ?? "",
    };
  });
}

export function ImportCsvDialog({
  open,
  onClose,
  contestId,
  onImportComplete,
}: ImportCsvDialogProps) {
  const [prize, setPrize] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<CsvRow[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const reset = React.useCallback(() => {
    setPrize("");
    setFile(null);
    setPreview([]);
    setImporting(false);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = React.useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFileChange = React.useCallback(
    (selectedFile: File | null) => {
      setResult(null);
      setError(null);

      if (!selectedFile) {
        setFile(null);
        setPreview([]);
        return;
      }

      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text === "string") {
          const rows = parseCsv(text);
          setPreview(rows);
        }
      };
      reader.onerror = () => {
        setError("Failed to read the file.");
        setPreview([]);
      };
      reader.readAsText(selectedFile);
    },
    [],
  );

  const handleDrop = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile && droppedFile.name.endsWith(".csv")) {
        handleFileChange(droppedFile);
      }
    },
    [handleFileChange],
  );

  const handleDragOver = React.useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  const handleImport = React.useCallback(async () => {
    if (!file || !prize) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("prize", prize);

      const response = await fetch(
        `/api/contests/${contestId}/import`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? `Import failed with status ${response.status}`,
        );
      }

      const data: ImportResult = await response.json();
      setResult(data);
      onImportComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setImporting(false);
    }
  }, [file, prize, contestId, onImportComplete]);

  const previewRows = preview.slice(0, 10);
  const remainingCount = preview.length - previewRows.length;

  return (
    <Dialog open={open} onClose={handleClose} title="Import CSV" className="max-w-2xl">
      <div className="space-y-5">
        {/* Prize selector */}
        <div className="space-y-1.5">
          <label
            htmlFor="prize-select"
            className="block text-sm font-medium text-foreground"
          >
            Prize type <span className="text-destructive">*</span>
          </label>
          <select
            id="prize-select"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            disabled={importing}
            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select a prize...</option>
            {PRIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* File input drop zone */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">
            CSV file <span className="text-destructive">*</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-muted-foreground"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
              disabled={importing}
            />
            {file ? (
              <p className="text-sm text-foreground">{file.name}</p>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-2 text-muted-foreground"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-sm text-muted-foreground">
                  Choose a CSV file or drag it here
                </p>
              </>
            )}
          </div>
        </div>

        {/* Preview table */}
        {previewRows.length > 0 && !result && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              Preview ({preview.length} row{preview.length !== 1 ? "s" : ""})
            </h3>
            <div className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Row #
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Contestant
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                      Wallet
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                      Entries
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx} className="border-b border-border last:border-b-0">
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 text-foreground">{row.contestant}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs text-foreground">
                        {row.wallet}
                      </td>
                      <td className="px-3 py-2 text-right text-foreground">
                        {row.entries}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {remainingCount > 0 && (
              <p className="text-xs text-muted-foreground">
                and {remainingCount} more...
              </p>
            )}
          </div>
        )}

        {/* Results section */}
        {result && (
          <div className="space-y-2 rounded-md border border-border p-4">
            <p className="text-sm text-foreground">
              <span className="font-medium">{result.imported}</span> winner
              {result.imported !== 1 ? "s" : ""} imported,{" "}
              <span className="font-medium">{result.skipped}</span> skipped
              (already existed)
            </p>
            {result.errors && result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Errors:</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto">
                  {result.errors.map((err, idx) => (
                    <li
                      key={idx}
                      className="rounded bg-destructive/10 px-3 py-1.5 text-xs text-destructive"
                    >
                      Row {err.row} ({err.contestant}): {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* General error */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || !prize || importing}
            >
              {importing ? "Importing..." : "Import"}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
