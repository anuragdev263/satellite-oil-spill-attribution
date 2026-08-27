import { useState } from "react";
import BacktrackingPrototypeMap from "./BacktrackingPrototypeMap";
import DataStatePanel from "./DataStatePanel";
import DetectionTopBar from "./DetectionTopBar";
import SourceAttributionPanel from "./SourceAttributionPanel";
import { useBacktrackingData } from "../hooks/useBacktrackingData";

type AttributionConceptWorkspaceProps = {
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

export default function AttributionConceptWorkspace({
  mode,
  onModeChange,
}: AttributionConceptWorkspaceProps) {
  const loadState = useBacktrackingData();
  const [selectedVesselId, setSelectedVesselId] = useState<string | null>(null);

  const topBarFilters = {
    split: "test" as const,
    reviewStatus: "all" as const,
    reviewed: "all" as const,
    acquisitionDate: "all",
    scene: "all",
    search: "",
    sortBy: "fusion" as const,
  };

  if (loadState.status === "loading") {
    return (
      <div className="app">
        <DetectionTopBar summary={null} filters={topBarFilters} mode={mode} onModeChange={onModeChange} />
        <DataStatePanel
          title="Loading backtracking prototype"
          message="Reading scenario data from public/data/backtracking."
        />
      </div>
    );
  }

  if (loadState.status === "error") {
    return (
      <div className="app">
        <DetectionTopBar summary={null} filters={topBarFilters} mode={mode} onModeChange={onModeChange} />
        <DataStatePanel title="Backtracking data unavailable" message={loadState.message} />
      </div>
    );
  }

  const data = loadState.data;

  return (
    <div className="app">
      <DetectionTopBar summary={null} filters={topBarFilters} mode={mode} onModeChange={onModeChange} />

      <main className="prototype-dashboard">
        <BacktrackingPrototypeMap
          data={data}
          selectedVesselId={selectedVesselId}
          onSelectVessel={setSelectedVesselId}
        />
        <SourceAttributionPanel
          data={data}
          selectedVesselId={selectedVesselId}
          onSelectVessel={setSelectedVesselId}
        />
      </main>
    </div>
  );
}
