import type { Candidate } from "../types/candidates";
import { describeCandidateImage } from "../utils/format";

type CandidatePreviewProps = {
  candidate: Candidate;
  evaluationMode: boolean;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
};

export default function CandidatePreview({
  candidate,
  evaluationMode,
  fullscreen,
  onToggleFullscreen,
}: CandidatePreviewProps) {
  if (!candidate.asset) {
    return (
      <div className="missing-preview">
        <span className="panel-kicker">PREVIEW UNAVAILABLE</span>
        <h3>Preview unavailable for this candidate.</h3>
        <p>Only top-ranked demo previews were supplied.</p>
        <p>
          This candidate still comes from the fusion CSV and remains available for map review,
          scoring, filtering and manual status notes.
        </p>
      </div>
    );
  }

  const preview = (
    <figure className={`preview-frame ${evaluationMode ? "evaluation" : "masked"}`}>
      <img
        src={candidate.asset.compositePreviewUrl}
        alt={describeCandidateImage(candidate, evaluationMode)}
      />
      {!evaluationMode ? (
        <figcaption>Header hidden: ground truth is masked in Normal Review Mode.</figcaption>
      ) : (
        <figcaption>Evaluation Mode: original preview including ground-truth header.</figcaption>
      )}
    </figure>
  );

  return (
    <>
      <button className="preview-button" type="button" onClick={onToggleFullscreen}>
        {preview}
      </button>
      {fullscreen ? (
        <div className="preview-modal" role="dialog" aria-modal="true">
          <button className="modal-close" type="button" onClick={onToggleFullscreen}>
            Close
          </button>
          {preview}
        </div>
      ) : null}
    </>
  );
}
