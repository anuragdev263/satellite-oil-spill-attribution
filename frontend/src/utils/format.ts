import type { Candidate } from "../types/candidates";

export function formatDecimal(value: number, digits = 3): string {
  return Number.isFinite(value) ? value.toFixed(digits) : "Not supplied";
}

export function formatPercentFraction(value: number, digits = 1): string {
  return Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : "Not supplied";
}

export function formatInteger(value: number): string {
  return Number.isFinite(value) ? Math.round(value).toLocaleString("en-US") : "Not supplied";
}

export function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? value.toFixed(5) : "Not supplied";
}

export function shortenTileName(tileName: string): string {
  const match = tileName.match(/(r\d+_c\d+)/i);
  return match ? match[1].toUpperCase() : tileName.replace(/_(positive|negative)(?=\.npz$)/i, "");
}

export function describeCandidateImage(candidate: Candidate, evaluationMode: boolean): string {
  const base = `${candidate.split} rank ${candidate.rank} composite preview with SAR tile, U-Net heatmap, and candidate overlay.`;
  if (!evaluationMode) return `${base} The evaluation header is hidden in normal review mode.`;
  return `${base} Ground truth label is ${candidate.groundTruthLabel ?? "not supplied"} with ${candidate.groundTruthMaskPixels ?? 0} mask pixels.`;
}
