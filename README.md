# 🛢️ OilSpill Intelligence

### Satellite + AIS-Based Oil Spill Detection, Backtracking, Source Attribution & Drift Intelligence

**OilSpill Intelligence** is a geospatial maritime investigation platform designed to support the detection, reconstruction, and source-attribution analysis of marine oil pollution events.

The platform brings together satellite/SAR detection, vessel-track analysis, temporal backtracking, environmental transport modelling, evidence fusion, and investigator review into a single interactive workflow.

The current prototype uses the **Qeshm / Hengam oil pollution event reported in August 2026 as its real-world incident context**, while clearly separating externally reported facts from prototype/synthetic analysis data.

> ⚠️ **Important:** The current backtracking, vessel-track, environmental, and attribution analysis is a prototype demonstration. It does **not** independently confirm the real-world source of the Qeshm/Hengam pollution event.

---

## 🚨 Qeshm / Hengam Incident Context

The application includes the reported **Qeshm / Hengam oil pollution event** as its primary incident context.

| Incident Information | Status |
|---|---|
| **Case** | Qeshm / Hengam |
| **Observation** | 10 August 2026 |
| **Reported extent** | ~100 km² |
| **Source status** | Under Investigation |
| **External attribution** | Minoan Pioneer — reported likely source |
| **System confirmation** | Not established |

The application deliberately distinguishes the real-world incident context from the prototype analytical scenario.

### Data provenance

Every displayed value is classified as one of:

- **EXTERNAL / REPORTED** — information supported by external reporting.
- **DERIVED** — calculated by the application from available source data.
- **PROTOTYPE / SYNTHETIC** — simulated or demonstration data.
- **UNKNOWN** — information that cannot be established from the available data.

This distinction is maintained throughout the interface and generated reports.

---

# 🎯 Objectives

OilSpill Intelligence is designed to provide an explainable investigation pipeline for marine oil-spill attribution.

The system aims to:

- Detect and visualize potential oil-spill regions.
- Identify candidate spill/source locations.
- Reconstruct historical vessel movement.
- Perform temporal backtracking.
- Analyse vessel-to-source spatial relationships.
- Evaluate temporal consistency between vessels and spill events.
- Incorporate wind/current transport information.
- Generate forward drift projections where sufficient data exists.
- Rank candidate vessels using multiple evidence dimensions.
- Explain why a candidate ranks highly or poorly.
- Preserve data provenance throughout the investigation.
- Support investigator review and auditability.
- Provide professional incident and analysis reports.

---

# 🧩 Investigation Workflow

The current application represents the investigation pipeline as:

```text
┌───────────────────────────┐
│   SATELLITE / SAR DATA    │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│     SPILL DETECTION       │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│      SPILL LOCATION       │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│ PROBABILITY / BACKTRACKING │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│   HISTORICAL VESSEL AIS   │
│         TRACKS             │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│     CANDIDATE VESSELS     │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│     SPATIAL EVIDENCE      │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│     TEMPORAL EVIDENCE     │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│ ENVIRONMENTAL / DRIFT DATA│
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│      EVIDENCE FUSION      │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│     SOURCE ATTRIBUTION    │
└─────────────┬─────────────┘
              ↓
┌───────────────────────────┐
│   INVESTIGATOR REVIEW     │
└───────────────────────────┘
