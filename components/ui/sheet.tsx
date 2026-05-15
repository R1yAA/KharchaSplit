"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <Dialog.Content
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl bg-surface shadow-xl",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom duration-200",
          className,
        )}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-surface px-4 py-3">
          <Dialog.Title className="text-base font-semibold">{title ?? ""}</Dialog.Title>
          <Dialog.Close className="rounded-full p-1.5 hover:bg-elevated" aria-label="Close">
            <X className="h-5 w-5" />
          </Dialog.Close>
        </div>
        <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
