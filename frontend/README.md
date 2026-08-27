# OilSpill Intelligence Frontend

OilSpill Intelligence is a React, TypeScript and MapLibre review console for the SIH 2026 SAR oil-spill prototype. The default workspace is Detection Review, a data-backed candidate slick review queue. The Source Attribution workspace is preserved as a synthetic concept demo only.

The Source Attribution workspace can load the uploaded backtracking prototype CSVs from `public/data/backtracking/`. That data is explicitly labelled "Backtracking Prototype / Synthetic Attribution Data" and is not linked to the SAR Detection Review candidates.

## Current Pipeline

The real supplied pipeline is:

```text
SAR tile -> CNN screening score -> U-Net heatmap -> fusion ranking score -> ranked candidate-review queue -> human review
```

This experimental system prioritizes SAR regions for human review. It does not confirm an oil spill or identify a responsible vessel.

## Setup

```bash
npm install
npm run dev
npm run build
npm run lint
npm test
```

In this environment, dependency installation required `npm install --strict-ssl=false` because npm package fetches failed with `UNABLE_TO_VERIFY_LEAF_SIGNATURE`.

## Static Data Locations

The app loads static SIH demo outputs from:

```text
public/data/fusion_candidate_rankings.csv
public/data/fusion_summary.json
public/data/candidate_assets.json
public/data/previews/test/test_rank_01.png ... test_rank_12.png
public/data/previews/validation/validation_rank_01.png ... validation_rank_12.png
```

The CSV contains 81 held-out candidate rows: 43 Validation and 38 Test. The preview manifest maps exactly 24 unique top-candidate previews: Test ranks 1-12 and Validation ranks 1-12.

## Architecture

Core data and validation live in `src/services/fusionDataService.ts`. Manual review persistence lives behind `ReviewRepository` in `src/services/reviewRepository.ts`, with a localStorage implementation for this static demo.

Main UI components:

- `DetectionReviewWorkspace`: real CSV/JSON/image-driven review workflow.
- `CandidateQueue`: filterable and sortable candidate list.
- `CandidateMap`: MapLibre tile-centre point map.
- `CandidateInspector`: preview, model fields and manual review controls.
- `EvaluationPanel`: held-out ground truth and metrics, visible only in Evaluation Mode.
- `RunInformationDrawer`: run metadata and provenance.
- `AttributionConceptWorkspace`: isolated synthetic future-scope concept.

## Score Definitions

`final_fusion_score` is an uncalibrated ranking value:

```text
cnn_score * unet_p95_probability * log1p(candidate_pixel_count)
```

Display labels:

- Fusion Ranking Score: raw value, three decimals, never a percent.
- CNN Screening Score: raw CNN output, three decimals.
- U-Net p95 Heatmap Value: p95 heatmap value, three decimals.
- Candidate Fraction: fraction of pixels above U-Net threshold, displayed as a percentage.

## Normal Review vs Evaluation Mode

Normal Review Mode is the default. It hides ground-truth label and mask-pixel fields, masks the preview header, avoids positive/negative filename text, and does not style candidates by label.

Evaluation Mode is visibly distinct and reveals held-out ground truth, mask pixels, top-12 positive counts, and reported CNN/U-Net metrics. It is not part of the operational review workflow.

## Review Persistence

Manual review supports:

- Needs Review
- Likely Slick
- False Positive
- Unclear

Reviewer notes, optional reviewer name and updated timestamp persist in localStorage. Reviews can be exported/imported as JSON with candidate-ID validation. Candidate IDs use `split + ":" + tile_name`.

## Known Limitations

- Dataset is small: 266 cleaned SAR tiles, 64 positive and 202 negative.
- Held-out split is grouped: 43 Validation and 38 Test.
- Current top-12 results are 5 positives in Validation and 3 positives in Test.
- CNN Test F1 is 0.324, Precision 0.222, Recall 0.600, AUC-ROC 0.557.
- U-Net Test Dice is 0.0137, Precision 0.0077, Recall 0.0626 at threshold 0.20.
- Candidate previews are image-space composites, not georeferenced polygons.
- The repository does not include real AIS positions, real AIS tracks, operational drift fields or production source-attribution outputs.
- The backtracking prototype CSVs are synthetic/demo source-attribution data and do not match the SAR fusion candidate coordinates or case linkage.

## Future Backend Integration

A future API can replace the static loader without rewriting presentation components:

- `GET /api/candidates`
- `GET /api/candidates/{id}`
- `GET /api/summary`
- `POST /api/review`

Live vessel attribution requires external AIS, environmental drift inputs, source-estimation outputs and an attribution-score specification.
