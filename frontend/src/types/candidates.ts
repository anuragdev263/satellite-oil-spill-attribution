export type CandidateSplit = "validation" | "test";

export type GroundTruthLabel = "positive" | "negative";

export type ReviewStatus = "Needs Review" | "Likely Slick" | "False Positive" | "Unclear";

export interface CandidateAsset {
  candidateId: string;
  split: CandidateSplit;
  rank: number;
  tileName: string;
  scene: string;
  acquisitionDate: string;
  compositePreviewUrl: string;
  sourcePreviewFile?: string;
}

export interface CandidateReview {
  candidateId: string;
  status: ReviewStatus;
  notes: string;
  reviewerName?: string;
  updatedAt?: string;
}

export interface Candidate {
  candidateId: string;
  split: CandidateSplit;
  rank: number;
  scene: string;
  acquisitionDate: string;
  tileName: string;
  sourceTilePath: string;
  latitude: number;
  longitude: number;
  projectedBounds: {
    left: number;
    bottom: number;
    right: number;
    top: number;
    centerX: number;
    centerY: number;
  };
  cnnScore: number;
  unetMeanProbability: number;
  unetMaxProbability: number;
  unetP95Probability: number;
  candidatePixelCount: number;
  candidateFraction: number;
  finalFusionScore: number;
  groundTruthLabel?: GroundTruthLabel;
  groundTruthMaskPixels?: number;
  asset?: CandidateAsset;
  review: CandidateReview;
}

export interface FusionSummary {
  createdAt?: string;
  groupedSplitOnly?: boolean;
  cnnModel?: string;
  unetModel?: string;
  imageSize?: number;
  sourceCrs?: string;
  latlonCrs?: string;
  latlonAvailable?: boolean;
  unetThreshold?: number;
  fusionFormula?: string;
  rowsRanked?: number;
  validationTiles?: number;
  testTiles?: number;
  outputs?: {
    previewCount?: number;
  };
  honestDemoFraming?: string[];
}

export interface PipelineRun {
  summary: FusionSummary | null;
  candidates: Candidate[];
  assets: CandidateAsset[];
  warnings: string[];
}

export interface EvaluationSummary {
  totalRows: number;
  validationRows: number;
  testRows: number;
  validationTop12Positives: number;
  testTop12Positives: number;
  cnnTest: {
    f1: number;
    precision: number;
    recall: number;
    aucRoc: number;
  };
  unetTest: {
    dice: number;
    precision: number;
    recall: number;
    threshold: number;
  };
}

export interface CandidateFilters {
  split: CandidateSplit | "all";
  reviewStatus: ReviewStatus | "all";
  reviewed: "all" | "reviewed" | "unreviewed";
  acquisitionDate: string;
  scene: string;
  search: string;
  sortBy: "fusion" | "rank";
}

export type DataLoadState =
  | { status: "loading" }
  | { status: "empty"; message: string }
  | { status: "error"; message: string }
  | { status: "ready"; run: PipelineRun };

export interface ReviewRepository {
  load(): CandidateReview[];
  save(review: CandidateReview): void;
  replaceAll(reviews: CandidateReview[]): void;
  reset(): void;
}
