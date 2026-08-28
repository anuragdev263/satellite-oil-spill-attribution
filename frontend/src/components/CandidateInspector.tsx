import { useState } from "react";
import { Route } from "lucide-react";
import type { Candidate, FusionSummary } from "../types/candidates";
import {
  formatCoordinate,
  formatDecimal,
  formatInteger,
  formatPercentFraction,
  shortenTileName,
} from "../utils/format";
import CandidatePreview from "./CandidatePreview";
import ModeBadge from "./ModeBadge";
import ReviewControls from "./ReviewControls";

type CandidateInspectorProps = {
  candidate: Candidate | null;
  summary: FusionSummary | null;
  evaluationMode: boolean;
  onReviewChange: (review: Candidate["review"]) => void;
  onOpenBacktracking: () => void;
  onPrevious: () => void;
  onNext: () => void;
  hasPrevious: boolean;
  hasNext: boolean;
};

export default function CandidateInspector({
  candidate,
  summary,
  evaluationMode,
  onReviewChange,
  onOpenBacktracking,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: CandidateInspectorProps) {
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  if (!candidate) {
    return (
      <aside className="inspector-panel">
        <div className="missing-preview">
          <span className="panel-kicker">CANDIDATE DETAIL</span>
          <p>Select a candidate from the queue or map.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      <div className="panel-header compact">
        <div>
          <span className="panel-kicker">CANDIDATE DETAIL</span>
          <h2>{candidate.scene}</h2>
        </div>
        <ModeBadge tone="model">Rank #{candidate.rank}</ModeBadge>
      </div>

      <CandidatePreview
        candidate={candidate}
        evaluationMode={evaluationMode}
        fullscreen={fullscreenPreview}
        onToggleFullscreen={() => setFullscreenPreview((value) => !value)}
      />

      <div className="detail-actions">
        <button className="console-button subtle" type="button" onClick={onPrevious} disabled={!hasPrevious}>
          Previous
        </button>
        <button className="console-button subtle" type="button" onClick={onNext} disabled={!hasNext}>
          Next
        </button>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Acquisition Date</dt>
          <dd>{candidate.acquisitionDate}</dd>
        </div>
        <div>
          <dt>Coordinates</dt>
          <dd>
            {formatCoordinate(candidate.latitude)}, {formatCoordinate(candidate.longitude)}
          </dd>
        </div>
        <div>
          <dt>Review Status</dt>
          <dd>{candidate.review.status}</dd>
        </div>
        <div>
          <dt>Split / Rank</dt>
          <dd>
            {candidate.split} #{candidate.rank}
          </dd>
        </div>
        <div>
          <dt>CNN Score <span className="provenance-micro">Model</span></dt>
          <dd>{formatDecimal(candidate.cnnScore)}</dd>
        </div>
        <div>
          <dt>U-Net p95 <span className="provenance-micro">Model</span></dt>
          <dd>{formatDecimal(candidate.unetP95Probability)}</dd>
        </div>
        <div>
          <dt>Candidate Fraction</dt>
          <dd>{formatPercentFraction(candidate.candidateFraction)}</dd>
        </div>
        <div>
          <dt>Fusion Ranking <span className="provenance-micro">Derived</span></dt>
          <dd>{formatDecimal(candidate.finalFusionScore)}</dd>
        </div>
      </dl>

      <section className="backtracking-inline-state">
        <div>
          <span className="panel-kicker">BACKTRACKING</span>
          <strong>Backtracking unavailable for this candidate</strong>
        </div>
        <ModeBadge tone="warning">Unverified</ModeBadge>
        <button className="console-button subtle compact-action" type="button" onClick={onOpenBacktracking}>
          <Route size={13} />
          Backtracking
        </button>
      </section>

      {evaluationMode ? (
        <section className="ground-truth-box">
          <span className="panel-kicker">GROUND TRUTH - EVALUATION ONLY</span>
          <dl className="detail-grid">
            <div>
              <dt>Label</dt>
              <dd>{candidate.groundTruthLabel ?? "Not supplied"}</dd>
            </div>
            <div>
              <dt>Mask Pixels</dt>
              <dd>{formatInteger(candidate.groundTruthMaskPixels ?? 0)}</dd>
            </div>
            <div>
              <dt>Manual Agreement</dt>
              <dd>{manualAgreement(candidate)}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <ReviewControls review={candidate.review} onChange={onReviewChange} />

      <details className="technical-details">
        <summary>Technical details</summary>
        <dl className="detail-grid">
          <div>
            <dt>Scene ID</dt>
            <dd>{candidate.scene}</dd>
          </div>
          <div>
            <dt>Tile Identifier</dt>
            <dd>{shortenTileName(candidate.tileName)}</dd>
          </div>
          <div>
            <dt>U-Net Mean</dt>
            <dd>{formatDecimal(candidate.unetMeanProbability)}</dd>
          </div>
          <div>
            <dt>U-Net Max</dt>
            <dd>{formatDecimal(candidate.unetMaxProbability)}</dd>
          </div>
          <div>
            <dt>Candidate Pixels</dt>
            <dd>{formatInteger(candidate.candidatePixelCount)}</dd>
          </div>
          <div>
            <dt>U-Net Threshold</dt>
            <dd>{summary?.unetThreshold !== undefined ? formatDecimal(summary.unetThreshold, 2) : "Not supplied"}</dd>
          </div>
          <div>
            <dt>Projected Bounds</dt>
            <dd>
              {formatInteger(Math.round(candidate.projectedBounds.left))}, {formatInteger(Math.round(candidate.projectedBounds.bottom))}
            </dd>
          </div>
          <div>
            <dt>CRS</dt>
            <dd>
              {summary?.latlonCrs ?? "Not supplied"} / {summary?.sourceCrs ?? "Not supplied"}
            </dd>
          </div>
        </dl>
      </details>
    </aside>
  );
}

function manualAgreement(candidate: Candidate): string {
  if (!candidate.groundTruthLabel || candidate.review.status === "Needs Review" || candidate.review.status === "Unclear") {
    return "Not evaluated";
  }
  if (candidate.groundTruthLabel === "positive" && candidate.review.status === "Likely Slick") return "Agrees";
  if (candidate.groundTruthLabel === "negative" && candidate.review.status === "False Positive") return "Agrees";
  return "Does not agree";
}
