"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Fab({
  onClick,
  label = "Add",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "fixed right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-fab transition-transform active:scale-95",
        "bottom-[calc(72px+env(safe-area-inset-bottom)+16px)]",
        className,
      )}
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </button>
  );
}
