import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import DetectionTopBar from "./DetectionTopBar";
import EvidencePanel from "./EvidencePanel";
import MapView from "./MapView";
import ModeBadge from "./ModeBadge";
import Timeline from "./Timeline";
import VesselRanking from "./VesselRanking";
import { syntheticAttributionCase } from "../data/syntheticAttributionCase";

interface FlyToRequest {
  mmsi: string;
  token: number;
}

type AttributionConceptWorkspaceProps = {
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

export default function AttributionConceptWorkspace({
  mode,
  onModeChange,
}: AttributionConceptWorkspaceProps) {
  const [selectedVesselMmsi, setSelectedVesselMmsi] = useState<string | null>(null);
  const [selectedSpillId, setSelectedSpillId] = useState<number | null>(null);
  const [selectedTimeOffset, setSelectedTimeOffset] = useState(0);
  const [flyToRequest, setFlyToRequest] = useState<FlyToRequest | null>(null);
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [simVesselMmsi, setSimVesselMmsi] = useState(syntheticAttributionCase.vessels[0].mmsi);
  const [simBacktrack, setSimBacktrack] = useState(6);
  const [simHeading, setSimHeading] = useState(180);
  const [simDriftSpeed, setSimDriftSpeed] = useState(1.5);
  const [simResult, setSimResult] = useState<{ trajectory: [number, number][]; score: number; message: string } | null>(null);

  const selectedVessel = useMemo(
    () => syntheticAttributionCase.vessels.find((vessel) => vessel.mmsi === selectedVesselMmsi) ?? null,
    [selectedVesselMmsi]
  );
  void selectedVessel;

  const handleRunScenario = () => {
    const vessel = syntheticAttributionCase.vessels.find((item) => item.mmsi === simVesselMmsi);
    if (!vessel) return;

    const steps = Math.max(1, simBacktrack);
    const rad = (simHeading * Math.PI) / 180;
    const stepSize = simDriftSpeed * 0.02;
    const trajectory: [number, number][] = [];

    for (let index = 0; index <= steps; index += 1) {
      trajectory.push([
        vessel.longitude + stepSize * index * Math.sin(rad),
        vessel.latitude + stepSize * index * Math.cos(rad),
      ]);
    }

    const endPoint = trajectory[trajectory.length - 1];
    const distance = Math.sqrt(
      (endPoint[0] - syntheticAttributionCase.sourceRegion.longitude) ** 2 +
        (endPoint[1] - syntheticAttributionCase.sourceRegion.latitude) ** 2
    );
    const score = Math.max(0, Math.min(1, 1 - distance / 0.5));
    const message =
      score > 0.75
        ? "HIGH SYNTHETIC INTERSECTION"
        : score > 0.4
          ? "MODERATE SYNTHETIC INTERSECTION"
          : "LOW SYNTHETIC INTERSECTION";
    setSimResult({ trajectory, score, message });
  };

  return (
    <div className="app">
      <DetectionTopBar
        summary={null}
        filters={{
          split: "test",
          reviewStatus: "all",
          reviewed: "all",
          acquisitionDate: "all",
          scene: "all",
          search: "",
          sortBy: "fusion",
        }}
        mode={mode}
        onModeChange={onModeChange}
      />

      <section className="concept-notice">
        <ModeBadge tone="synthetic">Synthetic Concept Demo</ModeBadge>
        <p>Concept demonstration using synthetic attribution data. AIS and drift services are not connected.</p>
      </section>

      <main className="dashboard concept-dashboard">
        <section className="map-section">
          <MapView
            caseData={syntheticAttributionCase}
            selectedVesselMmsi={selectedVesselMmsi}
            selectedSpillId={selectedSpillId}
            selectedTimeOffset={selectedTimeOffset}
            simulatedTrajectory={isSimOpen && simResult ? simResult.trajectory : null}
            flyToRequest={flyToRequest}
            onVesselSelect={setSelectedVesselMmsi}
            onSpillSelect={setSelectedSpillId}
          />

          <button
            className={`sim-toggle ${isSimOpen ? "active" : ""}`}
            type="button"
            onClick={() => {
              setIsSimOpen((value) => !value);
              if (isSimOpen) setSimResult(null);
            }}
          >
            {isSimOpen ? "Close simulator" : "What-if scenario"}
          </button>

          {isSimOpen ? (
            <div className="sim-panel">
              <span className="panel-kicker">SYNTHETIC SIMULATOR</span>
              <label>
                <span>Select vessel</span>
                <select
                  value={simVesselMmsi}
                  onChange={(event) => {
                    setSimVesselMmsi(event.target.value);
                    setSelectedVesselMmsi(event.target.value);
                    setSimResult(null);
                  }}
                >
                  {syntheticAttributionCase.vessels.map((vessel) => (
                    <option key={vessel.mmsi} value={vessel.mmsi}>
                      {vessel.name} - MMSI {vessel.mmsi}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Backtrack window: {simBacktrack} hours</span>
                <input type="range" min="1" max="48" value={simBacktrack} onChange={(event) => setSimBacktrack(Number(event.target.value))} />
              </label>
              <label>
                <span>Drift heading: {simHeading} deg</span>
                <input type="range" min="0" max="360" value={simHeading} onChange={(event) => setSimHeading(Number(event.target.value))} />
              </label>
              <label>
                <span>Drift speed multiplier: {simDriftSpeed}x</span>
                <input type="range" min="0.1" max="5" step="0.1" value={simDriftSpeed} onChange={(event) => setSimDriftSpeed(Number(event.target.value))} />
              </label>
              <button className="console-button action" type="button" onClick={handleRunScenario}>
                Run synthetic scenario
              </button>
              {simResult ? (
                <div className="sim-result">
                  <strong>{simResult.message}</strong>
                  <span>Demo score: {simResult.score.toFixed(2)}</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="right-panel">
          <section className="panel-section unavailable-panel">
            <span className="panel-kicker">DATA UNAVAILABLE</span>
            <h2>Real attribution is future scope</h2>
            <p>
              This repository does not include AIS positions, AIS tracks, drift fields, source-estimation
              outputs, or an attribution-score specification.
            </p>
            <button className="console-button subtle" type="button">
              <Download size={14} /> Missing AIS/drift inputs
            </button>
          </section>
          <VesselRanking
            vessels={syntheticAttributionCase.vessels}
            selectedVesselMmsi={selectedVesselMmsi}
            onVesselSelect={setSelectedVesselMmsi}
            onRunWhatIf={(mmsi) => {
              setSelectedVesselMmsi(mmsi);
              setSimVesselMmsi(mmsi);
              setIsSimOpen(true);
            }}
            onViewTrack={(mmsi) => {
              setSelectedVesselMmsi(mmsi);
              setSelectedTimeOffset(0);
              setFlyToRequest({ mmsi, token: Date.now() });
            }}
          />
          <EvidencePanel evidence={syntheticAttributionCase.evidenceChain} confidence={syntheticAttributionCase.sourceRegion.confidence} />
        </aside>

        <section className="timeline-section">
          <Timeline
            backtrack={syntheticAttributionCase.backtrack}
            forwardDrift={syntheticAttributionCase.forwardDrift}
            selectedTimeOffset={selectedTimeOffset}
            onTimeSelect={setSelectedTimeOffset}
          />
        </section>
      </main>
    </div>
  );
}
