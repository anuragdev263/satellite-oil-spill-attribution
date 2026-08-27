import { REVIEW_STATUSES } from "../services/reviewRepository";
import { DEFAULT_FILTERS } from "../constants/candidateFilters";
import type { Candidate, CandidateFilters } from "../types/candidates";

type CandidateFiltersPanelProps = {
  candidates: Candidate[];
  filters: CandidateFilters;
  onChange: (filters: CandidateFilters) => void;
};

export default function CandidateFiltersPanel({
  candidates,
  filters,
  onChange,
}: CandidateFiltersPanelProps) {
  const dates = Array.from(new Set(candidates.map((candidate) => candidate.acquisitionDate))).sort();
  const scenes = Array.from(new Set(candidates.map((candidate) => candidate.scene))).sort();

  const patch = (next: Partial<CandidateFilters>) => onChange({ ...filters, ...next });

  return (
    <section className="filter-panel" aria-label="Candidate filters">
      <div className="segmented-control" aria-label="Split filter">
        {(["test", "validation", "all"] as const).map((split) => (
          <button
            key={split}
            className={filters.split === split ? "active" : ""}
            type="button"
            onClick={() => patch({ split })}
          >
            {split === "all" ? "All" : split}
          </button>
        ))}
      </div>

      <label>
        <span>Review status</span>
        <select
          value={filters.reviewStatus}
          onChange={(event) => patch({ reviewStatus: event.target.value as CandidateFilters["reviewStatus"] })}
        >
          <option value="all">All statuses</option>
          {REVIEW_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Reviewed</span>
        <select
          value={filters.reviewed}
          onChange={(event) => patch({ reviewed: event.target.value as CandidateFilters["reviewed"] })}
        >
          <option value="all">Reviewed + unreviewed</option>
          <option value="reviewed">Reviewed only</option>
          <option value="unreviewed">Unreviewed only</option>
        </select>
      </label>

      <label>
        <span>Date</span>
        <select
          value={filters.acquisitionDate}
          onChange={(event) => patch({ acquisitionDate: event.target.value })}
        >
          <option value="all">All dates</option>
          {dates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Scene</span>
        <select value={filters.scene} onChange={(event) => patch({ scene: event.target.value })}>
          <option value="all">All scenes</option>
          {scenes.map((scene) => (
            <option key={scene} value={scene}>
              {scene}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-search">
        <span>Search scene or tile</span>
        <input
          value={filters.search}
          placeholder="S1A_20190824 or r15908"
          onChange={(event) => patch({ search: event.target.value })}
        />
      </label>

      <label>
        <span>Sort</span>
        <select
          value={filters.sortBy}
          onChange={(event) => patch({ sortBy: event.target.value as CandidateFilters["sortBy"] })}
        >
          <option value="fusion">Fusion score descending</option>
          <option value="rank">Rank ascending</option>
        </select>
      </label>

      <button className="console-button subtle" type="button" onClick={() => onChange(DEFAULT_FILTERS)}>
        Reset filters
      </button>
    </section>
  );
}
