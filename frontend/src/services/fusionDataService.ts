import type {
  Candidate,
  CandidateAsset,
  CandidateReview,
  CandidateSplit,
  EvaluationSummary,
  FusionSummary,
  PipelineRun,
} from "../types/candidates";
import { createDefaultReview } from "./reviewRepository";

const RANKINGS_URL = "/data/fusion_candidate_rankings.csv";
const SUMMARY_URL = "/data/fusion_summary.json";
const ASSETS_URL = "/data/candidate_assets.json";

const REQUIRED_HEADERS = [
  "rank_within_split",
  "split",
  "scene",
  "acquisition_date",
  "tile_name",
  "tile",
  "label",
  "mask_pixels",
  "latitude",
  "longitude",
  "left",
  "bottom",
  "right",
  "top",
  "center_x",
  "center_y",
  "cnn_score",
  "unet_mean_probability",
  "unet_max_probability",
  "unet_p95_probability",
  "candidate_pixel_count",
  "candidate_fraction",
  "final_fusion_score",
];

export const EVALUATION_SUMMARY: EvaluationSummary = {
  totalRows: 81,
  validationRows: 43,
  testRows: 38,
  validationTop12Positives: 5,
  testTop12Positives: 3,
  cnnTest: {
    f1: 0.324,
    precision: 0.222,
    recall: 0.6,
    aucRoc: 0.557,
  },
  unetTest: {
    dice: 0.0137,
    precision: 0.0077,
    recall: 0.0626,
    threshold: 0.2,
  },
};

export async function loadPipelineRun(reviews: CandidateReview[]): Promise<PipelineRun> {
  const [csvText, summaryJson, assetsJson] = await Promise.all([
    fetchText(RANKINGS_URL, "candidate rankings CSV"),
    fetchJson(SUMMARY_URL, "fusion summary JSON"),
    fetchJson(ASSETS_URL, "candidate asset manifest"),
  ]);

  const summary = parseFusionSummary(summaryJson);
  const assets = parseAssetManifest(assetsJson);
  const reviewMap = new Map(reviews.map((review) => [review.candidateId, review]));
  const warnings: string[] = [];
  const candidates = parseCandidateCsv(csvText, assets, reviewMap, warnings);

  if (summary.rowsRanked !== undefined && summary.rowsRanked !== candidates.length) {
    warnings.push(
      `Summary rows_ranked is ${summary.rowsRanked}, but ${candidates.length} CSV rows loaded.`
    );
  }

  if (summary.outputs?.previewCount !== undefined && summary.outputs.previewCount !== assets.length) {
    warnings.push(
      `Summary preview_count is ${summary.outputs.previewCount}, but ${assets.length} manifest records loaded.`
    );
  }

  return {
    summary,
    candidates,
    assets,
    warnings,
  };
}

async function fetchText(url: string, label: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    throw new Error(`Could not reach the ${label}.`);
  }

  if (!response.ok) {
    throw new Error(`The ${label} returned HTTP ${response.status}.`);
  }

  return response.text();
}

async function fetchJson(url: string, label: string): Promise<unknown> {
  const text = await fetchText(url, label);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`The ${label} is not valid JSON.`);
  }
}

export function parseCsvRecords(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

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
  if (!headers) {
    throw new Error("CSV is empty.");
  }

  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length > 0) {
    throw new Error(`CSV is missing required headers: ${missing.join(", ")}.`);
  }

  return records.map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} fields; expected ${headers.length}.`);
    }
    return Object.fromEntries(headers.map((header, columnIndex) => [header, values[columnIndex]]));
  });
}

function parseCandidateCsv(
  csvText: string,
  assets: CandidateAsset[],
  reviews: Map<string, CandidateReview>,
  warnings: string[]
): Candidate[] {
  const records = parseCsvRecords(csvText);
  const seen = new Set<string>();
  const assetsByCandidate = new Map(assets.map((asset) => [asset.candidateId, asset]));

  return records.map((record, index) => {
    const rowNumber = index + 2;
    const split = requireSplit(record.split, rowNumber);
    const tileName = requireText(record.tile_name, "tile_name", rowNumber);
    const candidateId = `${split}:${tileName}`;

    if (seen.has(candidateId)) {
      throw new Error(`CSV row ${rowNumber} duplicates candidate ID ${candidateId}.`);
    }
    seen.add(candidateId);

    const rank = requireInteger(record.rank_within_split, "rank_within_split", rowNumber, 1);
    const label = requireLabel(record.label, rowNumber);
    const maskPixels = requireInteger(record.mask_pixels, "mask_pixels", rowNumber, 0);
    const latitude = requireNumber(record.latitude, "latitude", rowNumber, -90, 90);
    const longitude = requireNumber(record.longitude, "longitude", rowNumber, -180, 180);
    const candidatePixelCount = requireInteger(record.candidate_pixel_count, "candidate_pixel_count", rowNumber, 0);
    const candidateFraction = requireNumber(record.candidate_fraction, "candidate_fraction", rowNumber, 0, 1);

    const asset = assetsByCandidate.get(candidateId);
    if (asset && (asset.split !== split || asset.rank !== rank || asset.tileName !== tileName)) {
      throw new Error(`Asset manifest mismatch for ${candidateId}.`);
    }
    if (!asset && rank <= 12) {
      warnings.push(`No preview asset is available for ${split} rank ${rank}.`);
    }

    return {
      candidateId,
      split,
      rank,
      scene: requireText(record.scene, "scene", rowNumber),
      acquisitionDate: requireText(record.acquisition_date, "acquisition_date", rowNumber),
      tileName,
      sourceTilePath: requireText(record.tile, "tile", rowNumber),
      latitude,
      longitude,
      projectedBounds: {
        left: requireNumber(record.left, "left", rowNumber),
        bottom: requireNumber(record.bottom, "bottom", rowNumber),
        right: requireNumber(record.right, "right", rowNumber),
        top: requireNumber(record.top, "top", rowNumber),
        centerX: requireNumber(record.center_x, "center_x", rowNumber),
        centerY: requireNumber(record.center_y, "center_y", rowNumber),
      },
      cnnScore: requireNumber(record.cnn_score, "cnn_score", rowNumber),
      unetMeanProbability: requireNumber(record.unet_mean_probability, "unet_mean_probability", rowNumber),
      unetMaxProbability: requireNumber(record.unet_max_probability, "unet_max_probability", rowNumber),
      unetP95Probability: requireNumber(record.unet_p95_probability, "unet_p95_probability", rowNumber),
      candidatePixelCount,
      candidateFraction,
      finalFusionScore: requireNumber(record.final_fusion_score, "final_fusion_score", rowNumber),
      groundTruthLabel: label,
      groundTruthMaskPixels: maskPixels,
      asset,
      review: reviews.get(candidateId) ?? createDefaultReview(candidateId),
    };
  });
}

function parseAssetManifest(value: unknown): CandidateAsset[] {
  if (!Array.isArray(value)) {
    throw new Error("Asset manifest must be an array.");
  }

  const seenCandidates = new Set<string>();
  const seenSplitRanks = new Set<string>();

  return value.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`Asset manifest record ${index + 1} is not an object.`);
    }
    const record = item as Record<string, unknown>;
    const split = requireManifestSplit(record.split, index + 1);
    const rank = requireManifestInteger(record.rank, "rank", index + 1, 1);
    const tileName = requireManifestText(record.tileName, "tileName", index + 1);
    const candidateId = requireManifestText(record.candidateId, "candidateId", index + 1);
    const splitRankKey = `${split}:${rank}`;

    if (candidateId !== `${split}:${tileName}`) {
      throw new Error(`Asset manifest record ${index + 1} has an inconsistent candidateId.`);
    }
    if (seenCandidates.has(candidateId)) {
      throw new Error(`Asset manifest duplicates candidate ID ${candidateId}.`);
    }
    if (seenSplitRanks.has(splitRankKey)) {
      throw new Error(`Asset manifest duplicates ${split} rank ${rank}.`);
    }
    seenCandidates.add(candidateId);
    seenSplitRanks.add(splitRankKey);

    return {
      candidateId,
      split,
      rank,
      tileName,
      scene: requireManifestText(record.scene, "scene", index + 1),
      acquisitionDate: requireManifestText(record.acquisitionDate, "acquisitionDate", index + 1),
      compositePreviewUrl: requireManifestText(record.compositePreviewUrl, "compositePreviewUrl", index + 1),
      sourcePreviewFile:
        typeof record.sourcePreviewFile === "string" ? record.sourcePreviewFile : undefined,
    };
  });
}

function parseFusionSummary(value: unknown): FusionSummary {
  if (!value || typeof value !== "object") {
    throw new Error("Fusion summary must be a JSON object.");
  }

  const record = value as Record<string, unknown>;
  const outputs = record.outputs && typeof record.outputs === "object"
    ? (record.outputs as Record<string, unknown>)
    : undefined;

  return {
    createdAt: optionalString(record.created_at),
    groupedSplitOnly: optionalBoolean(record.grouped_split_only),
    cnnModel: optionalBasename(record.cnn_model),
    unetModel: optionalBasename(record.unet_model),
    imageSize: optionalFiniteNumber(record.image_size),
    sourceCrs: optionalString(record.source_crs),
    latlonCrs: optionalString(record.latlon_crs),
    latlonAvailable: optionalBoolean(record.latlon_available),
    unetThreshold: optionalFiniteNumber(record.unet_threshold),
    fusionFormula: optionalString(record.fusion_formula),
    rowsRanked: optionalFiniteNumber(record.rows_ranked),
    validationTiles: optionalFiniteNumber(record.validation_tiles),
    testTiles: optionalFiniteNumber(record.test_tiles),
    outputs: {
      previewCount: outputs ? optionalFiniteNumber(outputs.preview_count) : undefined,
    },
    honestDemoFraming: Array.isArray(record.honest_demo_framing)
      ? record.honest_demo_framing.filter((item): item is string => typeof item === "string")
      : undefined,
  };
}

function requireText(value: string | undefined, field: string, rowNumber: number): string {
  if (value === undefined || value.trim() === "") {
    throw new Error(`CSV row ${rowNumber} is missing ${field}.`);
  }
  return value.trim();
}

function requireSplit(value: string | undefined, rowNumber: number): CandidateSplit {
  const split = requireText(value, "split", rowNumber).toLowerCase();
  if (split !== "validation" && split !== "test") {
    throw new Error(`CSV row ${rowNumber} has unsupported split ${value}.`);
  }
  return split;
}

function requireLabel(value: string | undefined, rowNumber: number): "positive" | "negative" {
  const label = requireText(value, "label", rowNumber).toLowerCase();
  if (label !== "positive" && label !== "negative") {
    throw new Error(`CSV row ${rowNumber} has unsupported label ${value}.`);
  }
  return label;
}

function requireInteger(value: string | undefined, field: string, rowNumber: number, min?: number): number {
  const numeric = requireNumber(value, field, rowNumber);
  if (!Number.isInteger(numeric)) {
    throw new Error(`CSV row ${rowNumber} field ${field} must be an integer.`);
  }
  if (min !== undefined && numeric < min) {
    throw new Error(`CSV row ${rowNumber} field ${field} must be at least ${min}.`);
  }
  return numeric;
}

function requireNumber(
  value: string | undefined,
  field: string,
  rowNumber: number,
  min?: number,
  max?: number
): number {
  const text = requireText(value, field, rowNumber);
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) {
    throw new Error(`CSV row ${rowNumber} field ${field} is not a finite number.`);
  }
  if (min !== undefined && numeric < min) {
    throw new Error(`CSV row ${rowNumber} field ${field} is below ${min}.`);
  }
  if (max !== undefined && numeric > max) {
    throw new Error(`CSV row ${rowNumber} field ${field} is above ${max}.`);
  }
  return numeric;
}

function requireManifestText(value: unknown, field: string, index: number): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Asset manifest record ${index} is missing ${field}.`);
  }
  return value.trim();
}

function requireManifestInteger(value: unknown, field: string, index: number, min?: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(numeric)) {
    throw new Error(`Asset manifest record ${index} field ${field} must be an integer.`);
  }
  if (min !== undefined && numeric < min) {
    throw new Error(`Asset manifest record ${index} field ${field} must be at least ${min}.`);
  }
  return numeric;
}

function requireManifestSplit(value: unknown, index: number): CandidateSplit {
  if (value !== "validation" && value !== "test") {
    throw new Error(`Asset manifest record ${index} has unsupported split.`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function optionalBasename(value: unknown): string | undefined {
  const text = optionalString(value);
  if (!text) return undefined;
  return text.split(/[/\\]/).pop() || text;
}
