import type { CandidateFilters, FusionSummary } from "../types/candidates";
import ModeBadge from "./ModeBadge";

type DetectionTopBarProps = {
  summary: FusionSummary | null;
  filters: CandidateFilters;
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

export default function DetectionTopBar({
  summary,
  filters,
  mode,
  onModeChange,
}: DetectionTopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">OSI</div>
        <div>
          <div className="brand-name">OILSPILL INTELLIGENCE</div>
          <div className="brand-subtitle">SAR CANDIDATE SLICK REVIEW</div>
        </div>
      </div>

      <nav className="workspace-tabs" aria-label="Workspace">
        <button
          className={mode === "detection" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("detection")}
        >
          Detection Review
        </button>
        <button
          className={mode === "attribution" ? "active" : ""}
          type="button"
          onClick={() => onModeChange("attribution")}
        >
          Source Attribution
        </button>
      </nav>

      <div className="case-info">
        <div>
          <span>PIPELINE STAGE</span>
          <strong>CNN + U-Net Fusion Queue</strong>
        </div>
        <div>
          <span>SPLIT</span>
          <strong>{filters.split === "all" ? "All Held-Out" : filters.split}</strong>
        </div>
        <div>
          <span>RUN TIMESTAMP</span>
          <strong>{summary?.createdAt ?? "Not supplied"}</strong>
        </div>
      </div>

      <div className="topbar-badges">
        <ModeBadge tone={summary?.groupedSplitOnly ? "observed" : "warning"}>
          {summary?.groupedSplitOnly ? "Grouped Split" : "Split Not Supplied"}
        </ModeBadge>
        <ModeBadge tone="warning">Experimental Prototype</ModeBadge>
      </div>
    </header>
  );
}
