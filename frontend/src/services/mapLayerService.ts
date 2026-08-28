import type { Feature, FeatureCollection, Geometry } from "geojson";

export type ReviewLayerToggle =
  | "candidatePoints"
  | "candidateFootprints"
  | "qgisReview"
  | "highPriority"
  | "uncertain"
  | "showFilteredLand";

export type IncidentLocation =
  | "all"
  | "historical-2019"
  | "qeshm-hengam-2026"
  | "qeshm-priority"
  | "spatial-review-clusters";

export type ReviewMapLayerId =
  | "candidate-footprints"
  | "qeshm-hengam-priority"
  | "both-high"
  | "all-spatial-review"
  | "uncertain-candidates"
  | "recommended-negative";

export interface ReviewMapLayer {
  id: ReviewMapLayerId;
  label: string;
  url: string;
  provenance: "Historical training/evaluation data" | "2026 case-study data";
  toggle: Exclude<ReviewLayerToggle, "candidatePoints" | "showFilteredLand">;
  collection: FeatureCollection<Geometry>;
}

export interface ReviewMapSelection {
  activeDate: string;
  activeLocation: IncidentLocation;
  toggles: Record<ReviewLayerToggle, boolean>;
  fitNonce: number;
}

export const DEFAULT_REVIEW_MAP_SELECTION: ReviewMapSelection = {
  activeDate: "all",
  activeLocation: "all",
  toggles: {
    candidatePoints: true,
    candidateFootprints: false,
    qgisReview: true,
    highPriority: true,
    uncertain: true,
    showFilteredLand: false,
  },
  fitNonce: 0,
};

const REVIEW_LAYER_MANIFEST: Omit<ReviewMapLayer, "collection">[] = [
  {
    id: "candidate-footprints",
    label: "2019 candidate footprints",
    url: "/data/qgis_layers/candidate_tile_footprints_top100.geojson",
    provenance: "Historical training/evaluation data",
    toggle: "candidateFootprints",
  },
  {
    id: "qeshm-hengam-priority",
    label: "Qeshm/Hengam priority",
    url: "/data/qgis_layers/qeshm_hengam_priority.geojson",
    provenance: "2026 case-study data",
    toggle: "highPriority",
  },
  {
    id: "both-high",
    label: "Both-model high priority",
    url: "/data/qgis_layers/both_high.geojson",
    provenance: "2026 case-study data",
    toggle: "highPriority",
  },
  {
    id: "all-spatial-review",
    label: "QGIS spatial review",
    url: "/data/qgis_layers/all_spatial_review_candidates.geojson",
    provenance: "2026 case-study data",
    toggle: "qgisReview",
  },
  {
    id: "uncertain-candidates",
    label: "Uncertain candidates",
    url: "/data/qgis_layers/uncertain_candidates.geojson",
    provenance: "2026 case-study data",
    toggle: "uncertain",
  },
  {
    id: "recommended-negative",
    label: "Filtered land/coastline candidates",
    url: "/data/qgis_layers/recommended_negative_candidates.geojson",
    provenance: "2026 case-study data",
    toggle: "qgisReview",
  },
];

export async function loadReviewMapLayers(): Promise<ReviewMapLayer[]> {
  return Promise.all(
    REVIEW_LAYER_MANIFEST.map(async (layer) => {
      const response = await fetch(layer.url);
      if (!response.ok) {
        throw new Error(`Map layer ${layer.label} returned HTTP ${response.status}.`);
      }
      const value = (await response.json()) as unknown;
      if (!isFeatureCollection(value)) {
        throw new Error(`Map layer ${layer.label} is not a GeoJSON FeatureCollection.`);
      }
      return { ...layer, collection: value };
    })
  );
}

export function featureDate(feature: Feature<Geometry>): string | null {
  const value = feature.properties?.acquisition_date ?? feature.properties?.acquisitionDate;
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

export function locationForDate(date: string): IncidentLocation {
  if (date.startsWith("2019-")) return "historical-2019";
  if (date.startsWith("2026-")) return "qeshm-hengam-2026";
  return "all";
}

export function filterFeatureCollection(
  layer: ReviewMapLayer,
  selection: ReviewMapSelection
): FeatureCollection<Geometry> {
  const features = layer.collection.features.filter((feature) => {
    const date = featureDate(feature);
    if (selection.activeDate !== "all" && date !== selection.activeDate) return false;
    if (selection.activeLocation === "historical-2019" && layer.provenance !== "Historical training/evaluation data") return false;
    if (selection.activeLocation === "qeshm-hengam-2026" && layer.provenance !== "2026 case-study data") return false;
    if (selection.activeLocation === "qeshm-priority" && layer.id !== "qeshm-hengam-priority") return false;
    if (selection.activeLocation === "spatial-review-clusters" && layer.id !== "all-spatial-review" && layer.id !== "uncertain-candidates") {
      return false;
    }
    if (!selection.toggles.showFilteredLand && isFilteredLandOrCoastlineFeature(layer, feature)) return false;
    return true;
  });

  return { ...layer.collection, features };
}

export function availableMapDates(candidates: { acquisitionDate: string }[], layers: ReviewMapLayer[]): string[] {
  const dates = new Set(candidates.map((candidate) => candidate.acquisitionDate));
  layers.forEach((layer) => {
    layer.collection.features.forEach((feature) => {
      const date = featureDate(feature);
      if (date) dates.add(date);
    });
  });
  return Array.from(dates).sort();
}

function isFilteredLandOrCoastlineFeature(layer: ReviewMapLayer, feature: Feature<Geometry>): boolean {
  if (layer.id === "recommended-negative") return true;
  const properties = feature.properties ?? {};
  const label = String(properties.spatial_review_label ?? properties.approval_recommendation ?? "").toLowerCase();
  return (
    label.includes("recommended_negative") ||
    label.includes("recommended negative") ||
    properties.edge_dominated === true ||
    properties.bright_scatterer_dominated === true ||
    properties.mostly_scattered_speckle === true
  );
}

function isFeatureCollection(value: unknown): value is FeatureCollection<Geometry> {
  if (!value || typeof value !== "object") return false;
  const record = value as { type?: unknown; features?: unknown };
  return record.type === "FeatureCollection" && Array.isArray(record.features);
}
