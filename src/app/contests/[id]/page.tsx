"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { WinnerCombobox } from "@/components/winner-combobox";
import { WinnerTable, type Winner } from "@/components/winner-table";
import type { PayoutStatus } from "@/components/payout-badge";

interface Contest {
  id: string;
  name: string;
  description: string | null;
  defaultPrize: "wizard" | "warrior" | "impBox" | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface ParticipantRef {
  id: string;
  name: string;
  walletAddress: string;
}

export default function ContestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [contest, setContest] = React.useState<Contest | null>(null);
  const [winners, setWinners] = React.useState<Winner[]>([]);
  const [allParticipants, setAllParticipants] = React.useState<
    ParticipantRef[]
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editDefaultPrize, setEditDefaultPrize] = React.useState<string | null>(null);

  const fetchContest = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/contests/${params.id}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setContest(data.contest);
      setWinners(data.winners ?? []);
    } catch {
      setNotFound(true);
    }
  }, [params.id]);

  const fetchParticipants = React.useCallback(async () => {
    try {
      const res = await fetch("/api/participants");
      const data = await res.json();
      setAllParticipants(data.participants ?? []);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    Promise.all([fetchContest(), fetchParticipants()]).finally(() =>
      setLoading(false),
    );
  }, [fetchContest, fetchParticipants]);

  // --- Handlers ---

  const openEdit = () => {
    if (!contest) return;
    setEditName(contest.name);
    setEditDate(contest.date.slice(0, 10));
    setEditDescription(contest.description ?? "");
    setEditDefaultPrize(contest.defaultPrize);
    setEditOpen(true);
  };

  const [error, setError] = React.useState<string | null>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch(`/api/contests/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        date: editDate,
        description: editDescription.trim() || undefined,
        defaultPrize: editDefaultPrize || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      setError(err.error ?? "Failed to update contest");
      return;
    }
    setEditOpen(false);
    await fetchContest();
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Delete this contest and all its winner records? This cannot be undone.",
      )
    ) {
      return;
    }
    const res = await fetch(`/api/contests/${params.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      alert(err.error ?? "Failed to delete contest");
      return;
    }
    router.push("/contests");
  };

  const handleAddWinner = async (participant: ParticipantRef) => {
    setError(null);
    const res = await fetch(`/api/contests/${params.id}/winners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId: participant.id }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      setError(err.error ?? "Failed to add winner");
      return;
    }
    await fetchContest();
  };

  const handleStatusChange = async (
    winnerId: string,
    status: PayoutStatus,
  ) => {
    const res = await fetch(`/api/contests/${params.id}/winners/${winnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutStatus: status }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      alert(err.error ?? "Failed to update status");
      return;
    }
    await fetchContest();
  };

  const handleRemoveWinner = async (winnerId: string) => {
    const res = await fetch(`/api/contests/${params.id}/winners/${winnerId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      alert(err.error ?? "Failed to remove winner");
      return;
    }
    await fetchContest();
  };

  const handlePrizeToggle = async (
    winnerId: string,
    prizeType: "wizard" | "warrior" | "impBox",
    value: boolean,
  ) => {
    const winner = winners.find((w) => w.id === winnerId);
    if (!winner) return;

    const prizeField =
      prizeType === "wizard" ? "prizeWizard" :
      prizeType === "warrior" ? "prizeWarrior" : "prizeImpBox";

    const res = await fetch(`/api/contests/${params.id}/winners/${winnerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payoutStatus: winner.payoutStatus,
        [prizeField]: value,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      alert(err.error ?? "Failed to update prize");
      return;
    }
    await fetchContest();
  };

  const handleExport = () => {
    window.open(`/api/contests/${params.id}/export`, "_blank");
  };

  // --- Render ---

  if (loading) {
    return (
      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (notFound || !contest) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Contest Not Found</h1>
        <p className="text-muted-foreground">
          The contest you are looking for does not exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => router.push("/contests")}>
          Back to Contests
        </Button>
      </div>
    );
  }

  const existingWinnerIds = winners.map((w) => w.participantId);

  return (
    <div className="space-y-8">
      {/* Contest header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{contest.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date(contest.date).toLocaleDateString()}
          </p>
          {contest.description && (
            <p className="mt-2 text-muted-foreground">{contest.description}</p>
          )}
          {contest.defaultPrize && (
            <p className="mt-1 text-sm text-muted-foreground">
              Default prize:{" "}
              <span className="font-medium text-foreground">
                {contest.defaultPrize === "impBox" ? "Imp Box" : contest.defaultPrize.charAt(0).toUpperCase() + contest.defaultPrize.slice(1)}
              </span>
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEdit}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Add winner */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Add Winner</h2>
        <WinnerCombobox
          participants={allParticipants}
          existingWinnerIds={existingWinnerIds}
          onSelect={handleAddWinner}
        />
      </div>

      {/* Winners table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Winners ({winners.length})
          </h2>
          {winners.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export CSV
            </Button>
          )}
        </div>
        <WinnerTable
          winners={winners}
          contestId={params.id}
          onStatusChange={handleStatusChange}
          onRemove={handleRemoveWinner}
          onRefresh={fetchContest}
          onPrizeToggle={handlePrizeToggle}
        />
      </div>

      {/* Edit dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Contest"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-contest-name"
              className="mb-1 block text-sm font-medium"
            >
              Name
            </label>
            <Input
              id="edit-contest-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="edit-contest-date"
              className="mb-1 block text-sm font-medium"
            >
              Date
            </label>
            <Input
              id="edit-contest-date"
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
            />
          </div>

          <div>
            <label
              htmlFor="edit-contest-description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="edit-contest-description"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
          </div>

          <div>
            <label
              htmlFor="edit-contest-default-prize"
              className="mb-1 block text-sm font-medium"
            >
              Default Prize
            </label>
            <select
              id="edit-contest-default-prize"
              value={editDefaultPrize ?? ""}
              onChange={(e) => setEditDefaultPrize(e.target.value || null)}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            >
              <option value="">None</option>
              <option value="wizard">Wizard</option>
              <option value="warrior">Warrior</option>
              <option value="impBox">Imp Box</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              Winners added to this contest will automatically receive this prize.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
