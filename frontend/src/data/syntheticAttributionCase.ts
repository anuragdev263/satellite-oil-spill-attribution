import type { ConceptCaseData } from "../types/attribution";

export const qeshmAttributionCase: ConceptCaseData = {
  caseId: "OSI-QESHM-20260810",
  status: "REAL INCIDENT",
  region: "STRAIT OF HORMUZ • QESHM & HENGAM",
  observation: {
    time: "10 AUG 2026 • 10:00 UTC",
  },
  slick: {
    areaKm2: 100.4, 
    oilConfidence: 0.95, // High confidence based on UNU-INWEH report
  },
  sourceRegion: {
    latitude: 26.643, // Near Hengam Island
    longitude: 55.882,
    confidence: 0.82,
  },
  vessels: [
    { 
      rank: 1, 
      name: "MINOAN PIONEER", 
      mmsi: "UNKNOWN", // Excluded real MMSI to prevent fabricated AIS claims
      imo: "UNKNOWN", 
      type: "BULK CARRIER", 
      flag: "UNKNOWN", 
      latitude: 26.65, 
      longitude: 55.90, 
      score: 0.88 // Derived hypothesis score based on external tracking analysis
    },
    { rank: 2, name: "SYNTHETIC TANKER A", mmsi: "000000001", imo: "0000001", type: "TANKER", flag: "PANAMA", latitude: 26.61, longitude: 55.82, score: 0.65 },
    { rank: 3, name: "SYNTHETIC TANKER B", mmsi: "000000002", imo: "0000002", type: "TANKER", flag: "LIBERIA", latitude: 26.70, longitude: 55.95, score: 0.42 },
  ],
  evidenceChain: [
    { 
      label: "OBSERVED FACT", 
      score: 0.95, 
      description: "100 km² oil-contaminated water observed via satellite (UNU-INWEH, Aug 14)." 
    },
    { 
      label: "EXTERNAL REPORT", 
      score: 0.90, 
      description: "Reuters tracking analysis indicates potential damage to bulk carrier Minoan Pioneer." 
    },
    { 
      label: "MODEL HYPOTHESIS", 
      score: 0.88, 
      description: "Backtracking simulation aligns source region with Minoan Pioneer trajectory." 
    },
    { 
      label: "SYNTHETIC DEMO", 
      score: 0.0, 
      description: "Other surrounding vessels are populated with synthetic data for platform demonstration." 
    },
  ],
  backtrack: [
    { hoursAgo: 24 },
    { hoursAgo: 18 },
    { hoursAgo: 12 },
    { hoursAgo: 6 },
    { hoursAgo: 0 },
  ],
  forwardDrift: [{ hoursAhead: 12 }, { hoursAhead: 24 }, { hoursAhead: 48 }],
};

export const mockCase = {
  caseId: "OSI-QESHM-20260810",
  status: "ACTIVE INVESTIGATION",
  region: "STRAIT OF HORMUZ",
  observation: {
    time: "10 AUG 2026 • 10:00 UTC",
    latitude: 26.67,
    longitude: 55.85,
  },
  slick: {
    areaKm2: 100.4,
    oilConfidence: 0.95,
    polygon: [
      [55.83, 26.65],
      [55.88, 26.68],
      [55.90, 26.66],
      [55.85, 26.63],
      [55.83, 26.65],
    ],
  },
  sourceRegion: {
    latitude: 26.643,
    longitude: 55.882,
    radiusKm: 8.5,
    confidence: 0.82,
  },
  backtrack: [
    { hoursAgo: 0, latitude: 26.67, longitude: 55.85 },
    { hoursAgo: 6, latitude: 26.66, longitude: 55.86 },
    { hoursAgo: 12, latitude: 26.65, longitude: 55.87 },
    { hoursAgo: 24, latitude: 26.643, longitude: 55.882 },
  ],
  vessels: [
    {
      rank: 1,
      name: "MINOAN PIONEER",
      mmsi: "HYPOTHESIS",
      imo: "HYPOTHESIS",
      type: "BULK CARRIER",
      flag: "REPORTED",
      score: 0.88,
      evidence: {
        proximity: 0.92,
        timing: 0.89,
        course: 0.85,
        radioGap: 0.10,
        vesselType: 0.70,
      },
      latitude: 26.65,
      longitude: 55.90,
    }
  ],
  forwardDrift: [
    { hoursAhead: 12, latitude: 26.69, longitude: 55.82 },
    { hoursAhead: 24, latitude: 26.71, longitude: 55.79 },
  ],
  evidenceChain: [
    {
      label: "SATELLITE OBSERVATION",
      score: 0.95,
      description: "Extensive slick identified off Hengam Island",
    },
    {
      label: "EXTERNAL ATTRIBUTION",
      score: 0.88,
      description: "Reuters & UNU-INWEH cite Minoan Pioneer as probable source",
    },
  ],
};