import { useSpillDetections } from "../hooks/useSpillDetections";
import { formatDecimal, formatInteger } from "../utils/format";
import ProvenanceTag from "./ProvenanceTag";

/**
 * Surfaces /data/spill_polygons.geojson - real ML/GIS detected-slick polygon
 * output (see src/types/spill.ts for the exact data-contract caveats) via
 * the existing spillService.ts. Previously this service and its types were
 * fully implemented but never called from any component or hook, so this
 * data never reached the UI.
 *
 * This is DERIVED data: each polygon's area_km2 comes from the project's own
 * SAR detection pipeline (see scripts/extract_top_detections.mjs referenced
 * in types/spill.ts), not an externally reported fact like the Qeshm/Hengam
 * incident. It is a different dataset from the CNN+U-Net candidate-review
 * queue shown elsewhere in this workspace, so it is presented as its own
 * section rather than merged into the candidate list.
 */
export default function SpillDetectionSummary() {
  const state = useSpillDetections();

  return (
    <section className="panel-section spill-detection-summary" aria-label="Detected slick polygons">
      <div className="panel-header compact">
        <div>
          <span className="panel-kicker">GIS DETECTION OUTPUT</span>
          <h2>Detected Slick Polygons</h2>
        </div>
        <ProvenanceTag level="derived" />
      </div>

      {state.status === "loading" ? <p>Loading detected-slick polygon file.</p> : null}
      {state.status === "empty" ? <p>No detected-slick polygons were supplied.</p> : null}
      {state.status === "error" ? <p className="inline-error">{state.message}</p> : null}

      {state.status === "loaded" ? (
        <>
          <dl className="detail-grid">
            <div>
              <dt>Detected polygons</dt>
              <dd>{formatInteger(state.stats.count)}</dd>
            </div>
            <div>
              <dt>Total detected area</dt>
              <dd>{formatDecimal(state.stats.totalDetectedAreaKm2, 2)} km&sup2;</dd>
            </div>
            <div>
              <dt>Largest single polygon</dt>
              <dd>
                {state.stats.largest
                  ? `${formatDecimal(state.stats.largest.properties.area_km2, 2)} km\u00B2`
                  : "UNKNOWN"}
              </dd>
            </div>
          </dl>
          <p>
            Each polygon&rsquo;s area is individually detected and polygons do not overlap, so the total is a true
            sum - but it is a sum of separately detected regions, not a scientifically deduplicated &ldquo;unique
            spill&rdquo; estimate. No attribution or confidence fields are attached to these polygons; only id and
            area are backed by the current data contract.
          </p>
        </>
      ) : null}
    </section>
  );
}
