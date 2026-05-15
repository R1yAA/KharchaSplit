"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Groups", icon: Home, match: (p: string) => p === "/" || p.startsWith("/group") },
  { href: "/personal", label: "Personal", icon: User, match: (p: string) => p.startsWith("/personal") },
  { href: "/analytics", label: "Analytics", icon: BarChart3, match: (p: string) => p.startsWith("/analytics") },
  { href: "/settings", label: "Settings", icon: Settings, match: (p: string) => p.startsWith("/settings") },
];

export function BottomTabs() {
  const pathname = usePathname() || "/";
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t bg-surface/95 backdrop-blur tabbar-safe">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map((t) => {
          const active = t.match(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] transition-colors",
                  active ? "text-brand" : "text-fg-muted",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                <span className={cn(active && "font-semibold")}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
