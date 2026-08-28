import type { CandidateFilters, FusionSummary } from "../types/candidates";
import { QESHM_INCIDENT_METADATA } from "../constants/qeshmIncident";
import ModeBadge from "./ModeBadge";

type DetectionTopBarProps = {
  summary: FusionSummary | null;
  filters: CandidateFilters;
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

const PIPELINE_STAGES = [
  { id: "sar", label: "SAR", activeIn: ["detection"] },
  { id: "fusion", label: "FUSION", activeIn: ["detection"] },
  { id: "review", label: "MANUAL REVIEW", activeIn: ["detection"] },
  { id: "backtrack", label: "BACKTRACK DEMO", activeIn: ["attribution"] },
  { id: "vessel", label: "VESSEL DEMO", activeIn: ["attribution"] },
  { id: "scenario", label: "SCENARIO SCORE", activeIn: ["attribution"] },
  { id: "report", label: "REPORT", activeIn: ["detection", "attribution"] },
];

export default function DetectionTopBar({
  summary,
  filters,
  mode,
  onModeChange,
}: DetectionTopBarProps) {
  const isAttributionMode = mode === "attribution";

  return (
    <header className="topbar-container">
      <div className="topbar">
        <div className="brand">
          <div className="brand-mark">OSI</div>
          <div>
            <div className="brand-name">OILSPILL INTELLIGENCE</div>
            <div className="brand-subtitle">
              {isAttributionMode ? "PROTOTYPE / SYNTHETIC ATTRIBUTION DEMO" : "SAR CANDIDATE SLICK REVIEW"}
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
            title="Synthetic concept demo. Not confirmed attribution and not linked to every SAR candidate."
          >
            Source Attribution
          </button>
        </nav>

        <div className="case-info">
          <div>
            <span>FOCUS</span>
            <strong>{isAttributionMode ? "Prototype Scenario" : "CNN + U-Net Queue"}</strong>
          </div>
          <div>
            <span>CONTEXT</span>
            <strong>{isAttributionMode ? QESHM_INCIDENT_METADATA.caseId : filters.split === "all" ? "All Held-Out" : filters.split}</strong>
          </div>
          <div>
            <span>OBSERVATION</span>
            <strong>{isAttributionMode ? QESHM_INCIDENT_METADATA.observationDate : summary?.createdAt ?? "Not supplied"}</strong>
          </div>
        </div>

        <div className="topbar-badges">
          {isAttributionMode ? (
            <>
              <ModeBadge tone="warning">Prototype / Synthetic</ModeBadge>
              <ModeBadge tone="model">Scenario Score</ModeBadge>
              <ModeBadge tone="warning">Not confirmed attribution</ModeBadge>
              <ModeBadge tone="synthetic">Not linked to SAR candidates</ModeBadge>
            </>
          ) : (
            <>
              <ModeBadge tone={summary?.groupedSplitOnly ? "observed" : "warning"}>
                {summary?.groupedSplitOnly ? "Grouped Split" : "Split Not Supplied"}
              </ModeBadge>
              <ModeBadge tone="warning">Prototype</ModeBadge>
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
              (mode === "attribution" && (stage.id === "backtrack" || stage.id === "scenario"));

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
