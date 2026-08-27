import type { Feature, FeatureCollection, Polygon } from "geojson";

/**
 * Properties attached to each detected-slick polygon feature.
 *
 * This matches the current interim data contract: raw ML/GIS output filtered
 * down to individually-scored candidate detections (see
 * scripts/extract_top_detections.mjs). Only `id` and `area_km2` are backed by
 * real upstream data today - do NOT add attribution/confidence fields here
 * until the real ML/GIS case-data contract (see WORKFLOW - NEXT) supplies them.
 */
export interface SpillDetectionProperties {
  id: number;
  area_km2: number;
}

export type SpillDetectionFeature = Feature<Polygon, SpillDetectionProperties>;
export type SpillDetectionCollection = FeatureCollection<Polygon, SpillDetectionProperties>;

/** Aggregate stats derived from a loaded detection collection. */
export interface SpillStats {
  count: number;
  /** Sum of each polygon's own area. Polygons in this dataset do not overlap,
   * so this sum is a true total - but it is a sum of *individually detected
   * regions*, not a scientifically deduplicated "unique spill area". */
  totalDetectedAreaKm2: number;
  largest: SpillDetectionFeature | null;
}

export type SpillLoadState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "loaded"; data: SpillDetectionCollection; stats: SpillStats };