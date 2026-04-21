"use client";

import { useSidebar } from "./sidebar-provider";
import { ReactNode, useEffect, useState } from "react";
import { CommandPalette } from "./command-palette";
import { AdminBreadcrumbs } from "./admin-breadcrumbs";

interface AdminLayoutShellProps {
  sidebar: ReactNode;
  navbar: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

export function AdminLayoutShell({
  sidebar,
  navbar,
  footer,
  children,
}: AdminLayoutShellProps) {
  const { isCollapsed } = useSidebar();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={`grid min-h-screen w-full transition-all duration-300 ease-in-out bg-background font-sans antialiased text-foreground gap-0 ${
        isCollapsed ? "md:grid-cols-[70px_1fr]" : "md:grid-cols-[260px_1fr]"
      }`}
    >
      {sidebar}
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background via-background to-muted/5 w-full overflow-hidden">
        {navbar}
        <main className="flex-1 flex flex-col gap-5 p-3 md:p-4 lg:p-6 w-full">
          <AdminBreadcrumbs />
          {children}
        </main>
        {footer}
      </div>
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
    </div>
  );
}
