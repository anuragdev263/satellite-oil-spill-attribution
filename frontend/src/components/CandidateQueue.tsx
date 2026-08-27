import { useEffect, useRef } from "react";
import type { Candidate } from "../types/candidates";
import {
  formatCoordinate,
  formatDecimal,
  formatInteger,
  formatPercentFraction,
  shortenTileName,
} from "../utils/format";
import ModeBadge from "./ModeBadge";

type CandidateQueueProps = {
  candidates: Candidate[];
  selectedCandidateId: string | null;
  evaluationMode: boolean;
  onSelect: (candidateId: string) => void;
};

export default function CandidateQueue({
  candidates,
  selectedCandidateId,
  evaluationMode,
  onSelect,
}: CandidateQueueProps) {
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (!selectedCandidateId) return;
    rowRefs.current.get(selectedCandidateId)?.scrollIntoView({ block: "nearest" });
  }, [selectedCandidateId]);

  return (
    <section className="queue-panel">
      <div className="panel-header compact">
        <div>
          <span className="panel-kicker">REVIEW QUEUE</span>
          <h2>Candidate Regions</h2>
        </div>
        <span className="candidate-count">{candidates.length} SHOWN</span>
      </div>

      <div className="candidate-list" role="listbox" aria-label="Ranked candidate queue">
        {candidates.map((candidate) => {
          const selected = candidate.candidateId === selectedCandidateId;
          const reviewed = candidate.review.status !== "Needs Review";

          return (
            <button
              key={candidate.candidateId}
              ref={(node) => {
                if (node) rowRefs.current.set(candidate.candidateId, node);
                else rowRefs.current.delete(candidate.candidateId);
              }}
              className={`candidate-row ${selected ? "selected" : ""}`}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(candidate.candidateId)}
            >
              <div className="candidate-row-top">
                <strong>#{String(candidate.rank).padStart(2, "0")}</strong>
                <span>{candidate.acquisitionDate}</span>
                <ModeBadge tone={candidate.asset ? "observed" : "warning"}>
                  {candidate.asset ? "Preview" : "No preview"}
                </ModeBadge>
              </div>
              <div className="candidate-row-title">
                <span>{candidate.scene}</span>
                <span>{shortenTileName(candidate.tileName)}</span>
              </div>
              <dl className="candidate-grid">
                <div>
                  <dt>Lat/Lon</dt>
                  <dd>
                    {formatCoordinate(candidate.latitude)}, {formatCoordinate(candidate.longitude)}
                  </dd>
                </div>
                <div>
                  <dt>CNN Screening Score</dt>
                  <dd>{formatDecimal(candidate.cnnScore)}</dd>
                </div>
                <div>
                  <dt>U-Net p95 Heatmap Value</dt>
                  <dd>{formatDecimal(candidate.unetP95Probability)}</dd>
                </div>
                <div>
                  <dt>Candidate Fraction</dt>
                  <dd>{formatPercentFraction(candidate.candidateFraction)}</dd>
                </div>
                <div>
                  <dt>Candidate Pixels</dt>
                  <dd>{formatInteger(candidate.candidatePixelCount)}</dd>
                </div>
                <div>
                  <dt>Fusion Ranking Score</dt>
                  <dd>{formatDecimal(candidate.finalFusionScore)}</dd>
                </div>
              </dl>
              <div className="candidate-row-footer">
                <ModeBadge tone={reviewed ? "human" : "warning"}>{candidate.review.status}</ModeBadge>
                {evaluationMode ? (
                  <ModeBadge tone="observed">
                    Ground Truth: {candidate.groundTruthLabel ?? "Not supplied"}
                  </ModeBadge>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
