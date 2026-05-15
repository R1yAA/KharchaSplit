"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export default function LoginPage() {
  const [name, setName] = useState("");
  const { setWorkspace } = useWorkspace();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setWorkspace(name);
    router.replace("/");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">💸</div>
          <h1 className="text-2xl font-semibold">KharchaSplit</h1>
          <p className="mt-1 text-sm text-fg-muted">Track expenses. Split with friends.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium text-fg-muted">Your name</label>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Riya"
            maxLength={50}
          />
          <Button type="submit" className="w-full" size="lg" disabled={!name.trim()}>
            Continue
          </Button>
          <p className="text-xs text-fg-dim text-center pt-2">
            No password. Your data is scoped to this name on this device.
          </p>
        </form>
      </div>
    </main>
  );
}
