"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as Dialog from "@radix-ui/react-dialog";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import { useAllExpenses } from "@/hooks/use-expenses";
import { useGroups } from "@/hooks/use-groups";
import { fullExportToCsv, downloadCsv } from "@/lib/csv";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { workspace, logout } = useWorkspace();
  const { data: settings } = useSettings();
  const update = useUpdateSettings();
  const { data: expenses } = useAllExpenses();
  const { data: groups } = useGroups();
  const toast = useToast();
  const [name, setName] = useState(settings?.user_name ?? workspace ?? "");
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearText, setClearText] = useState("");

  // Sync local name when settings loads
  if (settings && name === "" && settings.user_name) setName(settings.user_name);

  const onSaveName = async () => {
    if (!name.trim()) return;
    await update.mutateAsync({ user_name: name.trim() });
    toast({ message: "Name updated", tone: "success" });
  };

  const onExportAll = () => {
    const map = new Map((groups ?? []).map((g) => [g.id, g]));
    const csv = fullExportToCsv(expenses ?? [], map);
    downloadCsv(`kharchasplit_${workspace}_export.csv`, csv);
  };

  const onClearAll = async () => {
    if (clearText !== "DELETE") return;
    if (!workspace) return;
    await supabase.from("expenses").delete().eq("workspace", workspace);
    await supabase.from("settlements").delete().eq("workspace", workspace);
    await supabase.from("groups").delete().eq("workspace", workspace);
    toast({ message: "All data cleared", tone: "success" });
    setConfirmClear(false);
    setClearText("");
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="p-4 space-y-4">
        <Card className="p-4">
          <label className="text-sm font-medium">Your name</label>
          <div className="mt-1 flex gap-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
            <Button variant="secondary" onClick={onSaveName} disabled={!name.trim()}>
              Save
            </Button>
          </div>
          <p className="mt-2 text-xs text-fg-muted">Used as default &ldquo;Me&rdquo; in groups.</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Currency</div>
              <div className="text-xs text-fg-muted">Indian Rupee (₹)</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Export all data</div>
              <div className="text-xs text-fg-muted">All expenses as CSV.</div>
            </div>
            <Button variant="secondary" onClick={onExportAll}>
              Export
            </Button>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-sm font-medium">About</div>
          <div className="mt-1 text-xs text-fg-muted">KharchaSplit v0.1.0</div>
          <div className="text-xs text-fg-muted">Built with ❤️</div>
        </Card>

        <Card className="p-4 border border-red-900/40">
          <div className="text-sm font-semibold text-danger">Danger zone</div>
          <Button variant="danger" size="sm" className="mt-2" onClick={() => setConfirmClear(true)}>
            Clear all data
          </Button>
          <div className="mt-3 border-t pt-3">
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </Card>
      </div>

      <Dialog.Root
        open={confirmClear}
        onOpenChange={(v) => {
          setConfirmClear(v);
          if (!v) setClearText("");
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-surface p-5 shadow-xl">
            <Dialog.Title className="text-base font-semibold">Clear all data?</Dialog.Title>
            <Dialog.Description className="mt-1 text-sm text-fg-muted">
              This deletes all groups, expenses, and settlements for your workspace. Type <span className="font-semibold">DELETE</span> to confirm.
            </Dialog.Description>
            <Input
              autoFocus
              placeholder="Type DELETE"
              value={clearText}
              onChange={(e) => setClearText(e.target.value)}
              className="mt-3"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Dialog.Close className="h-10 rounded-xl bg-elevated px-4 text-sm hover:bg-line">Cancel</Dialog.Close>
              <button
                onClick={onClearAll}
                disabled={clearText !== "DELETE"}
                className="h-10 rounded-xl bg-danger px-4 text-sm text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete everything
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
