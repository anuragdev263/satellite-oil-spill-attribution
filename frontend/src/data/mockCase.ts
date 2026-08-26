export const mockCase = {
  caseId: "ST-2026-0184",

  status: "UNRESOLVED",

  region: "ARABIAN SEA",

  observation: {
    time: "20 AUG 2026 • 12:00 UTC",
    latitude: 19.53,
    longitude: 70.09,
  },

  slick: {
    areaKm2: 12.4,
    oilConfidence: 0.91,

    polygon: [
      [70.075, 19.525],
      [70.083, 19.532],
      [70.098, 19.536],
      [70.108, 19.529],
      [70.101, 19.520],
      [70.088, 19.516],
      [70.075, 19.525],
    ],
  },

  sourceRegion: {
    latitude: 19.505,
    longitude: 70.025,
    radiusKm: 5.2,
    confidence: 0.82,
  },

  backtrack: [
    {
      hoursAgo: 0,
      latitude: 19.53,
      longitude: 70.09,
    },
    {
      hoursAgo: 1,
      latitude: 19.524,
      longitude: 70.079,
    },
    {
      hoursAgo: 2,
      latitude: 19.518,
      longitude: 70.068,
    },
    {
      hoursAgo: 3,
      latitude: 19.513,
      longitude: 70.057,
    },
    {
      hoursAgo: 4,
      latitude: 19.510,
      longitude: 70.046,
    },
    {
      hoursAgo: 5,
      latitude: 19.507,
      longitude: 70.036,
    },
    {
      hoursAgo: 6,
      latitude: 19.505,
      longitude: 70.025,
    },
  ],

  vessels: [
    {
      rank: 1,
      name: "MV OCEAN STAR",
      mmsi: "419001234",
      imo: "9876543",
      type: "TANKER",
      flag: "INDIA",

      score: 0.82,

      evidence: {
        proximity: 0.94,
        timing: 0.88,
        course: 0.96,
        radioGap: 0.21,
        vesselType: 1.0,
      },

      latitude: 19.507,
      longitude: 70.028,
    },

    {
      rank: 2,
      name: "MT BLUE HORIZON",
      mmsi: "419005678",
      imo: "9765432",
      type: "CARGO",
      flag: "INDIA",

      score: 0.67,

      evidence: {
        proximity: 0.78,
        timing: 0.72,
        course: 0.61,
        radioGap: 0.12,
        vesselType: 0.65,
      },

      latitude: 19.49,
      longitude: 70.04,
    },

    {
      rank: 3,
      name: "MV SEA QUEST",
      mmsi: "419009876",
      imo: "9654321",
      type: "CONTAINER",
      flag: "PANAMA",

      score: 0.51,

      evidence: {
        proximity: 0.62,
        timing: 0.55,
        course: 0.48,
        radioGap: 0.05,
        vesselType: 0.42,
      },

      latitude: 19.47,
      longitude: 70.075,
    },

    {
      rank: 4,
      name: "MT EASTERN WIND",
      mmsi: "419003456",
      imo: "9543210",
      type: "TANKER",
      flag: "LIBERIA",

      score: 0.39,

      evidence: {
        proximity: 0.44,
        timing: 0.39,
        course: 0.42,
        radioGap: 0.08,
        vesselType: 0.88,
      },

      latitude: 19.56,
      longitude: 70.12,
    },
  ],

  forwardDrift: [
    {
      hoursAhead: 6,
      latitude: 19.54,
      longitude: 70.105,
    },
    {
      hoursAhead: 12,
      latitude: 19.55,
      longitude: 70.121,
    },
    {
      hoursAhead: 24,
      latitude: 19.57,
      longitude: 70.145,
    },
    {
      hoursAhead: 48,
      latitude: 19.61,
      longitude: 70.192,
    },
    {
      hoursAhead: 72,
      latitude: 19.67,
      longitude: 70.248,
    },
  ],

  evidenceChain: [
    {
      label: "SATELLITE DETECTION",
      score: 0.91,
      description: "SAR signature is oil-like",
    },
    {
      label: "SAR PHYSICAL EVIDENCE",
      score: 0.78,
      description: "Texture and shape are consistent",
    },
    {
      label: "AIS CORRELATION",
      score: 0.84,
      description: "Candidate track intersects source window",
    },
    {
      label: "BACKTRACK CONSISTENCY",
      score: 0.86,
      description: "Trajectory reaches probable source region",
    },
    {
      label: "ENVIRONMENT",
      score: 0.73,
      description: "Wind/current conditions are consistent",
    },
  ],
};