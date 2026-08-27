type Vessel = {
  rank: number;
  name: string;
  mmsi: string;
  imo: string;
  type: string;
  flag: string;
  score: number;
};

type VesselRankingProps = {
  vessels: Vessel[];
  selectedVesselMmsi?: string | null;
  onVesselSelect?: (mmsi: string | null) => void;
  onRunWhatIf?: (mmsi: string) => void;
  onViewTrack?: (mmsi: string) => void;
};

export default function VesselRanking({
  vessels,
  selectedVesselMmsi = null,
  onVesselSelect,
  onRunWhatIf,
  onViewTrack,
}: VesselRankingProps) {
  return (
    <section className="panel-section">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">
            {selectedVesselMmsi ? "VESSEL INVESTIGATION" : "INVESTIGATION"}
          </span>
          <h2>{selectedVesselMmsi ? "ACTIVE CANDIDATE" : "RANKED VESSELS"}</h2>
        </div>

        <span className="candidate-count">
          {selectedVesselMmsi ? "1 SELECTED" : `${vessels.length} CANDIDATES`}
        </span>
      </div>

      <div className="vessel-list">
        {vessels.map((vessel) => {
          const isSelected = vessel.mmsi === selectedVesselMmsi;

          // Hide non-selected vessels when one is actively being investigated to save space
          if (selectedVesselMmsi && !isSelected) return null;

          return (
            <div
              className={`vessel-card ${isSelected ? "selected active" : ""}`}
              key={vessel.mmsi}
              style={{
                borderColor: isSelected ? "#D6A94A" : undefined,
                backgroundColor: isSelected ? "#0F2B35" : undefined,
                boxShadow: isSelected ? "0 0 10px rgba(214, 169, 74, 0.25)" : undefined,
                transition: "all 0.2s ease-in-out",
                cursor: isSelected ? "default" : "pointer",
              }}
            >
              {/* TOP: rank + vessel name + confidence score — clickable to toggle selection */}
              <div
                style={{ display: "flex", cursor: "pointer" }}
                onClick={() => {
                  if (onVesselSelect) {
                    onVesselSelect(isSelected ? null : vessel.mmsi);
                  }
                }}
              >
                <div className="vessel-rank">
                  {String(vessel.rank).padStart(2, "0")}
                </div>

                <div className="vessel-main">
                  <div className="vessel-name">{vessel.name}</div>
                  <div className="vessel-meta">
                    {vessel.type} • {vessel.flag}
                  </div>
                  <div className="vessel-progress">
                    <div
                      style={{
                        width: `${vessel.score * 100}%`,
                        backgroundColor: isSelected ? "#D6A94A" : undefined,
                      }}
                    />
                  </div>
                </div>

                <div className="vessel-score">
                  <strong style={isSelected ? { color: "#D6A94A" } : undefined}>
                    {vessel.score.toFixed(2)}
                  </strong>
                  <span>CONF</span>
                </div>
              </div>

              {/* EXPANDED INVESTIGATION DATA */}
              {isSelected && (
                <div
                  className="candidate-details"
                  style={{
                    marginTop: "16px",
                    borderTop: "1px solid #3A5560",
                    paddingTop: "12px",
                    fontSize: "10px",
                    color: "#9DD7E8",
                  }}
                >
                  {/* IDENTITY */}
                  <div style={{ marginBottom: "14px" }}>
                    <div
                      style={{
                        color: "#D6A94A",
                        fontWeight: "bold",
                        marginBottom: "6px",
                        fontSize: "9px",
                        letterSpacing: "0.08em",
                      }}
                    >
                      IDENTITY
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <span style={{ color: "#7C9AA3", display: "block", fontSize: "8px" }}>MMSI</span>
                        <span>{vessel.mmsi}</span>
                      </div>
                      <div>
                        <span style={{ color: "#7C9AA3", display: "block", fontSize: "8px" }}>IMO</span>
                        <span>{vessel.imo}</span>
                      </div>
                    </div>
                  </div>

                  {/* VESSEL */}
                  <div style={{ marginBottom: "14px" }}>
                    <div
                      style={{
                        color: "#D6A94A",
                        fontWeight: "bold",
                        marginBottom: "6px",
                        fontSize: "9px",
                        letterSpacing: "0.08em",
                      }}
                    >
                      VESSEL
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <span style={{ color: "#7C9AA3", display: "block", fontSize: "8px" }}>TYPE</span>
                        <span>{vessel.type}</span>
                      </div>
                      <div>
                        <span style={{ color: "#7C9AA3", display: "block", fontSize: "8px" }}>FLAG</span>
                        <span>{vessel.flag}</span>
                      </div>
                    </div>
                  </div>

                  {/* EVIDENCE CONTRIBUTION */}
                  <div style={{ marginBottom: "14px" }}>
                    <div
                      style={{
                        color: "#D6A94A",
                        fontWeight: "bold",
                        marginBottom: "6px",
                        fontSize: "9px",
                        letterSpacing: "0.08em",
                      }}
                    >
                      EVIDENCE CONTRIBUTION
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>SATELLITE SIGNATURE</span> <span>91%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>AIS PROXIMITY</span> <span>84%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span>BACKTRACK CONSISTENCY</span> <span>78%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>VESSEL BEHAVIOUR</span> <span>71%</span>
                    </div>
                  </div>

                  {/* BOTTOM: temporal match | source distance */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                      marginBottom: "14px",
                      borderTop: "1px dashed #3A5560",
                      paddingTop: "12px",
                    }}
                  >
                    <div>
                      <span style={{ color: "#7C9AA3", display: "block", marginBottom: "2px", fontSize: "8px" }}>
                        TEMPORAL MATCH
                      </span>
                      <span style={{ color: "#50E3C2", fontWeight: "bold" }}>HIGH</span>
                    </div>
                    <div>
                      <span style={{ color: "#7C9AA3", display: "block", marginBottom: "2px", fontSize: "8px" }}>
                        SOURCE DISTANCE
                      </span>
                      <span>12.4 KM</span>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => onViewTrack && onViewTrack(vessel.mmsi)}
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: "1px solid #69B7D1",
                        color: "#69B7D1",
                        padding: "6px",
                        fontSize: "9px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      [ VIEW TRACK ]
                    </button>
                    <button
                      onClick={() => onRunWhatIf && onRunWhatIf(vessel.mmsi)}
                      style={{
                        flex: 1,
                        background: "#FF6B6B",
                        border: "1px solid #FF6B6B",
                        color: "#061419",
                        padding: "6px",
                        fontSize: "9px",
                        fontWeight: "bold",
                        cursor: "pointer",
                      }}
                    >
                      [ RUN WHAT-IF ]
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}