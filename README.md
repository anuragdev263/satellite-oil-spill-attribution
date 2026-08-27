# 🛢️ OilSpill Intelligence

### Satellite + AIS Based Oil Spill Detection, Source Attribution & Drift Intelligence

OilSpill Intelligence is a geospatial maritime intelligence platform designed to help investigators detect oil spills, identify probable source vessels, reconstruct historical vessel movement, estimate spill origin, and simulate possible spill scenarios.

The platform combines:

- 🛰️ Satellite/SAR-derived oil spill detection
- 🚢 AIS vessel tracking
- 🗺️ GIS-based spatial analysis
- ⏱️ Temporal backtracking
- 🌊 Forward drift modelling
- 🧠 Evidence-based vessel attribution
- 🤖 ML-assisted source attribution
- 🎯 What-If scenario simulation

The goal is to transform fragmented satellite and maritime data into an explainable investigation workflow.

---

## 🚨 Problem

Oil spills at sea are difficult to attribute to their actual source.

Investigators may have access to:

- Satellite imagery
- AIS vessel positions
- Historical vessel tracks
- Wind/current information
- Vessel characteristics
- Spill geometry

However, these datasets are often analyzed separately.

This creates several challenges:

1. Detecting an oil slick from satellite imagery.
2. Determining where the spill most likely originated.
3. Identifying vessels that were present near the probable source.
4. Reconstructing vessel movement before the spill was detected.
5. Accounting for ocean drift and environmental conditions.
6. Ranking candidate vessels using multiple evidence sources.
7. Explaining why one vessel is more likely than another.

OilSpill Intelligence addresses these challenges through a unified geospatial investigation interface.

---

# 🎯 Objectives

The system is designed to:

- Detect and visualize oil spill regions.
- Estimate probable spill source locations.
- Visualize nearby AIS vessels.
- Rank candidate vessels by attribution confidence.
- Reconstruct historical vessel movement.
- Analyze temporal consistency between vessels and spills.
- Model potential oil drift.
- Provide an interactive What-If simulator.
- Combine multiple evidence sources into an explainable confidence chain.
- Eventually use machine learning to improve attribution accuracy.

---

# 🧩 System Overview

```text
                  DATA SOURCES
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   Satellite/SAR      AIS        Wind/Ocean Data
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                GIS PROCESSING
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   Spill Detection            Vessel Tracks
          │                         │
          └────────────┬────────────┘
                       ▼
               SOURCE ESTIMATION
                       │
                       ▼
              TEMPORAL BACKTRACK
                       │
                       ▼
              DRIFT RECONSTRUCTION
                       │
                       ▼
              EVIDENCE ENGINE
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
       Satellite      AIS       Behaviour
       Signature    Proximity    Analysis
          │            │            │
          └────────────┼────────────┘
                       ▼
                ATTRIBUTION MODEL
                       │
                       ▼
               RANKED VESSELS
                       │
                       ▼
             INVESTIGATION UI
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Timeline     What-If      Evidence
       Analysis    Simulator      Chain
