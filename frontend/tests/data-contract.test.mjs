import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dataDir = join(root, "public", "data");
const srcDir = join(root, "src");

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
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
  assert.equal(inQuotes, false, "CSV quoted field should terminate");

  const [headers, ...records] = rows;
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])));
}

const csvRows = parseCsv(readFileSync(join(dataDir, "fusion_candidate_rankings.csv"), "utf8"));
const manifest = JSON.parse(readFileSync(join(dataDir, "candidate_assets.json"), "utf8"));
const sourceText = [
  "components/CandidateQueue.tsx",
  "components/CandidateInspector.tsx",
  "components/CandidateMap.tsx",
  "services/fusionDataService.ts",
].map((file) => readFileSync(join(srcDir, file), "utf8")).join("\n");

test("CSV loads the complete held-out candidate table", () => {
  assert.equal(csvRows.length, 81);
  assert.equal(Object.keys(csvRows[0]).length, 23);
  assert.equal(csvRows.filter((row) => row.split === "validation").length, 43);
  assert.equal(csvRows.filter((row) => row.split === "test").length, 38);
});

test("candidate IDs are stable and coordinates/scores are valid", () => {
  const ids = new Set();
  for (const row of csvRows) {
    const id = `${row.split}:${row.tile_name}`;
    assert.equal(ids.has(id), false, `duplicate candidate id ${id}`);
    ids.add(id);
    assert.ok(["test", "validation"].includes(row.split));
    assert.ok(["positive", "negative"].includes(row.label));
    assert.ok(Number(row.latitude) >= -90 && Number(row.latitude) <= 90);
    assert.ok(Number(row.longitude) >= -180 && Number(row.longitude) <= 180);
    assert.ok(Number(row.candidate_pixel_count) >= 0);
    assert.ok(Number(row.candidate_fraction) >= 0 && Number(row.candidate_fraction) <= 1);
    assert.ok(Number.isFinite(Number(row.final_fusion_score)));
  }
});

test("asset manifest maps exactly 24 unique top-rank previews", () => {
  assert.equal(manifest.length, 24);
  const ids = new Set(manifest.map((asset) => asset.candidateId));
  assert.equal(ids.size, 24);

  for (const split of ["test", "validation"]) {
    const ranks = manifest.filter((asset) => asset.split === split).map((asset) => asset.rank).sort((a, b) => a - b);
    assert.deepEqual(ranks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  }

  assert.equal(manifest.filter((asset) => asset.split === "validation" && asset.rank === 6).length, 1);
});

test("manifest previews exist and match CSV split/rank/tile records", () => {
  for (const asset of manifest) {
    const row = csvRows.find((candidate) => candidate.split === asset.split && Number(candidate.rank_within_split) === asset.rank);
    assert.ok(row, `${asset.split} rank ${asset.rank} exists in CSV`);
    assert.equal(asset.tileName, row.tile_name);
    assert.equal(asset.candidateId, `${asset.split}:${row.tile_name}`);
    assert.ok(asset.compositePreviewUrl.endsWith(`${asset.split}_rank_${String(asset.rank).padStart(2, "0")}.png`));
    const filePath = join(root, "public", asset.compositePreviewUrl.replace(/^\//, ""));
    assert.ok(statSync(filePath).size > 0, `${asset.compositePreviewUrl} exists`);
  }
});

test("fusion score is presented as a ranking score, not a percentage confidence", () => {
  assert.match(sourceText, /Fusion Ranking Score/);
  assert.doesNotMatch(sourceText, /finalFusionScore\s*\*\s*100/);
  assert.doesNotMatch(sourceText, /Fusion Ranking Score.*%/);
  assert.doesNotMatch(sourceText, /Oil Confidence|Detection Confidence|Probability of Oil|170% confidence/i);
});
