import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { QESHM_INCIDENT_METADATA } from "../constants/qeshmIncident";
import type { BacktrackingPrototypeData, SourceAttributionRecord } from "../types/backtracking";
import { generateIncidentReviewPdf, generatePrototypeAnalysisPdf } from "../services/reportService";
import ProvenanceTag from "./ProvenanceTag";

type SourceAttributionPanelProps = {
  data: BacktrackingPrototypeData;
  selectedVesselId: string | null;
  onSelectVessel: (vesselId: string) => void;
  timeIndex?: number;
};

export default function SourceAttributionPanel({
  data,
  selectedVesselId,
  onSelectVessel,
  timeIndex = 0,
}: SourceAttributionPanelProps) {
  const [incidentPdfState, setIncidentPdfState] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [prototypePdfState, setPrototypePdfState] = useState<"idle" | "generating" | "success" | "error">("idle");

  const ranked = data.sourceAttribution.slice().sort((a, b) => b.hybridScore - a.hybridScore);
  const selected = selectedVesselId
    ? ranked.find((record) => record.vesselId === selectedVesselId)
    : ranked[0];
  const latestDrift = data.backtrackedTrajectory[0];
  const oldestDrift = data.backtrackedTrajectory[data.backtrackedTrajectory.length - 1];
  const latestEnvironment = data.environment[data.environment.length - 1];
  const currentTime = data.times[timeIndex] ?? data.times[0] ?? "";

  // Calculate forward drift +6h from active hydrodynamic drift vector
  const forwardDrift6h = latestDrift && data.spillLocation
    ? calculateForwardDrift(
        data.spillLocation.latitude,
        data.spillLocation.longitude,
        latestDrift.driftUMs,
        latestDrift.driftVMs,
        6
      )
    : null;

  const handleGenerateIncidentPdf = () => {
    setIncidentPdfState("generating");
    try {
      generateIncidentReviewPdf();
      setIncidentPdfState("success");
      setTimeout(() => setIncidentPdfState("idle"), 3000);
    } catch {
      setIncidentPdfState("error");
      setTimeout(() => setIncidentPdfState("idle"), 4000);
    }
  };

  const handleExportPrototypePdf = () => {
    setPrototypePdfState("generating");
    try {
      generatePrototypeAnalysisPdf(data, selected?.vesselId ?? null, currentTime, timeIndex);
      setPrototypePdfState("success");
      setTimeout(() => setPrototypePdfState("idle"), 3000);
    } catch {
      setPrototypePdfState("error");
      setTimeout(() => setPrototypePdfState("idle"), 4000);
    }
  };

  return (
    <aside className="right-panel source-panel">
      {/* REAL INCIDENT CONTEXT (External Reported - High-Impact Improvement #4) */}
      <section className="panel-section incident-context-section">
        <div className="panel-header compact">
          <div>
            <span className="panel-kicker">REAL INCIDENT CONTEXT</span>
            <h2>{QESHM_INCIDENT_METADATA.name}</h2>
          </div>
          <ProvenanceTag level="reported" />
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Case ID</dt>
            <dd>{QESHM_INCIDENT_METADATA.caseId}</dd>
          </div>
          <div>
            <dt>Observation date</dt>
            <dd>{QESHM_INCIDENT_METADATA.observationDate}</dd>
          </div>
          <div>
            <dt>Reported extent</dt>
            <dd>{QESHM_INCIDENT_METADATA.reportedExtent} <span className="provenance-micro">REPORTED · EXTERNAL</span></dd>
          </div>
          <div>
            <dt>Reporting agency</dt>
            <dd>{QESHM_INCIDENT_METADATA.reportingAgency}</dd>
          </div>
          <div>
            <dt>Source status</dt>
            <dd><span className="status-tag status-investigating">{QESHM_INCIDENT_METADATA.sourceStatus}</span></dd>
          </div>
          <div>
            <dt>External attribution</dt>
            <dd>{QESHM_INCIDENT_METADATA.externalAttributionHypothesis.vesselName} <span className="provenance-micro">REPORTED LIKELY</span></dd>
          </div>
          <div>
            <dt>System confirmation</dt>
            <dd><span className="status-tag status-unconfirmed">NOT ESTABLISHED</span></dd>
          </div>
        </dl>
        <div className="incident-attribution-note">
          <strong>External Report Note:</strong> {QESHM_INCIDENT_METADATA.externalAttributionHypothesis.summary}
        </div>

        {/* PRIMARY REPORT 1 BUTTON: GENERATE INCIDENT REVIEW PDF */}
        <div className="report-action-row">
          <button
            className="console-button action report-btn"
            type="button"
            onClick={handleGenerateIncidentPdf}
            disabled={incidentPdfState === "generating"}
            aria-label="Generate Incident Review PDF for Qeshm/Hengam event"
          >
            <FileText size={13} style={{ marginRight: "6px" }} />
            {incidentPdfState === "generating"
              ? "GENERATING INCIDENT REVIEW..."
              : incidentPdfState === "success"
              ? "INCIDENT REVIEW READY"
              : "GENERATE INCIDENT REVIEW PDF"}
          </button>
          {incidentPdfState === "error" && (
            <span className="report-error-msg">Report generation failed. Please retry.</span>
          )}
        </div>
      </section>

      {/* PROTOTYPE DISCLAIMERS */}
      <section className="panel-section prototype-disclaimer-section">
        <span className="panel-kicker">PROTOTYPE STATUS</span>
        <h2>Simulation & Vector Context</h2>
        <ul className="disclaimer-list">
          <li>{QESHM_INCIDENT_METADATA.disclaimers.aisStatus}</li>
          <li>{QESHM_INCIDENT_METADATA.disclaimers.driftStatus}</li>
          <li>{QESHM_INCIDENT_METADATA.disclaimers.scoreExplanation}</li>
        </ul>
      </section>

      {/* PROTOTYPE SCENARIO CANDIDATES (Ranked List) */}
      <section className="panel-section">
        <div className="panel-header compact">
          <div>
            <span className="panel-kicker">PROTOTYPE DATA</span>
            <h2>Vessel Proximity Scores</h2>
          </div>
          <span className="candidate-count">{ranked.length} CANDIDATES</span>
        </div>

        <div className="vessel-list">
          {ranked.map((record, index) => {
            const isSelected = record.vesselId === selected?.vesselId;
            return (
              <button
                key={record.vesselId}
                className={`synthetic-vessel-row ${isSelected ? "selected" : ""}`}
                type="button"
                onClick={() => onSelectVessel(record.vesselId)}
              >
                <div className="candidate-row-top">
                  <strong>#{String(index + 1).padStart(2, "0")}</strong>
                  <span>{record.vesselId}</span>
                  <span className="provenance-micro">PROTOTYPE</span>
                </div>
                <div className="synthetic-score-line">
                  <span>Scenario Score</span>
                  <strong>{record.hybridScore.toFixed(2)}</strong>
                </div>
                <div className="vessel-progress">
                  <div style={{ width: `${Math.min(100, Math.max(0, record.hybridScore))}%` }} />
                </div>
                <dl className="candidate-grid synthetic-score-grid">
                  <div>
                    <dt>Direct distance</dt>
                    <dd>{record.directDistanceKm.toFixed(2)} km</dd>
                  </div>
                  <div>
                    <dt>Minimum distance</dt>
                    <dd>{record.minimumDistanceKm.toFixed(2)} km</dd>
                  </div>
                </dl>
              </button>
            );
          })}
        </div>
      </section>

      {/* SELECTED CANDIDATE DETAILED EVIDENCE & BREAKDOWN (High-Impact Improvement #2) */}
      {selected ? (
        <SelectedAttributionDetails
          record={selected}
          vesselPoints={data.vesselTracks.filter((p) => p.vesselId === selected.vesselId)}
          simulationTimes={data.times}
          releaseOrigin={oldestDrift}
          onExportPdf={handleExportPrototypePdf}
          pdfState={prototypePdfState}
        />
      ) : null}

      {/* HYDRODYNAMIC VECTOR TRANSPORT (PART 3.3) */}
      <section className="panel-section">
        <div className="panel-header compact">
          <div>
            <span className="panel-kicker">DRIFT PROJECTION</span>
            <h2>Hydrodynamic Vector Context</h2>
          </div>
          <ProvenanceTag level="prototype" />
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Backtrack start</dt>
            <dd>{latestDrift ? `${latestDrift.latitude.toFixed(4)}, ${latestDrift.longitude.toFixed(4)}` : "UNKNOWN"}</dd>
          </div>
          <div>
            <dt>Drift U/V</dt>
            <dd>{latestDrift ? `${latestDrift.driftUMs.toFixed(3)} / ${latestDrift.driftVMs.toFixed(3)} m/s` : "UNKNOWN"}</dd>
          </div>
          <div>
            <dt>Wind U/V</dt>
            <dd>{latestEnvironment ? `${latestEnvironment.windUMs.toFixed(2)} / ${latestEnvironment.windVMs.toFixed(2)} m/s` : "UNKNOWN"}</dd>
          </div>
          <div>
            <dt>Current U/V</dt>
            <dd>{latestEnvironment ? `${latestEnvironment.currentUMs.toFixed(2)} / ${latestEnvironment.currentVMs.toFixed(2)} m/s` : "UNKNOWN"}</dd>
          </div>
          <div>
            <dt>Transport model</dt>
            <dd>Voil = Vcurrent + 0.03 * Vwind</dd>
          </div>
          <div>
            <dt>Net drift speed</dt>
            <dd>{latestDrift ? `${Math.hypot(latestDrift.driftUMs, latestDrift.driftVMs).toFixed(3)} m/s (${(Math.hypot(latestDrift.driftUMs, latestDrift.driftVMs) * 1.94384).toFixed(2)} kts)` : "UNKNOWN"}</dd>
          </div>
        </dl>
      </section>

      {/* FORWARD DRIFT PROJECTIONS (PART 3.4) */}
      <section className="panel-section">
        <div className="panel-header compact">
          <div>
            <span className="panel-kicker">FORWARD DRIFT SCENARIOS</span>
            <h2>Deterministic Projections</h2>
          </div>
          <ProvenanceTag level="derived" />
        </div>
        <dl className="detail-grid">
          <div>
            <dt>+6h projection</dt>
            <dd>{forwardDrift6h ? `${forwardDrift6h.lat.toFixed(4)} N, ${forwardDrift6h.lng.toFixed(4)} E (+${forwardDrift6h.distKm.toFixed(1)} km)` : "UNKNOWN"}</dd>
          </div>
          <div>
            <dt>+6h status</dt>
            <dd><span className="provenance-micro">DERIVED FROM ACTIVE VECTOR</span></dd>
          </div>
          <div>
            <dt>+12h projection</dt>
            <dd><span className="status-tag status-unavailable">INSUFFICIENT FORECAST DATA</span></dd>
          </div>
          <div>
            <dt>+24h projection</dt>
            <dd><span className="status-tag status-unavailable">INSUFFICIENT FORECAST DATA</span></dd>
          </div>
          <div>
            <dt>+48h projection</dt>
            <dd><span className="status-tag status-unavailable">INSUFFICIENT FORECAST DATA</span></dd>
          </div>
          <div>
            <dt>Forecast notice</dt>
            <dd>Metocean forecasts beyond +6h require future meteorological model inputs.</dd>
          </div>
        </dl>
      </section>

      {/* PROTOTYPE SCENARIO SUMMARY (CSV-derived) */}
      <section className="panel-section">
        <span className="panel-kicker">PROTOTYPE SCENARIO</span>
        <h2>Particle Backtracking Run</h2>
        <dl className="detail-grid">
          <div>
            <dt>Scenario ID</dt>
            <dd>{data.spillLocation?.caseId ?? "UNKNOWN"} <span className="provenance-micro">PROTOTYPE</span></dd>
          </div>
          <div>
            <dt>Particle timesteps</dt>
            <dd>{data.times.length}</dd>
          </div>
          <div>
            <dt>Source particles</dt>
            <dd>{data.particles.length.toLocaleString("en-US")}</dd>
          </div>
          <div>
            <dt>Scenario date</dt>
            <dd>{data.spillLocation?.observationTime ?? "UNKNOWN"}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

function SelectedAttributionDetails({
  record,
  vesselPoints,
  simulationTimes,
  releaseOrigin,
  onExportPdf,
  pdfState,
}: {
  record: SourceAttributionRecord;
  vesselPoints: { time: string; latitude: number; longitude: number; speedKnots: number }[];
  simulationTimes: string[];
  releaseOrigin?: { latitude: number; longitude: number; time: string };
  onExportPdf: () => void;
  pdfState: "idle" | "generating" | "success" | "error";
}) {
  const overlapCount = vesselPoints.filter((p) => simulationTimes.includes(p.time)).length;
  const overlapPercent = simulationTimes.length > 0 ? (overlapCount / simulationTimes.length) * 100 : 0;
  const earliestPoint = vesselPoints[0];
  const latestPoint = vesselPoints[vesselPoints.length - 1];

  // Release origin distance if earliest point exists
  const originDistanceKm = releaseOrigin && earliestPoint
    ? haversineKm(earliestPoint.latitude, earliestPoint.longitude, releaseOrigin.latitude, releaseOrigin.longitude)
    : null;

  return (
    <section className="panel-section">
      <div className="panel-header compact">
        <div>
          <span className="panel-kicker">SELECTED CANDIDATE EVIDENCE</span>
          <h2>{record.vesselId}</h2>
        </div>
        <ProvenanceTag level="derived" />
      </div>

      {/* COMPACT EVIDENCE BREAKDOWN (High-Impact Improvement #2) */}
      <div className="evidence-breakdown-card">
        <div className="evidence-bar-row">
          <div className="evidence-bar-header">
            <span>SPATIAL PROXIMITY</span>
            <strong>{record.directScore.toFixed(1)} / 100</strong>
          </div>
          <div className="evidence-bar-track">
            <div className="evidence-bar-fill spatial" style={{ width: `${Math.min(100, Math.max(0, record.directScore))}%` }} />
          </div>
          <span className="provenance-micro">DERIVED · PROXIMITY</span>
        </div>

        <div className="evidence-bar-row">
          <div className="evidence-bar-header">
            <span>TEMPORAL CONSISTENCY</span>
            <strong>{overlapPercent.toFixed(0)}% ({overlapCount}/{simulationTimes.length})</strong>
          </div>
          <div className="evidence-bar-track">
            <div className="evidence-bar-fill temporal" style={{ width: `${Math.min(100, Math.max(0, overlapPercent))}%` }} />
          </div>
          <span className="provenance-micro">DERIVED · COINCIDENT</span>
        </div>

        <div className="evidence-bar-row">
          <div className="evidence-bar-header">
            <span>TRAJECTORY ALIGNMENT</span>
            <strong>{record.trajectoryScore.toFixed(1)} / 100</strong>
          </div>
          <div className="evidence-bar-track">
            <div className="evidence-bar-fill trajectory" style={{ width: `${Math.min(100, Math.max(0, record.trajectoryScore))}%` }} />
          </div>
          <span className="provenance-micro">DERIVED · DRIFT PATH</span>
        </div>

        <div className="evidence-bar-row">
          <div className="evidence-bar-header">
            <span>ENVIRONMENTAL TRANSPORT</span>
            <strong>85.0% CONSISTENT</strong>
          </div>
          <div className="evidence-bar-track">
            <div className="evidence-bar-fill environmental" style={{ width: `85%` }} />
          </div>
          <span className="provenance-micro">PROTOTYPE · SYNTHETIC</span>
        </div>
      </div>

      <dl className="detail-grid" style={{ marginTop: "12px" }}>
        <div>
          <dt>Scenario Score</dt>
          <dd>{record.hybridScore.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Trajectory Score</dt>
          <dd>{record.trajectoryScore.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Direct distance</dt>
          <dd>{record.directDistanceKm.toFixed(2)} km</dd>
        </div>
        <div>
          <dt>Minimum track dist</dt>
          <dd>{record.minimumDistanceKm.toFixed(2)} km</dd>
        </div>
        <div>
          <dt>Average track dist</dt>
          <dd>{record.averageDistanceKm.toFixed(2)} km</dd>
        </div>
        <div>
          <dt>Source origin dist</dt>
          <dd>{originDistanceKm !== null ? `${originDistanceKm.toFixed(2)} km` : "UNKNOWN"}</dd>
        </div>
        <div>
          <dt>Spatial geometry</dt>
          <dd>LineString (No polygon mask)</dd>
        </div>
        <div>
          <dt>Temporal alignment</dt>
          <dd>{overlapPercent === 100 ? "Coincident with drift run" : "Partial overlap"}</dd>
        </div>
        <div>
          <dt>Track window</dt>
          <dd>{earliestPoint ? `${earliestPoint.time.slice(11, 16)} - ${latestPoint?.time.slice(11, 16) ?? ""}` : "UNKNOWN"}</dd>
        </div>
      </dl>

      <div className="attribution-rationale-box">
        <strong className="rationale-header">
          ATTRIBUTION RATIONALE (SCENARIO EVIDENCE)
        </strong>
        <p className="rationale-text">
          {describeAttributionRationale(record)}
        </p>
      </div>

      {/* REPORT 2 BUTTON: EXPORT PROTOTYPE ANALYSIS */}
      <div className="report-action-row" style={{ marginTop: "12px" }}>
        <button
          className="console-button subtle report-btn"
          type="button"
          onClick={onExportPdf}
          disabled={pdfState === "generating"}
          aria-label={`Export Prototype Analysis PDF for scenario candidate ${record.vesselId}`}
        >
          <Download size={13} style={{ marginRight: "6px" }} />
          {pdfState === "generating"
            ? "EXPORTING PROTOTYPE ANALYSIS..."
            : pdfState === "success"
            ? "PROTOTYPE REPORT READY"
            : "EXPORT PROTOTYPE ANALYSIS"}
        </button>
        {pdfState === "error" && (
          <span className="report-error-msg">Report export failed. Please retry.</span>
        )}
      </div>
    </section>
  );
}

function describeAttributionRationale(record: SourceAttributionRecord): string {
  if (record.hybridScore >= 80) {
    return `${record.vesselId} ranks as the primary candidate in this prototype scenario with a Scenario Score of ${record.hybridScore.toFixed(2)}. It maintained close direct proximity (${record.directDistanceKm.toFixed(2)} km) to the observed spill at observation time and a minimum track approach of ${record.minimumDistanceKm.toFixed(2)} km.`;
  }
  if (record.trajectoryScore >= 80) {
    return `${record.vesselId} exhibits strong trajectory alignment (${record.trajectoryScore.toFixed(2)}) with the backtracked drift path, reaching within ${record.minimumDistanceKm.toFixed(2)} km of the release path, but has a larger final direct separation (${record.directDistanceKm.toFixed(2)} km).`;
  }
  return `${record.vesselId} shows moderate scenario proximity (${record.hybridScore.toFixed(2)}) with minimum drift path separation of ${record.minimumDistanceKm.toFixed(2)} km and direct separation of ${record.directDistanceKm.toFixed(2)} km.`;
}

function calculateForwardDrift(
  lat: number,
  lng: number,
  uMs: number,
  vMs: number,
  hours: number
): { lat: number; lng: number; distKm: number } {
  const seconds = hours * 3600;
  const deltaXMeters = uMs * seconds;
  const deltaYMeters = vMs * seconds;
  const distKm = Math.hypot(deltaXMeters, deltaYMeters) / 1000;

  // 1 deg lat approx 110.7 km; 1 deg lng approx 111.32 * cos(lat) km
  const latDegPerKm = 1 / 110.7;
  const lngDegPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

  const newLat = lat + (deltaYMeters / 1000) * latDegPerKm;
  const newLng = lng + (deltaXMeters / 1000) * lngDegPerKm;

  return { lat: newLat, lng: newLng, distKm };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}