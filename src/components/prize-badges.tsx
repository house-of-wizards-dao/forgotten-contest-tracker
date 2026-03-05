"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const prizeConfig = {
  wizard: { label: "Wizard", className: "bg-purple-500/15 text-purple-700 border-purple-500/30" },
  warrior: { label: "Warrior", className: "bg-red-500/15 text-red-700 border-red-500/30" },
  impBox: { label: "Imp Box", className: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
} as const;

interface PrizeBadgesProps {
  prizeWizard: boolean;
  prizeWarrior: boolean;
  prizeImpBox: boolean;
  toggleable?: boolean;
  onToggle?: (prizeType: "wizard" | "warrior" | "impBox", value: boolean) => void;
}

function PrizeBadges({
  prizeWizard,
  prizeWarrior,
  prizeImpBox,
  toggleable = false,
  onToggle,
}: PrizeBadgesProps) {
  const prizes = [
    { key: "wizard" as const, active: prizeWizard },
    { key: "warrior" as const, active: prizeWarrior },
    { key: "impBox" as const, active: prizeImpBox },
  ];

  if (!toggleable) {
    const active = prizes.filter((p) => p.active);
    if (active.length === 0) {
      return <span className="text-xs text-muted-foreground">--</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {active.map((p) => (
          <span
            key={p.key}
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
              prizeConfig[p.key].className,
            )}
          >
            {prizeConfig[p.key].label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {prizes.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onToggle?.(p.key, !p.active)}
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium cursor-pointer transition-opacity",
            p.active
              ? prizeConfig[p.key].className
              : "bg-muted/30 text-muted-foreground border-border opacity-50 hover:opacity-75",
          )}
          title={p.active ? `Remove ${prizeConfig[p.key].label}` : `Add ${prizeConfig[p.key].label}`}
        >
          {prizeConfig[p.key].label}
        </button>
      ))}
    </div>
  );
}

export { PrizeBadges };
