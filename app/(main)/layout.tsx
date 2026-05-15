"use client";

import { BottomTabs } from "@/components/layout/bottom-tabs";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { ready, workspace } = useWorkspace();
  if (!ready || !workspace) return null;
  return (
    <>
      <div className="mx-auto max-w-md min-h-screen pb-tabbar">{children}</div>
      <BottomTabs />
    </>
  );
}
