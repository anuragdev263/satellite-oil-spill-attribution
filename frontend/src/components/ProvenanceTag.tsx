import type { ReactNode } from "react";
import ModeBadge from "./ModeBadge";
import { PROVENANCE_LABEL, PROVENANCE_TONE, type ProvenanceLevel } from "../types/provenance";

type ProvenanceTagProps = {
  level: ProvenanceLevel;
  /** Optional override text. Defaults to the standard label for the level
   * (e.g. "DERIVED"). Use this for a more specific phrase such as
   * "REPORTED - UNU-INWEH" while keeping the underlying tone/semantics. */
  children?: ReactNode;
};

/**
 * Small badge that renders one of the PART 2 provenance categories
 * (REPORTED / EXTERNAL SOURCE / DERIVED / PROTOTYPE / SYNTHETIC /
 * UNDER INVESTIGATION / UNKNOWN) using PART 1's existing ModeBadge styling.
 */
export default function ProvenanceTag({ level, children }: ProvenanceTagProps) {
  return <ModeBadge tone={PROVENANCE_TONE[level]}>{children ?? PROVENANCE_LABEL[level]}</ModeBadge>;
}
