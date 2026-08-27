import { useEffect, useState } from "react";
import { loadBacktrackingPrototypeData } from "../services/backtrackingService";
import type { BacktrackingPrototypeData } from "../types/backtracking";

type BacktrackingLoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: BacktrackingPrototypeData };

export function useBacktrackingData(): BacktrackingLoadState {
  const [state, setState] = useState<BacktrackingLoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    loadBacktrackingPrototypeData()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", data });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: error instanceof Error ? error.message : "Could not load backtracking prototype data.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
