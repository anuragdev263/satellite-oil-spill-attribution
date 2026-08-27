import type {
  BacktrackingParticle,
  BacktrackingPrototypeData,
  BacktrackingTrajectoryPoint,
  EnvironmentRecord,
  SourceAttributionRecord,
  SpillLocationRecord,
  VesselTrackPoint,
} from "../types/backtracking";

const BASE_URL = "/data/backtracking";

export async function loadBacktrackingPrototypeData(): Promise<BacktrackingPrototypeData> {
  const [
    hourlyParticles,
    probabilityPoints,
    trajectory,
    vesselTracks,
    sourceAttribution,
    spillLocation,
    environment,
  ] = await Promise.all([
    fetchCsv(`${BASE_URL}/hourly_probability_points.csv`, "hourly probability points"),
    fetchCsv(`${BASE_URL}/probability_points.csv`, "probability points"),
    fetchCsv(`${BASE_URL}/backtracked_trajectory.csv`, "backtracked trajectory"),
    fetchCsv(`${BASE_URL}/vessel_tracks.csv`, "vessel tracks"),
    fetchCsv(`${BASE_URL}/source_attribution.csv`, "source attribution"),
    fetchCsv(`${BASE_URL}/spill_location.csv`, "spill location"),
    fetchCsv(`${BASE_URL}/environment_wind_current.csv`, "environment wind/current"),
  ]);

  const particles = hourlyParticles.map(parseParticle("hourly_probability_points.csv"));
  const times = Array.from(new Set(particles.map((particle) => particle.time))).sort();

  return {
    particles,
    probabilityPoints: probabilityPoints.map(parseParticle("probability_points.csv")),
    backtrackedTrajectory: trajectory.map(parseTrajectoryPoint),
    vesselTracks: vesselTracks.map(parseVesselTrackPoint),
    sourceAttribution: sourceAttribution.map(parseSourceAttribution),
    spillLocation: spillLocation.length > 0 ? parseSpillLocation(spillLocation[0], 2) : null,
    environment: environment.map(parseEnvironment),
    times,
    warnings: [],
  };
}

async function fetchCsv(url: string, label: string): Promise<Record<string, string>[]> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Could not reach ${label}.`);
  }

  if (!response.ok) {
    throw new Error(`${label} returned HTTP ${response.status}.`);
  }

  return parseCsv(await response.text());
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);

  if (inQuotes) {
    throw new Error("CSV has an unterminated quoted field.");
  }

  const [headers, ...records] = rows;
  if (!headers) throw new Error("CSV is empty.");

  return records.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]]));
  });
}

function parseParticle(source: string) {
  return (record: Record<string, string>, index: number): BacktrackingParticle => ({
    time: requireText(record.time, "time", source, index),
    latitude: requireNumber(record.latitude, "latitude", source, index, -90, 90),
    longitude: requireNumber(record.longitude, "longitude", source, index, -180, 180),
    distanceFromCenterKm: requireNumber(record.distance_from_center_km, "distance_from_center_km", source, index, 0),
    likelihood: requireNumber(record.likelihood, "likelihood", source, index, 0, 1),
  });
}

function parseTrajectoryPoint(record: Record<string, string>, index: number): BacktrackingTrajectoryPoint {
  return {
    time: requireText(record.time, "time", "backtracked_trajectory.csv", index),
    latitude: requireNumber(record.latitude, "latitude", "backtracked_trajectory.csv", index, -90, 90),
    longitude: requireNumber(record.longitude, "longitude", "backtracked_trajectory.csv", index, -180, 180),
    driftUMs: requireNumber(record.drift_u_ms, "drift_u_ms", "backtracked_trajectory.csv", index),
    driftVMs: requireNumber(record.drift_v_ms, "drift_v_ms", "backtracked_trajectory.csv", index),
  };
}

function parseVesselTrackPoint(record: Record<string, string>, index: number): VesselTrackPoint {
  return {
    vesselId: requireText(record.vessel_id, "vessel_id", "vessel_tracks.csv", index),
    time: requireText(record.time, "time", "vessel_tracks.csv", index),
    latitude: requireNumber(record.latitude, "latitude", "vessel_tracks.csv", index, -90, 90),
    longitude: requireNumber(record.longitude, "longitude", "vessel_tracks.csv", index, -180, 180),
    speedKnots: requireNumber(record.speed_knots, "speed_knots", "vessel_tracks.csv", index, 0),
    headingDeg: requireNumber(record.heading_deg, "heading_deg", "vessel_tracks.csv", index),
    syntheticLabel: record.synthetic_label ?? "",
  };
}

function parseSourceAttribution(record: Record<string, string>, index: number): SourceAttributionRecord {
  return {
    vesselId: requireText(record.vessel_id, "vessel_id", "source_attribution.csv", index),
    directDistanceKm: requireNumber(record.direct_distance_km, "direct_distance_km", "source_attribution.csv", index, 0),
    directScore: requireNumber(record.direct_score, "direct_score", "source_attribution.csv", index, 0),
    averageDistanceKm: requireNumber(record.average_distance_km, "average_distance_km", "source_attribution.csv", index, 0),
    minimumDistanceKm: requireNumber(record.minimum_distance_km, "minimum_distance_km", "source_attribution.csv", index, 0),
    trajectoryScore: requireNumber(record.trajectory_score, "trajectory_score", "source_attribution.csv", index, 0),
    hybridScore: requireNumber(record.hybrid_score, "hybrid_score", "source_attribution.csv", index, 0),
    caseId: requireText(record.case_id, "case_id", "source_attribution.csv", index),
    spillLatitude: requireNumber(record.spill_latitude, "spill_latitude", "source_attribution.csv", index, -90, 90),
    spillLongitude: requireNumber(record.spill_longitude, "spill_longitude", "source_attribution.csv", index, -180, 180),
    observationTime: requireText(record.observation_time, "observation_time", "source_attribution.csv", index),
    predictedSource: requireText(record.predicted_source, "predicted_source", "source_attribution.csv", index),
    expectedSource: requireText(record.expected_source, "expected_source", "source_attribution.csv", index),
  };
}

function parseSpillLocation(record: Record<string, string>, index: number): SpillLocationRecord {
  return {
    caseId: requireText(record.case_id, "case_id", "spill_location.csv", index),
    latitude: requireNumber(record.latitude, "latitude", "spill_location.csv", index, -90, 90),
    longitude: requireNumber(record.longitude, "longitude", "spill_location.csv", index, -180, 180),
    observationTime: requireText(record.observation_time, "observation_time", "spill_location.csv", index),
    expectedVessel: requireText(record.expected_vessel, "expected_vessel", "spill_location.csv", index),
  };
}

function parseEnvironment(record: Record<string, string>, index: number): EnvironmentRecord {
  return {
    time: requireText(record.time, "time", "environment_wind_current.csv", index),
    windUMs: requireNumber(record.wind_u_ms, "wind_u_ms", "environment_wind_current.csv", index),
    windVMs: requireNumber(record.wind_v_ms, "wind_v_ms", "environment_wind_current.csv", index),
    currentUMs: requireNumber(record.current_u_ms, "current_u_ms", "environment_wind_current.csv", index),
    currentVMs: requireNumber(record.current_v_ms, "current_v_ms", "environment_wind_current.csv", index),
    oilDriftUMs: requireNumber(record.oil_drift_u_ms, "oil_drift_u_ms", "environment_wind_current.csv", index),
    oilDriftVMs: requireNumber(record.oil_drift_v_ms, "oil_drift_v_ms", "environment_wind_current.csv", index),
  };
}

function requireText(value: string | undefined, field: string, source: string, index: number): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`${source} row ${index + 2} is missing ${field}.`);
  }
  return value.trim();
}

function requireNumber(
  value: string | undefined,
  field: string,
  source: string,
  index: number,
  min?: number,
  max?: number
): number {
  const numeric = Number(requireText(value, field, source, index));
  if (!Number.isFinite(numeric)) {
    throw new Error(`${source} row ${index + 2} field ${field} is not a finite number.`);
  }
  if (min !== undefined && numeric < min) {
    throw new Error(`${source} row ${index + 2} field ${field} is below ${min}.`);
  }
  if (max !== undefined && numeric > max) {
    throw new Error(`${source} row ${index + 2} field ${field} is above ${max}.`);
  }
  return numeric;
}
