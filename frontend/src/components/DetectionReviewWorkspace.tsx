import { useEffect, useMemo, useRef, useState } from "react";
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
import InvestigationFlow from "./InvestigationFlow";
import MapControlShelf from "./MapControlShelf";
import BacktrackingWindow from "./BacktrackingWindow";
import { generateCandidateReviewPdf } from "../services/reportService";
import { validateImportedReviews } from "../services/reviewRepository";
import { DEFAULT_FILTERS } from "../constants/candidateFilters";
import type { Candidate, CandidateFilters, CandidateReview, DataLoadState } from "../types/candidates";
import { useFusionRun } from "../hooks/useFusionRun";
import {
  DEFAULT_REVIEW_MAP_SELECTION,
  loadReviewMapLayers,
  type ReviewMapLayer,
  type ReviewMapSelection,
} from "../services/mapLayerService";

type DetectionReviewWorkspaceProps = {
  mode: "detection" | "attribution";
  onModeChange: (mode: "detection" | "attribution") => void;
};

const CANDIDATE_QUEUE_MIN_HEIGHT = 260;
const FILTER_SECTION_MIN_HEIGHT = 220;
const SIDEBAR_DIVIDER_HEIGHT = 18;
const KEYBOARD_RESIZE_STEP = 28;

export default function DetectionReviewWorkspace({
  mode,
  onModeChange,
}: DetectionReviewWorkspaceProps) {
  const { dataState, reload, saveReview, replaceReviews, resetReviews } = useFusionRun();
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_FILTERS);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [evaluationMode, setEvaluationMode] = useState(false);
  const [runInfoOpen, setRunInfoOpen] = useState(false);
  const [backtrackingOpen, setBacktrackingOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [mapSelection, setMapSelection] = useState<ReviewMapSelection>(DEFAULT_REVIEW_MAP_SELECTION);
  const [reviewLayers, setReviewLayers] = useState<ReviewMapLayer[]>([]);
  const [layerError, setLayerError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadReviewMapLayers()
      .then((layers) => {
        if (!cancelled) setReviewLayers(layers);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLayerError(error instanceof Error ? error.message : "Could not load review map layers.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      backtrackingOpen={backtrackingOpen}
      setBacktrackingOpen={setBacktrackingOpen}
      importRef={importRef}
      importError={importError}
      setImportError={setImportError}
      mapSelection={mapSelection}
      setMapSelection={setMapSelection}
      reviewLayers={reviewLayers}
      layerError={layerError}
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
  backtrackingOpen: boolean;
  setBacktrackingOpen: (value: boolean) => void;
  importRef: React.RefObject<HTMLInputElement | null>;
  importError: string | null;
  setImportError: (message: string | null) => void;
  mapSelection: ReviewMapSelection;
  setMapSelection: (selection: ReviewMapSelection) => void;
  reviewLayers: ReviewMapLayer[];
  layerError: string | null;
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
  backtrackingOpen,
  setBacktrackingOpen,
  importRef,
  importError,
  setImportError,
  mapSelection,
  setMapSelection,
  reviewLayers,
  layerError,
  mode,
  onModeChange,
}: ReadyWorkspaceProps) {
  const run = dataState.run;
  const queueColumnRef = useRef<HTMLDivElement | null>(null);
  const [candidateRegionHeight, setCandidateRegionHeight] = useState(() => {
    const savedHeight = sessionStorage.getItem("candidate-region-panel-height");
    const parsedHeight = savedHeight ? Number(savedHeight) : Number.NaN;
    return Number.isFinite(parsedHeight) ? parsedHeight : 390;
  });
  const workspaceFilters = useMemo(
    () => ({
      ...filters,
      acquisitionDate: mapSelection.activeDate.startsWith("2019-")
        ? mapSelection.activeDate
        : filters.acquisitionDate,
    }),
    [filters, mapSelection.activeDate]
  );
  const filteredCandidates = useMemo(
    () => applyCandidateFilters(run.candidates, workspaceFilters, mapSelection),
    [run.candidates, workspaceFilters, mapSelection]
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

  const handleExportCandidateReport = () => {
    if (!selectedCandidate) return;
    generateCandidateReviewPdf(selectedCandidate, run.summary);
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

  const clampCandidateRegionHeight = (height: number) => {
    const columnHeight = queueColumnRef.current?.getBoundingClientRect().height ?? 720;
    const maxQueueHeight = Math.max(
      CANDIDATE_QUEUE_MIN_HEIGHT,
      columnHeight - FILTER_SECTION_MIN_HEIGHT - SIDEBAR_DIVIDER_HEIGHT
    );
    return Math.min(Math.max(height, CANDIDATE_QUEUE_MIN_HEIGHT), maxQueueHeight);
  };

  const updateCandidateRegionHeight = (height: number) => {
    const nextHeight = clampCandidateRegionHeight(height);
    setCandidateRegionHeight(nextHeight);
    sessionStorage.setItem("candidate-region-panel-height", String(Math.round(nextHeight)));
  };

  const handleResizeStart = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = candidateRegionHeight;
    document.body.classList.add("is-resizing-sidebar");

    const handlePointerMove = (moveEvent: PointerEvent) => {
      updateCandidateRegionHeight(startHeight + startY - moveEvent.clientY);
    };

    const handlePointerEnd = () => {
      document.body.classList.remove("is-resizing-sidebar");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);
  };

  const handleResizeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const direction = event.key === "ArrowUp" ? 1 : -1;
    updateCandidateRegionHeight(candidateRegionHeight + direction * KEYBOARD_RESIZE_STEP);
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
            <button
              className="icon-button"
              type="button"
              onClick={handleExportCandidateReport}
              disabled={!selectedCandidate}
              aria-label="Download candidate review report"
              title="Download candidate review report"
            >
              <Download size={16} />
            </button>
            <button className="console-button subtle compact-action" type="button" onClick={handleExportReviews}>
              Export Reviews
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
        <div className="control-shelf-row">
          <SpillDetectionSummary />
          <MapControlShelf
            candidates={run.candidates}
            layers={reviewLayers}
            selection={mapSelection}
            layerError={layerError}
            onChange={setMapSelection}
          />
          <InvestigationFlow />
        </div>

        <section className="review-grid">
          <div className="queue-column" ref={queueColumnRef}>
            <div className="filter-region-shell">
              <CandidateFiltersPanel candidates={run.candidates} filters={filters} onChange={setFilters} />
            </div>
            <div
              className="sidebar-resize-divider"
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize candidate queue"
              aria-valuemin={CANDIDATE_QUEUE_MIN_HEIGHT}
              aria-valuenow={Math.round(candidateRegionHeight)}
              tabIndex={0}
              onPointerDown={handleResizeStart}
              onKeyDown={handleResizeKeyDown}
            >
              <span />
            </div>
            <div className="candidate-region-shell" style={{ flexBasis: `${candidateRegionHeight}px` }}>
              <CandidateQueue
                candidates={filteredCandidates}
                selectedCandidateId={selectedCandidate?.candidateId ?? null}
                evaluationMode={evaluationMode}
                onSelect={setSelectedCandidateId}
              />
            </div>
          </div>

          <CandidateMap
            candidates={filteredCandidates}
            selectedCandidateId={selectedCandidate?.candidateId ?? null}
            onSelect={setSelectedCandidateId}
            selection={mapSelection}
            reviewLayers={reviewLayers}
          />

          <CandidateInspector
            candidate={selectedCandidate}
            summary={run.summary}
            evaluationMode={evaluationMode}
            onReviewChange={saveReview}
            onOpenBacktracking={() => setBacktrackingOpen(true)}
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
      <BacktrackingWindow
        candidate={selectedCandidate}
        open={backtrackingOpen}
        onClose={() => setBacktrackingOpen(false)}
      />
    </div>
  );
}

function applyCandidateFilters(
  candidates: Candidate[],
  filters: CandidateFilters,
  mapSelection: ReviewMapSelection
): Candidate[] {
  const search = filters.search.trim().toLowerCase();

  return candidates
    .filter(() => mapSelection.activeLocation !== "qeshm-hengam-2026")
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
