"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";
import { PayoutBadge } from "@/components/payout-badge";
import { PrizeBadges } from "@/components/prize-badges";
import { formatAddress } from "@/lib/utils";

export interface Participant {
  id: string;
  name: string;
  walletAddress: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ParticipantContest {
  winnerId: string;
  contestId: string;
  contestName: string;
  contestDate: string;
  payoutStatus: "pending" | "paid" | "failed";
  payoutTxHash: string | null;
  prizeNote: string | null;
  prizeWizard: boolean;
  prizeWarrior: boolean;
  prizeImpBox: boolean;
}

interface ParticipantTableProps {
  participants: Participant[];
  onEdit: (participant: Participant) => void;
  onDelete: (participant: Participant) => void;
  onAddToContest?: (participant: Participant) => void;
}

function ParticipantTable({
  participants,
  onEdit,
  onDelete,
  onAddToContest,
}: ParticipantTableProps) {
  const [search, setSearch] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [contestData, setContestData] = React.useState<
    Record<string, ParticipantContest[]>
  >({});
  const [loadingContests, setLoadingContests] = React.useState<string | null>(
    null,
  );

  // Clear cache when participants change (after add-to-contest, etc.)
  React.useEffect(() => {
    setContestData({});
    setExpandedId(null);
  }, [participants]);

  const toggleExpand = async (participantId: string) => {
    if (expandedId === participantId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(participantId);

    if (!contestData[participantId]) {
      setLoadingContests(participantId);
      try {
        const res = await fetch(
          `/api/participants/${participantId}/contests`,
        );
        const data = await res.json();
        setContestData((prev) => ({
          ...prev,
          [participantId]: data.contests ?? [],
        }));
      } catch {
        console.error("Failed to fetch participant contests");
      } finally {
        setLoadingContests(null);
      }
    }
  };

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
              <th className="w-10 px-4 py-3" />
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
              <React.Fragment key={p.id}>
                <tr className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleExpand(p.id)}
                      className="cursor-pointer rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label={
                        expandedId === p.id
                          ? "Collapse contests"
                          : "View contests"
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform ${expandedId === p.id ? "rotate-90" : ""}`}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-xs ${p.walletAddress.endsWith(".eth") ? "" : "font-mono"}`}
                    >
                      {formatAddress(p.walletAddress)}
                      <CopyButton text={p.walletAddress} />
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.notes || "--"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {onAddToContest && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onAddToContest(p)}
                        >
                          Add to Contest
                        </Button>
                      )}
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
                {expandedId === p.id && (
                  <tr className="bg-muted/20">
                    <td colSpan={5} className="px-4 py-3">
                      {loadingContests === p.id ? (
                        <span className="text-sm text-muted-foreground">
                          Loading contests...
                        </span>
                      ) : (contestData[p.id]?.length ?? 0) === 0 ? (
                        <span className="text-sm text-muted-foreground">
                          Not in any contests.
                        </span>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Contests ({contestData[p.id].length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {contestData[p.id].map((c) => (
                              <a
                                key={c.winnerId}
                                href={`/contests/${c.contestId}`}
                                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted/50"
                              >
                                <span className="font-medium">
                                  {c.contestName}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    c.contestDate,
                                  ).toLocaleDateString()}
                                </span>
                                <PayoutBadge status={c.payoutStatus} />
                                <PrizeBadges
                                  prizeWizard={c.prizeWizard}
                                  prizeWarrior={c.prizeWarrior}
                                  prizeImpBox={c.prizeImpBox}
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
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
