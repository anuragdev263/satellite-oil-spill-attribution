import { Crosshair, Layers } from "lucide-react";
import {
  availableMapDates,
  locationForDate,
  type IncidentLocation,
  type ReviewLayerToggle,
  type ReviewMapLayer,
  type ReviewMapSelection,
} from "../services/mapLayerService";
import type { Candidate } from "../types/candidates";

type MapControlShelfProps = {
  candidates: Candidate[];
  layers: ReviewMapLayer[];
  selection: ReviewMapSelection;
  layerError: string | null;
  onChange: (selection: ReviewMapSelection) => void;
};

const MAP_TOGGLE_LABELS: { id: ReviewLayerToggle; label: string }[] = [
  { id: "candidatePoints", label: "Points" },
  { id: "candidateFootprints", label: "Footprints" },
  { id: "qgisReview", label: "QGIS" },
  { id: "highPriority", label: "Priority" },
  { id: "uncertain", label: "Uncertain" },
  { id: "showFilteredLand", label: "Show filtered land/coastline" },
];

export default function MapControlShelf({
  candidates,
  layers,
  selection,
  layerError,
  onChange,
}: MapControlShelfProps) {
  const dates = availableMapDates(candidates, layers);
  const activeProvenance =
    selection.activeDate === "all"
      ? "Mixed review layers"
      : locationForDate(selection.activeDate) === "historical-2019"
        ? "Historical training/evaluation"
        : "2026 Qeshm/Hengam case study";

  return (
    <section className="map-control-shelf" aria-label="Map controls">
      <div className="control-title">
        <Layers size={15} />
        <span>Map Controls</span>
      </div>
      <label>
        <span>Date</span>
        <select
          value={selection.activeDate}
          onChange={(event) => {
            const activeDate = event.target.value;
            onChange({
              ...selection,
              activeDate,
              activeLocation: activeDate === "all" ? selection.activeLocation : locationForDate(activeDate),
              fitNonce: selection.fitNonce + 1,
            });
          }}
        >
          <option value="all">All dates</option>
          {dates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Location / layer</span>
        <select
          value={selection.activeLocation}
          onChange={(event) =>
            onChange({
              ...selection,
              activeLocation: event.target.value as IncidentLocation,
              fitNonce: selection.fitNonce + 1,
            })
          }
        >
          <option value="all">All map evidence</option>
          <option value="historical-2019">2019 SAR scenes</option>
          <option value="qeshm-hengam-2026">Qeshm/Hengam 2026</option>
          <option value="qeshm-priority">Qeshm priority layer</option>
          <option value="spatial-review-clusters">Spatial review clusters</option>
        </select>
      </label>
      <div className="control-toggle-row">
        {MAP_TOGGLE_LABELS.map((toggle) => (
          <label key={toggle.id} title={toggle.id === "showFilteredLand" ? "Debug: reveal candidates filtered from default review layers." : undefined}>
            <input
              type="checkbox"
              checked={selection.toggles[toggle.id]}
              onChange={(event) =>
                onChange({
                  ...selection,
                  toggles: { ...selection.toggles, [toggle.id]: event.target.checked },
                })
              }
            />
            <span>{toggle.label}</span>
          </label>
        ))}
      </div>
      <button
        className="console-button subtle compact-action"
        type="button"
        onClick={() => onChange({ ...selection, fitNonce: selection.fitNonce + 1 })}
      >
        <Crosshair size={13} />
        Fit
      </button>
      <span className="control-provenance">{activeProvenance}</span>
      {layerError ? <span className="map-layer-error">{layerError}</span> : null}
    </section>
  );
}
