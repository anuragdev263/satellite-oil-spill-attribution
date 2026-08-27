import type { ReactNode } from "react";

type ModeBadgeProps = {
  tone: "observed" | "model" | "human" | "synthetic" | "warning";
  children: ReactNode;
};

export default function ModeBadge({ tone, children }: ModeBadgeProps) {
  return <span className={`mode-badge mode-badge-${tone}`}>{children}</span>;
}
