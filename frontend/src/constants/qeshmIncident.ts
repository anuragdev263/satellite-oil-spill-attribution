export interface IncidentMetadata {
  caseId: string;
  name: string;
  region: string;
  observationDate: string;
  reportedExtent: string;
  reportingAgency: string;
  reportingAgencyUrl: string;
  sourceStatus: string;
  externalAttributionHypothesis: {
    vesselName: string;
    vesselType: string;
    mmsi: string;
    imo: string;
    status: string;
    summary: string;
  };
  disclaimers: {
    aisStatus: string;
    driftStatus: string;
    scoreExplanation: string;
  };
}

export const QESHM_INCIDENT_METADATA: IncidentMetadata = {
  caseId: "OSI-QESHM-20260810",
  name: "Qeshm / Hengam Oil Pollution Event",
  region: "Strait of Hormuz (Qeshm & Hengam Islands, Iran)",
  observationDate: "10 AUG 2026",
  reportedExtent: "~100 km² (Reported Extent)",
  reportingAgency: "UNU-INWEH",
  reportingAgencyUrl: "https://unu.edu/inweh/news/satellite-observations-reveal-extent-major-oil-slicks-near-iran-and-oman",
  sourceStatus: "UNDER INVESTIGATION",
  externalAttributionHypothesis: {
    vesselName: "MINOAN PIONEER",
    vesselType: "BULK CARRIER",
    mmsi: "UNKNOWN",
    imo: "UNKNOWN",
    status: "Reported Likely Source",
    summary: "Identified in external satellite & vessel-tracking analysis (Reuters / UNU-INWEH). Source attribution is not independently confirmed by this system.",
  },
  disclaimers: {
    aisStatus: "Live AIS stream is disconnected. Vessel tracks reflect prototype scenario data.",
    driftStatus: "Environmental drift vectors reflect prototype hydrodynamic scenario inputs.",
    scoreExplanation: "Scenario alignment scores are relative ranking indicators, NOT probabilities or confirmed facts.",
  },
};