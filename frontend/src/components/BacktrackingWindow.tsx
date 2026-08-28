import { useEffect } from "react";
import { AlertTriangle, MapPinned, Route, X } from "lucide-react";
import type { Candidate } from "../types/candidates";
import { formatCoordinate, shortenTileName } from "../utils/format";
import ModeBadge from "./ModeBadge";

type BacktrackingWindowProps = {
  candidate: Candidate | null;
  open: boolean;
  onClose: () => void;
};

export default function BacktrackingWindow({
  candidate,
  open,
  onClose,
}: BacktrackingWindowProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="backtracking-window-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="backtracking-window"
        role="dialog"
        aria-modal="true"
        aria-label="Candidate backtracking"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="backtracking-window-header">
          <div>
            <span className="panel-kicker">CANDIDATE BACKTRACKING</span>
            <h2>{candidate ? shortenTileName(candidate.tileName) : "No candidate selected"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close backtracking window">
            <X size={16} />
          </button>
        </header>

        {candidate ? (
          <>
            <div className="backtracking-window-badges">
              <ModeBadge tone="warning">Unavailable</ModeBadge>
              <ModeBadge tone="model">Candidate-specific only</ModeBadge>
              <ModeBadge tone="synthetic">No global synthetic reuse</ModeBadge>
            </div>

            <dl className="backtracking-window-grid">
              <div>
                <dt>Candidate ID</dt>
                <dd>{candidate.candidateId}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{candidate.acquisitionDate}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {formatCoordinate(candidate.latitude)}, {formatCoordinate(candidate.longitude)}
                </dd>
              </div>
              <div>
                <dt>Provenance</dt>
                <dd>Unavailable - no candidate-linked path</dd>
              </div>
            </dl>

            <div className="backtracking-canvas unavailable">
              <MapPinned size={22} />
              <Route className="backtracking-dashed-icon" size={78} />
              <strong>Backtracking unavailable for this candidate</strong>
              <span>No trajectory/path file is linked by candidate ID, date, location, and source metadata.</span>
            </div>

            <div className="backtracking-window-note">
              <AlertTriangle size={14} />
              <span>Prototype/global source-attribution CSVs are intentionally not drawn here for SAR candidates.</span>
            </div>
          </>
        ) : (
          <div className="backtracking-canvas unavailable">
            <strong>Select a candidate before opening backtracking.</strong>
          </div>
        )}
      </section>
    </div>
  );
}
