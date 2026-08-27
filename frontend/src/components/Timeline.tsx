type BacktrackPoint = {
  hoursAgo: number;
};

type ForwardPoint = {
  hoursAhead: number;
};

type TimelineProps = {
  backtrack: BacktrackPoint[];
  forwardDrift: ForwardPoint[];
  selectedTimeOffset?: number;
  onTimeSelect?: (offset: number) => void;
};

export default function Timeline({
  backtrack,
  forwardDrift,
  selectedTimeOffset = 0,
  onTimeSelect,
}: TimelineProps) {
  const backtrackOffsets = backtrack.map((b) => -b.hoursAgo).sort((a, b) => a - b);
  const forwardOffsets = forwardDrift.map((f) => f.hoursAhead).sort((a, b) => a - b);
  const timelineList = Array.from(new Set([...backtrackOffsets, ...forwardOffsets])).sort(
    (a, b) => a - b
  );

  const currentIndex = timelineList.indexOf(selectedTimeOffset);
  const safeIndex = currentIndex !== -1 ? currentIndex : timelineList.indexOf(0);

  const handlePrev = () => {
    if (safeIndex > 0 && onTimeSelect) {
      onTimeSelect(timelineList[safeIndex - 1]);
    }
  };

  const handleNext = () => {
    if (safeIndex < timelineList.length - 1 && onTimeSelect) {
      onTimeSelect(timelineList[safeIndex + 1]);
    }
  };

  const formatButtonLabel = (offset: number) => {
    if (offset === 0) return "NOW";
    if (offset < 0) return `-${Math.abs(offset)} HOURS`;
    return `+${offset} HOURS`;
  };

  return (
    <div className="timeline">
      <div className="timeline-title">
        <span>DRIFT ANALYSIS</span>
        <strong>TEMPORAL RECONSTRUCTION</strong>
      </div>

      <div className="timeline-track">
        <div className="timeline-line" />

        {backtrack.map((point) => {
          const offset = -point.hoursAgo;
          const isSelected = selectedTimeOffset === offset;
          return (
            <div
              className={`timeline-point ${isSelected ? "active selected" : ""}`}
              key={`back-${point.hoursAgo}`}
              onClick={() => onTimeSelect && onTimeSelect(offset)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="timeline-dot"
                style={
                  isSelected
                    ? {
                        backgroundColor: "#D6A94A",
                        transform: "scale(1.3)",
                        boxShadow: "0 0 8px rgba(214, 169, 74, 0.8)",
                      }
                    : undefined
                }
              />

              <span
                style={
                  isSelected
                    ? {
                        color: "#D6A94A",
                        fontWeight: "bold",
                      }
                    : undefined
                }
              >
                {point.hoursAgo === 0 ? "NOW" : `-${point.hoursAgo}H`}
              </span>
            </div>
          );
        })}

        {forwardDrift.map((point) => {
          const offset = point.hoursAhead;
          const isSelected = selectedTimeOffset === offset;
          return (
            <div
              className={`timeline-point future ${isSelected ? "active selected" : ""}`}
              key={`future-${point.hoursAhead}`}
              onClick={() => onTimeSelect && onTimeSelect(offset)}
              style={{ cursor: "pointer" }}
            >
              <div
                className="timeline-dot"
                style={
                  isSelected
                    ? {
                        backgroundColor: "#D6A94A",
                        transform: "scale(1.3)",
                        boxShadow: "0 0 8px rgba(214, 169, 74, 0.8)",
                      }
                    : undefined
                }
              />

              <span
                style={
                  isSelected
                    ? {
                        color: "#D6A94A",
                        fontWeight: "bold",
                      }
                    : undefined
                }
              >
                +{point.hoursAhead}H
              </span>
            </div>
          );
        })}
      </div>

      <div className="timeline-actions">
        <button
          onClick={handlePrev}
          disabled={safeIndex <= 0}
          style={{
            opacity: safeIndex <= 0 ? 0.4 : 1,
            cursor: safeIndex <= 0 ? "not-allowed" : "pointer",
          }}
        >
          ◀ BACKTRACK
        </button>

        <button className="active" style={{ cursor: "default" }}>
          {formatButtonLabel(selectedTimeOffset)}
        </button>

        <button
          onClick={handleNext}
          disabled={safeIndex >= timelineList.length - 1}
          style={{
            opacity: safeIndex >= timelineList.length - 1 ? 0.4 : 1,
            cursor: safeIndex >= timelineList.length - 1 ? "not-allowed" : "pointer",
          }}
        >
          FORWARD DRIFT ▶
        </button>
      </div>
    </div>
  );
}