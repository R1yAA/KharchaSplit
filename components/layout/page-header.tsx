"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function PageHeader({
  title,
  back,
  right,
}: {
  title: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 border-b bg-surface/95 px-3 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
      {back && (
        <button onClick={() => router.back()} className="rounded-full p-1.5 hover:bg-elevated" aria-label="Back">
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>
      {right}
    </header>
  );
}
