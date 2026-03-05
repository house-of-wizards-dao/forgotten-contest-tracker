"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  ParticipantForm,
  type ParticipantFormData,
} from "@/components/participant-form";
import {
  ParticipantTable,
  type Participant,
} from "@/components/participant-table";
import { AddToContestDialog } from "@/components/add-to-contest-dialog";

interface Contest {
  id: string;
  name: string;
  date: string;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = React.useState<Participant[]>([]);
  const [contests, setContests] = React.useState<Contest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Participant | null>(null);
  const [addToContestParticipant, setAddToContestParticipant] =
    React.useState<Participant | null>(null);

  const fetchParticipants = React.useCallback(async () => {
    try {
      const res = await fetch("/api/participants");
      const data = await res.json();
      setParticipants(data.participants ?? []);
    } catch {
      console.error("Failed to fetch participants");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContests = React.useCallback(async () => {
    try {
      const res = await fetch("/api/contests");
      const data = await res.json();
      setContests(data.contests ?? []);
    } catch {
      console.error("Failed to fetch contests");
    }
  }, []);

  React.useEffect(() => {
    fetchParticipants();
    fetchContests();
  }, [fetchParticipants, fetchContests]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (p: Participant) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
  };

  const [serverError, setServerError] = React.useState<string | null>(null);

  const handleSubmit = async (data: ParticipantFormData) => {
    setServerError(null);
    const url = editing
      ? `/api/participants/${editing.id}`
      : "/api/participants";
    const method = editing ? "PUT" : "POST";
    const { contestId, ...participantData } = data;
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(participantData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      setServerError(err.error ?? "Failed to save participant");
      return;
    }

    // If creating and a contest was selected, add them as a winner
    if (!editing && contestId) {
      const result = await res.json();
      const participantId = result.participant?.id;
      if (participantId) {
        const winnerRes = await fetch(`/api/contests/${contestId}/winners`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantId }),
        });
        if (!winnerRes.ok) {
          const err = await winnerRes
            .json()
            .catch(() => ({ error: "Request failed" }));
          setServerError(
            `Participant created but failed to add to contest: ${err.error ?? "Unknown error"}`,
          );
          closeDialog();
          await fetchParticipants();
          return;
        }
      }
    }

    closeDialog();
    await fetchParticipants();
  };

  const handleDelete = async (p: Participant) => {
    if (
      !window.confirm(
        `Delete participant "${p.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    const res = await fetch(`/api/participants/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      alert(err.error ?? "Failed to delete participant");
      return;
    }
    await fetchParticipants();
  };

  const [contestError, setContestError] = React.useState<string | null>(null);

  const handleAddToContest = async (contestId: string, prizeNote: string) => {
    if (!addToContestParticipant) return;
    setContestError(null);
    const res = await fetch(`/api/contests/${contestId}/winners`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId: addToContestParticipant.id,
        prizeNote: prizeNote || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      setContestError(err.error ?? "Failed to add to contest");
      return;
    }
    setAddToContestParticipant(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {participants.length} participant
            {participants.length !== 1 ? "s" : ""} registered
          </p>
        </div>
        <Button onClick={openCreate}>Add Participant</Button>
      </div>

      <ParticipantTable
        participants={participants}
        onEdit={openEdit}
        onDelete={handleDelete}
        onAddToContest={setAddToContestParticipant}
      />

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        title={editing ? "Edit Participant" : "Add Participant"}
      >
        {serverError && (
          <p className="mb-4 text-sm text-destructive">{serverError}</p>
        )}
        <ParticipantForm
          key={editing?.id ?? "new"}
          initialData={
            editing
              ? {
                  name: editing.name,
                  walletAddress: editing.walletAddress,
                  notes: editing.notes ?? "",
                }
              : undefined
          }
          contests={contests}
          onSubmit={handleSubmit}
          onCancel={closeDialog}
        />
      </Dialog>

      <AddToContestDialog
        open={addToContestParticipant !== null}
        participantName={addToContestParticipant?.name ?? ""}
        contests={contests}
        serverError={contestError}
        onClose={() => {
          setAddToContestParticipant(null);
          setContestError(null);
        }}
        onSubmit={handleAddToContest}
      />
    </div>
  );
}
