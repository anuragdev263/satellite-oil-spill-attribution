import { useMemo, useRef, useState } from "react";
import { Upload, Download, RotateCcw, Info } from "lucide-react";
import CandidateFiltersPanel from "./CandidateFiltersPanel";
import CandidateInspector from "./CandidateInspector";
import CandidateMap from "./CandidateMap";
import CandidateQueue from "./CandidateQueue";
import DataStatePanel from "./DataStatePanel";
import DetectionTopBar from "./DetectionTopBar";
import EvaluationPanel from "./EvaluationPanel";
import ModeBadge from "./ModeBadge";
import RunInformationDrawer from "./RunInformationDrawer";
import SpillDetectionSummary from "./SpillDetectionSummary";
import { validateImportedReviews } from "../services/reviewRepository";
import { DEFAULT_FILTERS } from "../constants/candidateFilters";
import type { Candidate, CandidateFilters, CandidateReview, DataLoadState } from "../types/candidates";
import { useFusionRun } from "../hooks/useFusionRun";

type DetectionReviewWorkspaceProps = {
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

export default function DetectionReviewWorkspace({
  mode,
  onModeChange,
}: DetectionReviewWorkspaceProps) {
  const { dataState, reload, saveReview, replaceReviews, resetReviews } = useFusionRun();
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_FILTERS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [runInfoOpen, setRunInfoOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  if (dataState.status === "loading") {
    return (
      <div className="app">
        <DetectionTopBar summary={null} filters={filters} mode={mode} onModeChange={onModeChange} />
        <DataStatePanel title="Loading fusion output" message="Reading CSV, summary JSON and preview manifest." />
      </div>
    );
  }

  if (dataState.status === "error") {
    return (
      <div className="app">
        <DetectionTopBar summary={null} filters={filters} mode={mode} onModeChange={onModeChange} />
        <DataStatePanel title="Fusion output unavailable" message={dataState.message} actionLabel="Retry" onAction={reload} />
      </div>
    );
  }

  if (dataState.status === "empty") {
    return (
      <div className="app">
        <DetectionTopBar summary={null} filters={filters} mode={mode} onModeChange={onModeChange} />
        <DataStatePanel title="No candidates" message={dataState.message} actionLabel="Retry" onAction={reload} />
      </div>
    );
  }

  return (
    <ReadyWorkspace
      dataState={dataState}
      filters={filters}
      setFilters={setFilters}
      selectedCandidateId={selectedCandidateId}
      setSelectedCandidateId={setSelectedCandidateId}
      evaluationMode={evaluationMode}
      setEvaluationMode={setEvaluationMode}
      saveReview={saveReview}
      replaceReviews={replaceReviews}
      resetReviews={resetReviews}
      runInfoOpen={runInfoOpen}
      setRunInfoOpen={setRunInfoOpen}
      importRef={importRef}
      importError={importError}
      setImportError={setImportError}
      mode={mode}
      onModeChange={onModeChange}
    />
  );
}

type ReadyWorkspaceProps = {
  dataState: Extract<DataLoadState, { status: "ready" }>;
  filters: CandidateFilters;
  setFilters: (filters: CandidateFilters) => void;
  selectedCandidateId: string | null;
  setSelectedCandidateId: (candidateId: string | null) => void;
  evaluationMode: boolean;
  setEvaluationMode: (value: boolean) => void;
  saveReview: (review: CandidateReview) => void;
  replaceReviews: (reviews: CandidateReview[]) => void;
  resetReviews: () => void;
  runInfoOpen: boolean;
  setRunInfoOpen: (value: boolean) => void;
  importRef: React.RefObject<HTMLInputElement | null>;
  importError: string | null;
  setImportError: (message: string | null) => void;
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

function ReadyWorkspace({
  dataState,
  filters,
  setFilters,
  selectedCandidateId,
  setSelectedCandidateId,
  evaluationMode,
  setEvaluationMode,
  saveReview,
  replaceReviews,
  resetReviews,
  runInfoOpen,
  setRunInfoOpen,
  importRef,
  importError,
  setImportError,
  mode,
  onModeChange,
}: ReadyWorkspaceProps) {
  const run = dataState.run;
  const filteredCandidates = useMemo(
    () => applyCandidateFilters(run.candidates, filters),
    [run.candidates, filters]
  );

  const selectedCandidate =
    filteredCandidates.find((candidate) => candidate.candidateId === selectedCandidateId) ??
    filteredCandidates[0] ??
    null;

  if (selectedCandidate && selectedCandidate.candidateId !== selectedCandidateId) {
    setTimeout(() => setSelectedCandidateId(selectedCandidate.candidateId), 0);
  }

  const selectedIndex = selectedCandidate
    ? filteredCandidates.findIndex((candidate) => candidate.candidateId === selectedCandidate.candidateId)
    : -1;
  const reviewedCount = run.candidates.filter((candidate) => candidate.review.status !== "Needs Review").length;
  const progress = run.candidates.length > 0 ? Math.round((reviewedCount / run.candidates.length) * 100) : 0;

  const handleExportReviews = () => {
    const reviews = run.candidates
      .map((candidate) => candidate.review)
      .filter((review) => review.status !== "Needs Review" || review.notes || review.reviewerName);
    const blob = new Blob([JSON.stringify(reviews, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "oilspill_candidate_reviews.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportReviews = async (file: File | undefined) => {
    setImportError(null);
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const allowedIds = new Set(run.candidates.map((candidate) => candidate.candidateId));
      replaceReviews(validateImportedReviews(parsed, allowedIds));
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Review import failed.");
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  return (
    <div className="app">
      <DetectionTopBar summary={run.summary} filters={filters} mode={mode} onModeChange={onModeChange} />

      <main className={`review-workspace ${evaluationMode ? "evaluation-active" : ""}`}>
        <section className="review-command-row">
          <div>
            <ModeBadge tone="model">Fusion Ranking Score is not probability</ModeBadge>
            <ModeBadge tone="human">Human Review Required</ModeBadge>
            <ModeBadge tone="observed">{run.candidates.length} candidates loaded</ModeBadge>
          </div>
          <div className="review-progress" aria-label="Review progress">
            <span>{reviewedCount}/{run.candidates.length} reviewed</span>
            <div>
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="command-buttons">
            <button className="icon-button" type="button" onClick={() => setRunInfoOpen(true)} aria-label="Open run information">
              <Info size={16} />
            </button>
            <button className="icon-button" type="button" onClick={handleExportReviews} aria-label="Export reviews">
              <Download size={16} />
            </button>
            <button className="icon-button" type="button" onClick={() => importRef.current?.click()} aria-label="Import reviews">
              <Upload size={16} />
            </button>
            <button className="icon-button" type="button" onClick={resetReviews} aria-label="Reset reviews">
              <RotateCcw size={16} />
            </button>
            <input
              ref={importRef}
              className="hidden-input"
              type="file"
              accept="application/json"
              onChange={(event) => void handleImportReviews(event.target.files?.[0])}
            />
            <label className="evaluation-toggle">
              <input
                type="checkbox"
                checked={evaluationMode}
                onChange={(event) => setEvaluationMode(event.target.checked)}
              />
              Evaluation Mode
            </label>
          </div>
        </section>

        {importError ? <div className="inline-error">{importError}</div> : null}
        {evaluationMode ? <EvaluationPanel candidates={run.candidates} /> : null}
        <SpillDetectionSummary />

        <section className="review-grid">
          <div className="queue-column">
            <CandidateFiltersPanel candidates={run.candidates} filters={filters} onChange={setFilters} />
            <CandidateQueue
              candidates={filteredCandidates}
              selectedCandidateId={selectedCandidate?.candidateId ?? null}
              evaluationMode={evaluationMode}
              onSelect={setSelectedCandidateId}
            />
          </div>

          <CandidateMap
            candidates={filteredCandidates}
            selectedCandidateId={selectedCandidate?.candidateId ?? null}
            onSelect={setSelectedCandidateId}
          />

          <CandidateInspector
            candidate={selectedCandidate}
            summary={run.summary}
            evaluationMode={evaluationMode}
            onReviewChange={saveReview}
            onPrevious={() => {
              if (selectedIndex > 0) setSelectedCandidateId(filteredCandidates[selectedIndex - 1].candidateId);
            }}
            onNext={() => {
              if (selectedIndex < filteredCandidates.length - 1) {
                setSelectedCandidateId(filteredCandidates[selectedIndex + 1].candidateId);
              }
            }}
            hasPrevious={selectedIndex > 0}
            hasNext={selectedIndex >= 0 && selectedIndex < filteredCandidates.length - 1}
          />
        </section>
      </main>

      <RunInformationDrawer run={run} open={runInfoOpen} onClose={() => setRunInfoOpen(false)} />
    </div>
  );
}

function applyCandidateFilters(candidates: Candidate[], filters: CandidateFilters): Candidate[] {
  const search = filters.search.trim().toLowerCase();

  return candidates
    .filter((candidate) => filters.split === "all" || candidate.split === filters.split)
    .filter((candidate) => filters.reviewStatus === "all" || candidate.review.status === filters.reviewStatus)
    .filter((candidate) => {
      if (filters.reviewed === "all") return true;
      const reviewed = candidate.review.status !== "Needs Review";
      return filters.reviewed === "reviewed" ? reviewed : !reviewed;
    })
    .filter((candidate) => filters.acquisitionDate === "all" || candidate.acquisitionDate === filters.acquisitionDate)
    .filter((candidate) => filters.scene === "all" || candidate.scene === filters.scene)
    .filter((candidate) => {
      if (!search) return true;
      return (
        candidate.scene.toLowerCase().includes(search) ||
        candidate.tileName.toLowerCase().replace(/_(positive|negative)(?=\.npz$)/, "").includes(search)
      );
    })
    .sort((a, b) => {
      if (filters.sortBy === "rank") {
        if (a.split !== b.split) return a.split.localeCompare(b.split);
        return a.rank - b.rank;
      }
      return b.finalFusionScore - a.finalFusionScore;
    });
}
