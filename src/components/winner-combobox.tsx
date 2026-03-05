"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { formatAddress } from "@/lib/utils";

interface ComboboxParticipant {
  id: string;
  name: string;
  walletAddress: string;
}

interface WinnerComboboxProps {
  participants: ComboboxParticipant[];
  existingWinnerIds: string[];
  onSelect: (participant: ComboboxParticipant) => void;
}

function WinnerCombobox({
  participants,
  existingWinnerIds,
  onSelect,
}: WinnerComboboxProps) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const available = React.useMemo(
    () => participants.filter((p) => !existingWinnerIds.includes(p.id)),
    [participants, existingWinnerIds],
  );

  const filtered = React.useMemo(() => {
    if (!query.trim()) return available;
    const q = query.toLowerCase();
    return available.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.walletAddress.toLowerCase().includes(q),
    );
  }, [available, query]);

  React.useEffect(() => {
    setHighlightIndex(0);
  }, [filtered]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (participant: ComboboxParticipant) => {
    onSelect(participant);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search participants to add as winner..."
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      {isOpen && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-background shadow-lg"
        >
          {filtered.length === 0 ? (
            <li className="px-4 py-3 text-sm text-muted-foreground">
              {available.length === 0
                ? "All participants are already winners."
                : "No matching participants found."}
            </li>
          ) : (
            filtered.map((p, idx) => (
              <li
                key={p.id}
                role="option"
                aria-selected={idx === highlightIndex}
                className={`cursor-pointer px-4 py-2.5 text-sm ${
                  idx === highlightIndex
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted/50"
                }`}
                onMouseEnter={() => setHighlightIndex(idx)}
                onClick={() => handleSelect(p)}
              >
                <span className="font-medium">{p.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground">
                  {formatAddress(p.walletAddress)}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export { WinnerCombobox };
