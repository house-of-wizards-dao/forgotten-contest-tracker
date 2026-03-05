"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { formatAddress } from "@/lib/utils";

export interface Participant {
  id: string;
  name: string;
  walletAddress: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ParticipantTableProps {
  participants: Participant[];
  onEdit: (participant: Participant) => void;
  onDelete: (participant: Participant) => void;
}

function ParticipantTable({
  participants,
  onEdit,
  onDelete,
}: ParticipantTableProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!search.trim()) return participants;
    const q = search.toLowerCase();
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.walletAddress.toLowerCase().includes(q),
    );
  }, [participants, search]);

  if (participants.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No participants yet. Add one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by name or wallet address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Wallet
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Notes
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 font-mono text-xs">
                    {formatAddress(p.walletAddress)}
                    <CopyButton text={p.walletAddress} />
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {p.notes || "--"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(p)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(p)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-muted-foreground"
                >
                  No participants match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { ParticipantTable };
