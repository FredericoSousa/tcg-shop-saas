"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { passwordRules } from "@/lib/validation/schemas";

const STRENGTH_LEVELS = [
  { label: "Muito fraca", bar: "bg-destructive", text: "text-destructive" },
  { label: "Fraca", bar: "bg-destructive", text: "text-destructive" },
  { label: "Regular", bar: "bg-amber-500", text: "text-amber-500" },
  { label: "Boa", bar: "bg-amber-500", text: "text-amber-500" },
  { label: "Forte", bar: "bg-success", text: "text-success" },
  { label: "Excelente", bar: "bg-success", text: "text-success" },
] as const;

interface PasswordStrengthProps {
  value: string;
  className?: string;
}

export function PasswordStrength({ value, className }: PasswordStrengthProps) {
  const results = passwordRules.map((rule) => ({
    label: rule.label,
    passed: value.length > 0 && rule.test(value),
  }));
  const score = results.filter((r) => r.passed).length;
  const total = passwordRules.length;
  const level = STRENGTH_LEVELS[score];
  const showBar = value.length > 0;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              showBar ? level.bar : "bg-transparent",
            )}
            style={{ width: showBar ? `${(score / total) * 100}%` : "0%" }}
          />
        </div>
        <span
          className={cn(
            "min-w-[72px] text-right text-xs font-semibold transition-colors",
            showBar ? level.text : "text-muted-foreground",
          )}
        >
          {showBar ? level.label : "—"}
        </span>
      </div>
      <ul className="space-y-1">
        {results.map((rule) => (
          <li
            key={rule.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              rule.passed ? "text-success" : "text-muted-foreground",
            )}
          >
            {rule.passed ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 shrink-0 opacity-60" />
            )}
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
