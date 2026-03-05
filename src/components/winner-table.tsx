"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";
import { PayoutBadge, type PayoutStatus } from "@/components/payout-badge";
import { formatAddress } from "@/lib/utils";

export interface Winner {
  id: string;
  contestId: string;
  participantId: string;
  payoutStatus: PayoutStatus;
  payoutTxHash: string | null;
  prizeNote: string | null;
  participant: {
    id: string;
    name: string;
    walletAddress: string;
  };
}

interface WinnerTableProps {
  winners: Winner[];
  contestId: string;
  onStatusChange: (winnerId: string, status: PayoutStatus) => void;
  onRemove: (winnerId: string) => void;
  onRefresh: () => void;
}

function WinnerTable({ winners, contestId, onStatusChange, onRemove, onRefresh }: WinnerTableProps) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = React.useState<PayoutStatus>("paid");

  const allSelected =
    winners.length > 0 && selected.size === winners.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(winners.map((w) => w.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkUpdate = async () => {
    const res = await fetch(`/api/contests/${contestId}/winners/batch`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        winnerIds: Array.from(selected),
        payoutStatus: bulkStatus,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      alert(err.error ?? "Failed to update statuses");
      return;
    }
    setSelected(new Set());
    onRefresh();
  };

  if (winners.length === 0) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        No winners added yet. Use the search above to add participants as
        winners.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-md bg-muted px-4 py-2 text-sm">
          <span className="text-muted-foreground">
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as PayoutStatus)}
            className="rounded border border-border bg-background px-2 py-1 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>
          <Button size="sm" onClick={handleBulkUpdate}>
            Update Status
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-border cursor-pointer"
                  aria-label="Select all winners"
                />
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Wallet
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Prize Note
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Payout Status
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {winners.map((w) => (
              <tr
                key={w.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(w.id)}
                    onChange={() => toggleSelect(w.id)}
                    className="h-4 w-4 rounded border-border cursor-pointer"
                    aria-label={`Select ${w.participant.name}`}
                  />
                </td>
                <td className="px-4 py-3 font-medium">
                  {w.participant.name}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs ${w.participant.walletAddress.endsWith('.eth') ? '' : 'font-mono'}`}>
                    {formatAddress(w.participant.walletAddress)}
                    <CopyButton text={w.participant.walletAddress} />
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {w.prizeNote || "--"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <PayoutBadge status={w.payoutStatus} />
                    <select
                      value={w.payoutStatus}
                      onChange={(e) =>
                        onStatusChange(w.id, e.target.value as PayoutStatus)
                      }
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs cursor-pointer"
                      aria-label={`Change payout status for ${w.participant.name}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onRemove(w.id)}
                  >
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { WinnerTable };
