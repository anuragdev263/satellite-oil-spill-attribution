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

export interface ConceptCaseData {
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
