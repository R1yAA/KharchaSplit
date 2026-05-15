"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GROUP_ICONS } from "@/lib/categories";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GroupFormValues {
  name: string;
  icon: string;
  members: string[];
}

export function GroupForm({
  initial,
  submitLabel = "Create Group",
  onSubmit,
}: {
  initial?: Partial<GroupFormValues>;
  submitLabel?: string;
  onSubmit: (v: GroupFormValues) => Promise<void> | void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [icon, setIcon] = useState(initial?.icon ?? GROUP_ICONS[0]);
  const [members, setMembers] = useState<string[]>(initial?.members ?? []);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const addMember = () => {
    const v = draft.trim();
    if (!v) return;
    if (members.some((m) => m.toLowerCase() === v.toLowerCase())) {
      setDraft("");
      return;
    }
    setMembers([...members, v]);
    setDraft("");
  };
  const remove = (m: string) => setMembers(members.filter((x) => x !== m));

  const canSubmit = name.trim().length > 0 && members.length >= 1;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), icon, members });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">Group name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Trip to Goa" className="mt-1" />
      </div>

      <div>
        <label className="text-sm font-medium">Icon</label>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {GROUP_ICONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setIcon(g)}
              className={cn(
                "h-11 rounded-xl text-xl",
                icon === g ? "bg-brand text-white" : "bg-elevated hover:bg-line",
              )}
            >
              {g}
            </button>
          ))}
          <input
            value={!GROUP_ICONS.includes(icon) ? icon : ""}
            onChange={(e) => setIcon(e.target.value.slice(0, 4) || GROUP_ICONS[0])}
            placeholder="✏️"
            maxLength={4}
            aria-label="Custom emoji"
            className={cn(
              "h-11 rounded-xl text-xl text-center bg-elevated focus:bg-surface focus:outline-none border",
              !GROUP_ICONS.includes(icon) ? "bg-brand text-white border-brand" : "border-dashed border-line",
            )}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Members</label>
        <div className="mt-1 flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addMember();
              }
            }}
            placeholder="Add a name"
          />
          <Button type="button" variant="secondary" onClick={addMember}>
            Add
          </Button>
        </div>
        {members.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m}
                className="inline-flex items-center gap-1 rounded-full bg-elevated px-3 py-1 text-sm"
              >
                {m}
                <button onClick={() => remove(m)} aria-label={`Remove ${m}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        {members.length === 0 && <p className="mt-1 text-xs text-fg-dim">Add at least one member.</p>}
      </div>

      <Button onClick={submit} disabled={!canSubmit || busy} className="w-full" size="lg">
        {busy ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}
