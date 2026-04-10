"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ModalLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string; // Content area className
  containerClassName?: string; // DialogContent className
  showCloseButton?: boolean;
}

export function ModalLayout({
  title,
  description,
  children,
  footer,
  className,
  containerClassName,
  showCloseButton = true,
}: ModalLayoutProps) {
  return (
    <DialogContent
      className={cn("flex flex-col max-h-[90vh] overflow-hidden", containerClassName)}
      showCloseButton={showCloseButton}
    >
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      <div
        className={cn(
          "flex-1 overflow-y-auto px-6 py-2 custom-scrollbar",
          className
        )}
      >
        {children}
      </div>

      {footer && <DialogFooter>{footer}</DialogFooter>}
    </DialogContent>
  );
}
