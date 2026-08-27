import { REVIEW_STATUSES } from "../services/reviewRepository";
import type { CandidateReview, ReviewStatus } from "../types/candidates";

type ReviewControlsProps = {
  review: CandidateReview;
  onChange: (review: CandidateReview) => void;
};

export default function ReviewControls({ review, onChange }: ReviewControlsProps) {
  const patch = (next: Partial<CandidateReview>) => {
    onChange({
      ...review,
      ...next,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <section className="review-controls">
      <label>
        <span>Manual review status</span>
        <select
          value={review.status}
          onChange={(event) => patch({ status: event.target.value as ReviewStatus })}
        >
          {REVIEW_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Reviewer name (optional)</span>
        <input
          value={review.reviewerName ?? ""}
          onChange={(event) => patch({ reviewerName: event.target.value })}
          placeholder="Reviewer"
        />
      </label>
      <label className="notes-field">
        <span>Reviewer notes</span>
        <textarea
          value={review.notes}
          onChange={(event) => patch({ notes: event.target.value })}
          placeholder="Record visual observations and uncertainty."
        />
      </label>
      <div className="review-updated">
        Updated: <strong>{review.updatedAt ?? "Not reviewed yet"}</strong>
      </div>
    </section>
  );
}
