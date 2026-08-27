import { useEffect, useMemo, useState } from "react";
import { loadPipelineRun } from "../services/fusionDataService";
import { LocalStorageReviewRepository } from "../services/reviewRepository";
import type { CandidateReview, DataLoadState } from "../types/candidates";

export function useFusionRun(): {
  dataState: DataLoadState;
  reload: () => void;
  saveReview: (review: CandidateReview) => void;
  replaceReviews: (reviews: CandidateReview[]) => void;
  resetReviews: () => void;
} {
  const repository = useMemo(() => new LocalStorageReviewRepository(), []);
  const [dataState, setDataState] = useState<DataLoadState>({ status: "loading" });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    loadPipelineRun(repository.load())
      .then((run) => {
        if (cancelled) return;
        setDataState(
          run.candidates.length === 0
            ? { status: "empty", message: "No ranked candidates were supplied." }
            : { status: "ready", run }
        );
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setDataState({
          status: "error",
          message: error instanceof Error ? error.message : "Could not load fusion output.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [repository, revision]);

  return {
    dataState,
    reload: () => {
      setDataState({ status: "loading" });
      setRevision((value) => value + 1);
    },
    saveReview: (review) => {
      repository.save(review);
      setRevision((value) => value + 1);
    },
    replaceReviews: (reviews) => {
      repository.replaceAll(reviews);
      setRevision((value) => value + 1);
    },
    resetReviews: () => {
      repository.reset();
      setRevision((value) => value + 1);
    },
  };
}
