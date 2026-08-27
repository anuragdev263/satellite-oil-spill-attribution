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
  evidence?: {
    label: string;
    score: number;
    description: string;
  }[];
}

export type InvestigationStage = 'DETECTION' | 'SOURCE_ESTIMATION' | 'VESSEL_TRACK' | 'BACKTRACK' | 'ATTRIBUTION';