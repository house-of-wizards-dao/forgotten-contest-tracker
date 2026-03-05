"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";

interface Contest {
  id: string;
  name: string;
  description: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export default function ContestsPage() {
  const router = useRouter();
  const [contests, setContests] = React.useState<Contest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Form state
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>(
    {},
  );

  const fetchContests = React.useCallback(async () => {
    try {
      const res = await fetch("/api/contests");
      const data = await res.json();
      setContests(data.contests ?? []);
    } catch {
      console.error("Failed to fetch contests");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchContests();
  }, [fetchContests]);

  const sorted = React.useMemo(
    () =>
      [...contests].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [contests],
  );

  const openDialog = () => {
    setName("");
    setDate("");
    setDescription("");
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!date) errors.date = "Date is required.";
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const res = await fetch("/api/contests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        date,
        description: description.trim() || undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Request failed" }));
      setFormErrors({ server: err.error ?? "Failed to create contest" });
      return;
    }
    setDialogOpen(false);
    await fetchContests();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Contests</h1>
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
          <h1 className="text-2xl font-bold tracking-tight">Contests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {contests.length} contest{contests.length !== 1 ? "s" : ""} created
          </p>
        </div>
        <Button onClick={openDialog}>Add Contest</Button>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
          No contests yet. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sorted.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => router.push(`/contests/${c.id}`)}
              className="cursor-pointer rounded-lg border border-border p-5 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{c.name}</h3>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(c.date).toLocaleDateString()}
                </span>
              </div>
              {c.description && (
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {c.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Add Contest"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label
              htmlFor="contest-name"
              className="mb-1 block text-sm font-medium"
            >
              Name
            </label>
            <Input
              id="contest-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contest name"
            />
            {formErrors.name && (
              <p className="mt-1 text-sm text-destructive">
                {formErrors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="contest-date"
              className="mb-1 block text-sm font-medium"
            >
              Date
            </label>
            <Input
              id="contest-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            {formErrors.date && (
              <p className="mt-1 text-sm text-destructive">
                {formErrors.date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="contest-description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="contest-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
            />
          </div>

          {formErrors.server && (
            <p className="text-sm text-destructive">{formErrors.server}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Contest</Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
