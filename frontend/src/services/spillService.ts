import type {
  SpillDetectionCollection,
  SpillDetectionFeature,
  SpillStats,
} from "../types/spill";

const SPILL_DATA_URL = "/data/spill_polygons.geojson";

/**
 * Basic structural validation - enough to catch a missing file, a truncated
 * download, or an unexpected shape, without pulling in a full schema
 * validator for a single, internally-produced file.
 */
function isValidSpillCollection(value: unknown): value is SpillDetectionCollection {
  if (!value || typeof value !== "object") return false;
  const fc = value as Record<string, unknown>;
  if (fc.type !== "FeatureCollection" || !Array.isArray(fc.features)) return false;

  return fc.features.every((feature) => {
    if (!feature || typeof feature !== "object") return false;
    const f = feature as Record<string, unknown>;
    if (f.type !== "Feature") return false;

    const geometry = f.geometry as Record<string, unknown> | undefined;
    if (!geometry || geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) {
      return false;
    }

    const props = f.properties as Record<string, unknown> | undefined;
    if (!props || typeof props.area_km2 !== "number" || typeof props.id !== "number") {
      return false;
    }

    return true;
  });
}

export function computeSpillStats(data: SpillDetectionCollection): SpillStats {
  let totalDetectedAreaKm2 = 0;
  let largest: SpillDetectionFeature | null = null;

  for (const feature of data.features) {
    totalDetectedAreaKm2 += feature.properties.area_km2;
    if (!largest || feature.properties.area_km2 > largest.properties.area_km2) {
      largest = feature;
    }
  }

  return {
    count: data.features.length,
    totalDetectedAreaKm2: Math.round(totalDetectedAreaKm2 * 100) / 100,
    largest,
  };
}

/** Computes the [minLng, minLat, maxLng, maxLat] bounding box of a collection. */
export function boundingBoxOf(
  data: SpillDetectionCollection
): [number, number, number, number] | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let sawPoint = false;

  for (const feature of data.features) {
    for (const ring of feature.geometry.coordinates) {
      for (const [lng, lat] of ring) {
        sawPoint = true;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      }
    }
  }

  return sawPoint ? [minLng, minLat, maxLng, maxLat] : null;
}

/**
 * Fetches and validates the detected-slick polygon GeoJSON.
 * Throws a descriptive Error on any network, parse, or shape failure -
 * callers are expected to catch this and show the error state.
 */
export async function loadSpillDetections(): Promise<SpillDetectionCollection> {
  let response: Response;
  try {
    response = await fetch(SPILL_DATA_URL);
  } catch {
    throw new Error("Could not reach the detection data file.");
  }

  if (!response.ok) {
    throw new Error(`Detection data file returned ${response.status}.`);
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new Error("Detection data file is not valid JSON.");
  }

  if (!isValidSpillCollection(json)) {
    throw new Error("Detection data file does not match the expected format.");
  }

  return json;
}