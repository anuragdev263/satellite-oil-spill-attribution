export interface BacktrackingParticle {
  time: string;
  latitude: number;
  longitude: number;
  distanceFromCenterKm: number;
  likelihood: number;
}

export interface BacktrackingTrajectoryPoint {
  time: string;
  latitude: number;
  longitude: number;
  driftUMs: number;
  driftVMs: number;
}

export interface VesselTrackPoint {
  vesselId: string;
  time: string;
  latitude: number;
  longitude: number;
  speedKnots: number;
  headingDeg: number;
  syntheticLabel: string;
}

export interface SourceAttributionRecord {
  vesselId: string;
  directDistanceKm: number;
  directScore: number;
  averageDistanceKm: number;
  minimumDistanceKm: number;
  trajectoryScore: number;
  hybridScore: number;
  caseId: string;
  spillLatitude: number;
  spillLongitude: number;
  observationTime: string;
  predictedSource: string;
  expectedSource: string;
}

export interface SpillLocationRecord {
  caseId: string;
  latitude: number;
  longitude: number;
  observationTime: string;
  expectedVessel: string;
}

export interface EnvironmentRecord {
  time: string;
  windUMs: number;
  windVMs: number;
  currentUMs: number;
  currentVMs: number;
  oilDriftUMs: number;
  oilDriftVMs: number;
}

export interface BacktrackingPrototypeData {
  particles: BacktrackingParticle[];
  probabilityPoints: BacktrackingParticle[];
  backtrackedTrajectory: BacktrackingTrajectoryPoint[];
  vesselTracks: VesselTrackPoint[];
  sourceAttribution: SourceAttributionRecord[];
  spillLocation: SpillLocationRecord | null;
  environment: EnvironmentRecord[];
  times: string[];
  warnings: string[];
}
