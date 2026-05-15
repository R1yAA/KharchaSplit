"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
}) => (
  <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-5 shadow-xl">
        <Dialog.Title className="text-base font-semibold">{title}</Dialog.Title>
        {description && <Dialog.Description className="mt-1 text-sm text-fg-muted">{description}</Dialog.Description>}
        <div className="mt-4 flex gap-2 justify-end">
          <Dialog.Close className="h-10 rounded-xl bg-elevated px-4 text-sm hover:bg-line">{cancelText}</Dialog.Close>
          <button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className={cn(
              "h-10 rounded-xl px-4 text-sm text-white",
              destructive ? "bg-danger hover:bg-red-700" : "bg-brand hover:bg-brand-600",
            )}
          >
            {confirmText}
          </button>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
);
