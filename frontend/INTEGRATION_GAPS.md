# Integration Gaps

The current repository supports a candidate slick review queue. It does not support real source attribution.

Missing inputs and outputs:

| Gap | Needed for | Current state |
|---|---|---|
| Candidate-footprint GeoJSON | Drawing true candidate regions on the map | Not supplied |
| Georeferenced masks | Projecting U-Net masks into map space | Not supplied |
| AIS positions | Vessel proximity and candidate matching | Not supplied |
| AIS tracks | Vessel track replay and source attribution | Not supplied |
| Vessel metadata | Vessel identity, type and ownership context | Not supplied |
| Environmental inputs | Backtrack and drift modelling | Not supplied |
| Source-estimation output | Probable source region | Not supplied |
| Backtrack trajectories | Retrospective drift reconstruction | Not supplied |
| Forward-drift forecasts | Spill movement forecasting | Not supplied |
| Attribution-score specification | Ranked vessel attribution | Not supplied |
| End-to-end case linkage | Connecting SAR candidates to vessel/drift cases | Not supplied |

The existing Source Attribution workspace uses synthetic demo data only. It must not be interpreted as output from the supplied SAR fusion run.

## Backtracking Prototype Supporting Outputs

The uploaded backtracking GIS archive also includes QGIS project, GeoPackage and GeoTIFF outputs such as:

- `oil_spill_gis.qgz`
- `final_high_risk_zone.gpkg`
- `high_probability_zone.gpkg`
- `oil_spill_results.gpkg`
- `probability_heatmap_utm43.gpkg`
- `final_kde.tif`
- `final_probability.tif`
- `high_probability_zone.tif`
- `kde_test*.tif`

These are documented as QGIS-only supporting outputs for now. The current frontend uses the CSV files only. GeoPackage or GeoTIFF layers should be converted to web-friendly GeoJSON, vector tiles, raster tiles, or Cloud Optimized GeoTIFF workflows only after the frontend has explicit support and styling rules for those formats.
