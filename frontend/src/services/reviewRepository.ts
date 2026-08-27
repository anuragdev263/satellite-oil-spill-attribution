import type { CandidateReview, ReviewRepository, ReviewStatus } from "../types/candidates";

const STORAGE_KEY = "oilspill-intelligence:candidate-reviews:v1";

export const REVIEW_STATUSES: ReviewStatus[] = [
  "Needs Review",
  "Likely Slick",
  "False Positive",
  "Unclear",
];

export function createDefaultReview(candidateId: string): CandidateReview {
  return {
    candidateId,
    status: "Needs Review",
    notes: "",
  };
}

function parseStoredReview(value: unknown): CandidateReview | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.candidateId !== "string") return null;
  if (!REVIEW_STATUSES.includes(record.status as ReviewStatus)) return null;

  return {
    candidateId: record.candidateId,
    status: record.status as ReviewStatus,
    notes: typeof record.notes === "string" ? record.notes : "",
    reviewerName: typeof record.reviewerName === "string" ? record.reviewerName : undefined,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
  };
}

export function validateImportedReviews(value: unknown, allowedCandidateIds: Set<string>): CandidateReview[] {
  if (!Array.isArray(value)) {
    throw new Error("Review import must be a JSON array.");
  }

  const seen = new Set<string>();
  return value.map((item, index) => {
    const review = parseStoredReview(item);
    if (!review) {
      throw new Error(`Review import record ${index + 1} is malformed.`);
    }
    if (!allowedCandidateIds.has(review.candidateId)) {
      throw new Error(`Review import record ${index + 1} references an unknown candidate.`);
    }
    if (seen.has(review.candidateId)) {
      throw new Error(`Review import contains a duplicate candidate: ${review.candidateId}`);
    }
    seen.add(review.candidateId);
    return review;
  });
}

export class LocalStorageReviewRepository implements ReviewRepository {
  load(): CandidateReview[] {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(parseStoredReview).filter((item): item is CandidateReview => item !== null);
    } catch {
      return [];
    }
  }

  save(review: CandidateReview): void {
    const reviews = this.load();
    const next = reviews.filter((item) => item.candidateId !== review.candidateId);
    next.push(review);
    this.replaceAll(next);
  }

  replaceAll(reviews: CandidateReview[]): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews, null, 2));
  }

  reset(): void {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
