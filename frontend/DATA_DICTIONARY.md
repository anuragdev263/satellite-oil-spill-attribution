# Data Dictionary

| Field | Source | Type | Unit | Display format | Classification |
|---|---|---:|---|---|---|
| `candidateId` | Derived from split and tile name | string | none | hidden/internal | Operational |
| `rank_within_split` | CSV | integer | rank | `#01` | Operational |
| `split` | CSV | enum | none | `test` or `validation` | Operational |
| `scene` | CSV | string | none | scene ID | Operational |
| `acquisition_date` | CSV | date string | date | `YYYY-MM-DD` | Operational |
| `tile_name` | CSV | string | filename | shortened grid ID in Normal Mode | Operational |
| `tile` | CSV | string | path | not displayed | Provenance only |
| `label` | CSV | enum | none | `positive` or `negative` | Evaluation only |
| `mask_pixels` | CSV | integer | pixels | integer | Evaluation only |
| `latitude` | CSV | float | decimal degrees | five decimals | Operational geospatial |
| `longitude` | CSV | float | decimal degrees | five decimals | Operational geospatial |
| `left` | CSV | float | EPSG:32642 metres | three decimals if shown | Provenance |
| `bottom` | CSV | float | EPSG:32642 metres | three decimals if shown | Provenance |
| `right` | CSV | float | EPSG:32642 metres | three decimals if shown | Provenance |
| `top` | CSV | float | EPSG:32642 metres | three decimals if shown | Provenance |
| `center_x` | CSV | float | EPSG:32642 metres | three decimals if shown | Provenance |
| `center_y` | CSV | float | EPSG:32642 metres | three decimals if shown | Provenance |
| `cnn_score` | CSV | float | unitless model output | three decimals | Operational model output |
| `unet_mean_probability` | CSV | float | heatmap value | three decimals | Operational model output |
| `unet_max_probability` | CSV | float | heatmap value | three decimals | Operational model output |
| `unet_p95_probability` | CSV | float | heatmap value | three decimals | Operational model output |
| `candidate_pixel_count` | CSV | integer | pixels | integer | Operational model output |
| `candidate_fraction` | CSV | float | fraction of tile | percentage, one decimal | Operational model output |
| `final_fusion_score` | CSV | float | uncalibrated score | three decimals | Operational ranking |
| `compositePreviewUrl` | Asset manifest | string | URL | image | Operational visual support |
| `review.status` | localStorage/import JSON | enum | none | status label | Human decision |
| `review.notes` | localStorage/import JSON | string | none | free text | Human decision |
| `review.reviewerName` | localStorage/import JSON | string | none | free text | Human decision |
| `review.updatedAt` | localStorage/import JSON | ISO timestamp | time | timestamp | Human decision |

`final_fusion_score` must never be displayed as probability, confidence or accuracy. It is a review-priority ranking value only.
