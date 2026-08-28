import { useEffect, useState } from "react";
import { computeSpillStats, loadSpillDetections } from "../services/spillService";
import type { SpillLoadState } from "../types/spill";

/**
 * Loads the detected-slick polygon GeoJSON (real GIS/ML detection output -
 * see src/types/spill.ts for the data-contract caveats) and derives summary
 * stats from it.
 *
 * This wraps the existing spillService.ts (PART 1 code, unchanged) the same
 * way useBacktrackingData/useFusionRun wrap their services, so it follows
 * the established loading/error/empty/ready state pattern instead of
 * introducing a new one.
 */
export function useSpillDetections(): SpillLoadState {
  const [state, setState] = useState<SpillLoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    loadSpillDetections()
      .then((data) => {
        if (cancelled) return;
        if (data.features.length === 0) {
          setState({ status: "empty" });
          return;
        }
        setState({ status: "loaded", data, stats: computeSpillStats(data) });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Could not load detected-slick polygons.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
