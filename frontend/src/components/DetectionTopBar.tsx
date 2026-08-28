import { QESHM_INCIDENT_METADATA } from "../constants/qeshmIncident";
import type { CandidateFilters, FusionSummary } from "../types/candidates";
import ModeBadge from "./ModeBadge";

type DetectionTopBarProps = {
  summary: FusionSummary | null;
  filters: CandidateFilters;
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

const PIPELINE_STAGES = [
  { id: "sar", label: "SAR DETECTION", activeIn: ["detection"] },
  { id: "spill", label: "SPILL REGION", activeIn: ["detection", "attribution"] },
  { id: "backtrack", label: "BACKTRACK", activeIn: ["attribution"] },
  { id: "vessel", label: "VESSEL TRACK", activeIn: ["attribution"] },
  { id: "fusion", label: "EVIDENCE FUSION", activeIn: ["detection", "attribution"] },
  { id: "attribution", label: "SOURCE ATTRIBUTION", activeIn: ["attribution"] },
  { id: "review", label: "INVESTIGATOR REVIEW", activeIn: ["detection", "attribution"] },
];

export default function DetectionTopBar({
  summary,
  filters,
  mode,
  onModeChange,
}: DetectionTopBarProps) {
  const isSourceAnalysis = mode === "attribution";

  return (
    <header className="topbar-container">
      <div className="topbar">
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
            <span>PIPELINE FOCUS</span>
            <strong>{isSourceAnalysis ? "Backtracking Simulation" : "CNN + U-Net Fusion Queue"}</strong>
          </div>
          <div>
            <span>CASE CONTEXT</span>
            <strong>{isSourceAnalysis ? QESHM_INCIDENT_METADATA.caseId : filters.split === "all" ? "All Held-Out" : filters.split}</strong>
          </div>
          <div>
            <span>OBSERVATION</span>
            <strong>{isSourceAnalysis ? QESHM_INCIDENT_METADATA.observationDate : summary?.createdAt ?? "Not supplied"}</strong>
          </div>
        </div>

        <div className="topbar-badges">
          {isSourceAnalysis ? (
            <>
              <ModeBadge tone="human">Reported Incident</ModeBadge>
              <ModeBadge tone="model">Source Analysis</ModeBadge>
              <ModeBadge tone="warning">Prototype Run</ModeBadge>
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
      </div>

      {/* COMPACT INVESTIGATION PIPELINE INDICATOR (High-Impact Improvement #1) */}
      <div className="pipeline-bar" aria-label="Investigation pipeline stages">
        <span className="pipeline-label">INVESTIGATION CHAIN</span>
        <div className="pipeline-steps">
          {PIPELINE_STAGES.map((stage, index) => {
            const isActive = stage.activeIn.includes(mode);
            const isCurrentModeTarget =
              (mode === "detection" && (stage.id === "sar" || stage.id === "fusion")) ||
              (mode === "attribution" && (stage.id === "backtrack" || stage.id === "attribution"));

            return (
              <div
                key={stage.id}
                className={`pipeline-step ${isActive ? "active" : "inactive"} ${
                  isCurrentModeTarget ? "highlight" : ""
                }`}
              >
                <span className="pipeline-step-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="pipeline-step-name">{stage.label}</span>
                {index < PIPELINE_STAGES.length - 1 && <span className="pipeline-step-arrow">&rsaquo;</span>}
              </div>
            );
          })}
        </div>
      </div>
    </header>
  );
}