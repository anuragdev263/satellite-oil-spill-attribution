import "./index.css";
import "./App.css";

import TopBar from "./components/TopBar";
import MapView from "./components/MapView";
import VesselRanking from "./components/VesselRanking";
import EvidencePanel from "./components/EvidencePanel";
import Timeline from "./components/Timeline";

const caseData = {
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
  return (
    <div className="app">
      <TopBar caseData={caseData} />

      <main className="dashboard">
        <section className="map-section">
          <MapView caseData={caseData} />
        </section>

        <aside className="right-panel">
          <VesselRanking vessels={caseData.vessels} />

          <EvidencePanel
            evidence={caseData.evidenceChain}
            confidence={caseData.sourceRegion.confidence}
          />
        </aside>

        <section className="timeline-section">
          <Timeline
            backtrack={caseData.backtrack}
            forwardDrift={caseData.forwardDrift}
          />
        </section>
      </main>
    </div>
  );
}

export default App;