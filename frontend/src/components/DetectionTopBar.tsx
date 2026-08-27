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
  const isSourceAnalysis = mode === "attribution";

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">OSI</div>
        <div>
          <div className="brand-name">OILSPILL INTELLIGENCE</div>
          <div className="brand-subtitle">
            {isSourceAnalysis ? "DRIFT PROJECTION / SOURCE ANALYSIS" : "SAR CANDIDATE SLICK REVIEW"}
          </div>
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
          <strong>{isSourceAnalysis ? "Backtracking Simulation" : "CNN + U-Net Fusion Queue"}</strong>
        </div>
        <div>
          <span>{isSourceAnalysis ? "WORKSPACE" : "SPLIT"}</span>
          <strong>{isSourceAnalysis ? "Source Analysis" : filters.split === "all" ? "All Held-Out" : filters.split}</strong>
        </div>
        <div>
          <span>{isSourceAnalysis ? "RUN" : "RUN TIMESTAMP"}</span>
          <strong>{isSourceAnalysis ? "Scenario Run" : summary?.createdAt ?? "Not supplied"}</strong>
        </div>
      </div>

      <div className="topbar-badges">
        {isSourceAnalysis ? (
          <>
            <ModeBadge tone="model">Source Analysis</ModeBadge>
            <ModeBadge tone="warning">Research Preview</ModeBadge>
          </>
        ) : (
          <>
            <ModeBadge tone={summary?.groupedSplitOnly ? "observed" : "warning"}>
              {summary?.groupedSplitOnly ? "Grouped Split" : "Split Not Supplied"}
            </ModeBadge>
            <ModeBadge tone="warning">Experimental Prototype</ModeBadge>
          </>
        )}
      </div>
    </header>
  );
}
