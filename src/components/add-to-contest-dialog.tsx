"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface Contest {
  id: string;
  name: string;
  date: string;
}

interface AddToContestDialogProps {
  open: boolean;
  participantName: string;
  contests: Contest[];
  serverError?: string | null;
  onClose: () => void;
  onSubmit: (contestId: string, prizeNote: string) => void;
}

function AddToContestDialog({
  open,
  participantName,
  contests,
  serverError,
  onClose,
  onSubmit,
}: AddToContestDialogProps) {
  const [contestId, setContestId] = React.useState("");
  const [prizeNote, setPrizeNote] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setContestId("");
      setPrizeNote("");
      setError("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contestId) {
      setError("Please select a contest.");
      return;
    }
    onSubmit(contestId, prizeNote.trim());
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Add "${participantName}" to Contest`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="contest-select"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Contest
          </label>
          <select
            id="contest-select"
            value={contestId}
            onChange={(e) => {
              setContestId(e.target.value);
              setError("");
            }}
            className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="">Select a contest...</option>
            {contests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-destructive">{error}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="prize-note"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Prize Note
          </label>
          <textarea
            id="prize-note"
            value={prizeNote}
            onChange={(e) => setPrizeNote(e.target.value)}
            placeholder="Optional prize note..."
            rows={2}
            className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          />
        </div>

        {serverError && (
          <p className="text-sm text-destructive">{serverError}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Add to Contest</Button>
        </div>
      </form>
    </Dialog>
  );
}

export { AddToContestDialog };
