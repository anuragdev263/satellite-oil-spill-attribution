import { useState, useMemo } from "react";
import "./index.css";
import "./App.css";

import TopBar from "./components/TopBar";
import MapView from "./components/MapView";
import VesselRanking from "./components/VesselRanking";
import EvidencePanel from "./components/EvidencePanel";
import Timeline from "./components/Timeline";

export interface Vessel {
  rank: number;
  name: string;
  mmsi: string;
  imo: string;
  type: string;
  flag: string;
  latitude: number;
  longitude: number;
  score: number;
}

export interface Evidence {
  label: string;
  score: number;
  description: string;
}

export interface CaseData {
  caseId: string;
  status: string;
  region: string;
  observation: {
    time: string;
  };
  slick: {
    areaKm2: number;
    oilConfidence: number;
  };
  sourceRegion: {
    latitude: number;
    longitude: number;
    confidence: number;
  };
  vessels: Vessel[];
  evidenceChain: Evidence[];
  backtrack: { hoursAgo: number }[];
  forwardDrift: { hoursAhead: number }[];
}

interface FlyToRequest {
  mmsi: string;
  token: number;
}

const caseData: CaseData = {
  caseId: "ST-2026-0184",
  status: "UNRESOLVED",
  region: "ARABIAN SEA",

  observation: {
    time: "20 AUG 2026 • 12:00 UTC",
  },

  slick: {
    areaKm2: 42.7,
    oilConfidence: 0.91,
  },

  sourceRegion: {
    latitude: 19.534,
    longitude: 70.082,
    confidence: 0.87,
  },

  vessels: [
    {
      rank: 1,
      name: "OCEAN STAR",
      mmsi: "419001234",
      imo: "9123456",
      type: "TANKER",
      flag: "INDIA",
      latitude: 19.62,
      longitude: 70.18,
      score: 0.92,
    },
    {
      rank: 2,
      name: "BLUE HORIZON",
      mmsi: "419002345",
      imo: "9234567",
      type: "TANKER",
      flag: "PANAMA",
      latitude: 19.44,
      longitude: 69.91,
      score: 0.81,
    },
    {
      rank: 3,
      name: "SEA QUEST",
      mmsi: "419003456",
      imo: "9345678",
      type: "CARGO",
      flag: "INDIA",
      latitude: 19.71,
      longitude: 70.31,
      score: 0.68,
    },
    {
      rank: 4,
      name: "EASTERN WIND",
      mmsi: "419004567",
      imo: "9456789",
      type: "TANKER",
      flag: "LIBERIA",
      latitude: 19.31,
      longitude: 70.21,
      score: 0.54,
    },
  ],

  evidenceChain: [
    {
      label: "SATELLITE OIL SIGNATURE",
      score: 0.91,
      description: "SAR-derived slick classification.",
    },
    {
      label: "AIS PROXIMITY",
      score: 0.84,
      description: "Vessel proximity to estimated spill source.",
    },
    {
      label: "BACKTRACK CONSISTENCY",
      score: 0.78,
      description: "Drift trajectory intersects vessel history.",
    },
    {
      label: "VESSEL BEHAVIOUR",
      score: 0.71,
      description: "Course and speed behaviour correlation.",
    },
  ],

  backtrack: [
    { hoursAgo: 6 },
    { hoursAgo: 5 },
    { hoursAgo: 4 },
    { hoursAgo: 3 },
    { hoursAgo: 2 },
    { hoursAgo: 1 },
    { hoursAgo: 0 },
  ],

  forwardDrift: [
    { hoursAhead: 6 },
    { hoursAhead: 12 },
    { hoursAhead: 24 },
    { hoursAhead: 48 },
  ],
};

function App() {
  // SHARED STATE: Single Source of Truth
  const [selectedVesselMmsi, setSelectedVesselMmsi] = useState<string | null>(null);
  const [selectedSpillId, setSelectedSpillId] = useState<number | null>(null);
  const [selectedTimeOffset, setSelectedTimeOffset] = useState<number>(0);

  // MAP CAMERA CONTROL (driven by VIEW TRACK)
  const [flyToRequest, setFlyToRequest] = useState<FlyToRequest | null>(null);

  // WHAT-IF SIMULATOR STATE
  const [isSimOpen, setIsSimOpen] = useState(false);
  const [simVesselMmsi, setSimVesselMmsi] = useState<string>(caseData.vessels[0].mmsi);
  const [simBacktrack, setSimBacktrack] = useState<number>(6); // hours
  const [simHeading, setSimHeading] = useState<number>(180); // degrees
  const [simDriftSpeed, setSimDriftSpeed] = useState<number>(1.5); // Multiplier
  const [simResult, setSimResult] = useState<{ trajectory: [number, number][], confidence: number, message: string } | null>(null);

  // Derived state: Get selected vessel object
  const selectedVessel = useMemo(() => {
    return caseData.vessels.find((v) => v.mmsi === selectedVesselMmsi) || null;
  }, [selectedVesselMmsi]);

  void selectedVessel;

  const handleVesselSelect = (mmsi: string | null) => {
    setSelectedVesselMmsi(mmsi);
  };

  // Connects the investigation panel to the simulator, keeping a single
  // source of truth for which vessel is "active".
  const handleRunWhatIf = (mmsi: string) => {
    setSelectedVesselMmsi(mmsi);
    if (mmsi !== simVesselMmsi) {
      setSimResult(null);
    }
    setSimVesselMmsi(mmsi);
    setIsSimOpen(true);
  };

  // VIEW TRACK: select the vessel, snap the timeline back to NOW, and ask
  // the map to fly to that vessel's marker + highlight its track.
  const handleViewTrack = (mmsi: string) => {
    setSelectedVesselMmsi(mmsi);
    setSelectedTimeOffset(0);
    setFlyToRequest({ mmsi, token: Date.now() });
  };

  const handleSpillSelect = (id: number | null) => {
    setSelectedSpillId(id);
  };

  const handleReset = () => {
    setSelectedVesselMmsi(null);
    setSelectedSpillId(null);
    setSelectedTimeOffset(0);
    setSimResult(null);
    setIsSimOpen(false);
    setFlyToRequest(null);
  };

  const handleRunScenario = () => {
    const vessel = caseData.vessels.find(v => v.mmsi === simVesselMmsi);
    if (!vessel) return;

    // Deterministic projected trajectory from the vessel's current position
    const startLng = vessel.longitude;
    const startLat = vessel.latitude;
    const steps = Math.max(1, simBacktrack);
    const rad = (simHeading * Math.PI) / 180;
    const stepSize = simDriftSpeed * 0.02;

    const trajectory: [number, number][] = [];

    for (let i = 0; i <= steps; i++) {
      const currentLng = startLng + (stepSize * i * Math.sin(rad));
      const currentLat = startLat + (stepSize * i * Math.cos(rad));
      trajectory.push([currentLng, currentLat]);
    }

    // How close the simulated endpoint lands to the known source location
    const endPoint = trajectory[trajectory.length - 1];
    const dist = Math.sqrt(
      Math.pow(endPoint[0] - caseData.sourceRegion.longitude, 2) +
      Math.pow(endPoint[1] - caseData.sourceRegion.latitude, 2)
    );

    // Deterministic scenario score:
    // - proximityScore: how close the projected position lands to the source
    // - vessel.score: the vessel's existing attribution baseline
    // - backtrackPenalty: longer backtrack windows carry more uncertainty
    const MAX_DIST = 0.5; // degrees — normalization window for proximity
    const proximityScore = Math.max(0, 1 - dist / MAX_DIST);
    const backtrackPenalty = Math.min(0.3, (simBacktrack / 48) * 0.3);

    let conf = proximityScore * 0.6 + vessel.score * 0.4 - backtrackPenalty;
    conf = Math.min(1, Math.max(0, conf));

    let message = "LOW / NO INTERSECTION DETECTED";
    if (conf > 0.75) message = "HIGH INTERSECTION PROBABILITY";
    else if (conf > 0.4) message = "MODERATE INTERSECTION PROBABILITY";

    setSimResult({ trajectory, confidence: conf, message });
  };

  return (
    <div className="app">
      <TopBar caseData={caseData} />

      <main className="dashboard">
        <section className="map-section">
          <MapView
            caseData={caseData}
            selectedVesselMmsi={selectedVesselMmsi}
            selectedSpillId={selectedSpillId}
            selectedTimeOffset={selectedTimeOffset}
            simulatedTrajectory={isSimOpen && simResult ? simResult.trajectory : null}
            flyToRequest={flyToRequest}
            onVesselSelect={handleVesselSelect}
            onSpillSelect={handleSpillSelect}
          />

          {/* WHAT-IF SIMULATOR CONTROLS */}
          <button
            onClick={() => {
              setIsSimOpen(!isSimOpen);
              if (isSimOpen) setSimResult(null); // Clear map line when closing
            }}
            style={{
              position: "absolute",
              top: "80px",
              left: "25px",
              zIndex: 10,
              background: isSimOpen ? "#FF6B6B" : "#091A20",
              border: "1px solid #FF6B6B",
              color: isSimOpen ? "#091A20" : "#FF6B6B",
              fontSize: "9px",
              padding: "6px 10px",
              cursor: "pointer",
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: "0.05em",
              fontWeight: "bold"
            }}
          >
            {isSimOpen ? "CLOSE SIMULATOR" : "WHAT-IF SCENARIO"}
          </button>

          {isSimOpen && (
            <div style={{
              position: "absolute",
              top: "115px",
              left: "25px",
              zIndex: 10,
              background: "rgba(6, 20, 25, 0.95)",
              border: "1px solid #FF6B6B",
              padding: "16px",
              width: "280px",
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)"
            }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#FF6B6B", marginBottom: "12px", borderBottom: "1px solid rgba(255,107,107,0.3)", paddingBottom: "8px" }}>
                [SIMULATOR] DETACHED MODE
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "9px", color: "#7C9AA3", marginBottom: "4px" }}>SELECT VESSEL</label>
                <select
                  value={simVesselMmsi}
                  onChange={(e) => {
                    const mmsi = e.target.value;
                    setSimVesselMmsi(mmsi);
                    setSelectedVesselMmsi(mmsi);
                    setSimResult(null);
                  }}
                  style={{ width: "100%", background: "#0F2B35", border: "1px solid #3A5560", color: "#9DD7E8", padding: "4px", fontSize: "11px", fontFamily: "inherit" }}
                >
                  {caseData.vessels.map(v => (
                    <option key={v.mmsi} value={v.mmsi}>{v.name} (MMSI: {v.mmsi})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "9px", color: "#7C9AA3", marginBottom: "4px" }}>BACKTRACK PROJECTED: {simBacktrack} HOURS</label>
                <input
                  type="range" min="1" max="48" value={simBacktrack}
                  onChange={(e) => setSimBacktrack(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#FF6B6B" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "9px", color: "#7C9AA3", marginBottom: "4px" }}>DRIFT HEADING: {simHeading}°</label>
                <input
                  type="range" min="0" max="360" value={simHeading}
                  onChange={(e) => setSimHeading(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#FF6B6B" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "9px", color: "#7C9AA3", marginBottom: "4px" }}>DRIFT SPEED MULTIPLIER: {simDriftSpeed}X</label>
                <input
                  type="range" min="0.1" max="5" step="0.1" value={simDriftSpeed}
                  onChange={(e) => setSimDriftSpeed(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#FF6B6B" }}
                />
              </div>

              <button
                onClick={handleRunScenario}
                style={{
                  width: "100%",
                  background: "#FF6B6B",
                  border: "none",
                  color: "#061419",
                  fontSize: "11px",
                  fontWeight: "bold",
                  padding: "8px",
                  cursor: "pointer",
                  marginBottom: "12px"
                }}
              >
                RUN SCENARIO
              </button>

              {simResult && (
                <div style={{ background: "#0F2B35", padding: "8px", border: "1px dashed #FF6B6B" }}>
                   <div style={{ fontSize: "9px", color: "#FF6B6B", marginBottom: "4px" }}>SCENARIO RESULT (SIMULATED)</div>
                   <div style={{ fontSize: "11px", color: "#D8E4E8", marginBottom: "4px" }}>{simResult.message}</div>
                   <div style={{ fontSize: "10px", color: "#7C9AA3" }}>
                     INTERSECTION PROBABILITY: <strong style={{ color: "#FF6B6B" }}>{(simResult.confidence * 100).toFixed(1)}%</strong>
                   </div>
                </div>
              )}
            </div>
          )}

          {/* Subtle Reset UI for this step */}
          {(selectedVesselMmsi !== null || selectedSpillId !== null || selectedTimeOffset !== 0) && (
            <button
              onClick={handleReset}
              style={{
                position: "absolute",
                top: "80px",
                right: "25px",
                zIndex: 10,
                background: "#091A20",
                border: "1px solid #D6A94A",
                color: "#D6A94A",
                fontSize: "9px",
                padding: "6px 10px",
                cursor: "pointer",
              }}
            >
              RESET INVESTIGATION
            </button>
          )}
        </section>

        <aside className="right-panel">
          <VesselRanking
            vessels={caseData.vessels}
            selectedVesselMmsi={selectedVesselMmsi}
            onVesselSelect={handleVesselSelect}
            onRunWhatIf={handleRunWhatIf}
            onViewTrack={handleViewTrack}
          />

          <EvidencePanel
            evidence={caseData.evidenceChain}
            confidence={caseData.sourceRegion.confidence}
          />
        </aside>

        <section className="timeline-section">
          <Timeline
            backtrack={caseData.backtrack}
            forwardDrift={caseData.forwardDrift}
            selectedTimeOffset={selectedTimeOffset}
            onTimeSelect={setSelectedTimeOffset}
          />
        </section>
      </main>
    </div>
  );
}

export default App;