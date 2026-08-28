/**
 * Shared provenance vocabulary for PART 2.
 *
 * Every value surfaced in new PART 2 UI must declare which of these buckets
 * it falls into (see PART 2 requirements: "Every displayed value should
 * fall into one of these categories"). This module is the single source of
 * truth for the label text and badge styling so provenance wording stays
 * consistent across components instead of being re-typed ad hoc.
 *
 * This does NOT replace or restyle PART 1's existing panel-kicker labels
 * (e.g. "REAL INCIDENT CONTEXT", "PROTOTYPE DATA") - those already do this
 * job for PART 1 UI. This module is for new PART 2 additions.
 */

export type ProvenanceLevel =
  | "reported"
  | "external-source"
  | "derived"
  | "prototype"
  | "synthetic"
  | "under-investigation"
  | "unknown";

export const PROVENANCE_LABEL: Record<ProvenanceLevel, string> = {
  reported: "REPORTED",
  "external-source": "EXTERNAL SOURCE",
  derived: "DERIVED",
  prototype: "PROTOTYPE",
  synthetic: "SYNTHETIC",
  "under-investigation": "UNDER INVESTIGATION",
  unknown: "UNKNOWN",
};

/**
 * Maps each provenance level to an existing ModeBadge tone so no new CSS is
 * required. This reuses PART 1's existing visual language rather than
 * inventing a parallel styling system:
 *  - reported / external-source -> "human"    (externally sourced fact)
 *  - derived                    -> "observed" (computed from source data)
 *  - under-investigation        -> "model"    (analysis in progress)
 *  - prototype / synthetic      -> their own existing tones
 *  - unknown                    -> "warning"  (missing data, not fabricated)
 */
export const PROVENANCE_TONE: Record<ProvenanceLevel, "observed" | "model" | "human" | "synthetic" | "warning"> = {
  reported: "human",
  "external-source": "human",
  derived: "observed",
  // ModeBadge has no separate "prototype" tone; reuse "warning", the same
  // tone PART 1 already uses for "Experimental Prototype" / "Prototype Run".
  prototype: "warning",
  synthetic: "synthetic",
  "under-investigation": "model",
  unknown: "warning",
};
