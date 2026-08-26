type BacktrackPoint = {
  hoursAgo: number;
};

type ForwardPoint = {
  hoursAhead: number;
};

type TimelineProps = {
  backtrack: BacktrackPoint[];
  forwardDrift: ForwardPoint[];
};

export default function Timeline({
  backtrack,
  forwardDrift,
}: TimelineProps) {
  return (
    <div className="timeline">
      <div className="timeline-title">
        <span>DRIFT ANALYSIS</span>
        <strong>TEMPORAL RECONSTRUCTION</strong>
      </div>

      <div className="timeline-track">
        <div className="timeline-line" />

        {backtrack.map((point) => (
          <div
            className="timeline-point"
            key={`back-${point.hoursAgo}`}
          >
            <div className="timeline-dot" />

            <span>
              {point.hoursAgo === 0
                ? "NOW"
                : `-${point.hoursAgo}H`}
            </span>
          </div>
        ))}

        {forwardDrift.map((point) => (
          <div
            className="timeline-point future"
            key={`future-${point.hoursAhead}`}
          >
            <div className="timeline-dot" />

            <span>+{point.hoursAhead}H</span>
          </div>
        ))}
      </div>

      <div className="timeline-actions">
        <button>◀ BACKTRACK</button>

        <button className="active">
          6 HOURS
        </button>

        <button>
          FORWARD DRIFT ▶
        </button>
      </div>
    </div>
  );
}