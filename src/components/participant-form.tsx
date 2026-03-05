"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Contest {
  id: string;
  name: string;
  date: string;
}

export interface ParticipantFormData {
  name: string;
  walletAddress: string;
  notes: string;
  contestId?: string;
}

interface ParticipantFormProps {
  initialData?: Partial<ParticipantFormData>;
  contests?: Contest[];
  onSubmit: (data: ParticipantFormData) => void;
  onCancel: () => void;
}

const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;
const ENS_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.eth$/;

function ParticipantForm({
  initialData,
  contests,
  onSubmit,
  onCancel,
}: ParticipantFormProps) {
  const [name, setName] = React.useState(initialData?.name ?? "");
  const [walletAddress, setWalletAddress] = React.useState(
    initialData?.walletAddress ?? "",
  );
  const [notes, setNotes] = React.useState(initialData?.notes ?? "");
  const [contestId, setContestId] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!name.trim()) {
      next.name = "Name is required.";
    }

    if (!walletAddress.trim()) {
      next.walletAddress = "Wallet address is required.";
    } else if (!WALLET_REGEX.test(walletAddress) && !ENS_REGEX.test(walletAddress)) {
      next.walletAddress =
        "Invalid wallet address. Must be 0x followed by 40 hex characters, or an ENS name (e.g., name.eth).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ name: name.trim(), walletAddress, notes: notes.trim(), contestId: contestId || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="participant-name"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Name
        </label>
        <Input
          id="participant-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Participant name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="participant-wallet"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Wallet Address
        </label>
        <Input
          id="participant-wallet"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="0x... or name.eth"
          className="font-mono"
        />
        {errors.walletAddress && (
          <p className="mt-1 text-sm text-destructive">
            {errors.walletAddress}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="participant-notes"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Notes
        </label>
        <textarea
          id="participant-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes..."
          rows={3}
          className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
        />
      </div>

      {!initialData && contests && contests.length > 0 && (
        <div>
          <label
            htmlFor="participant-contest"
            className="mb-1 block text-sm font-medium text-foreground"
          >
            Add to Contest
          </label>
          <select
            id="participant-contest"
            value={contestId}
            onChange={(e) => setContestId(e.target.value)}
            className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          >
            <option value="">None (optional)</option>
            {contests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({new Date(c.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Save Changes" : "Add Participant"}
        </Button>
      </div>
    </form>
  );
}

export { ParticipantForm };
