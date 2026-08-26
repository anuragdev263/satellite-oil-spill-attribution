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
};

export default function VesselRanking({
  vessels,
}: VesselRankingProps) {
  return (
    <section className="panel-section">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">INVESTIGATION</span>
          <h2>RANKED VESSELS</h2>
        </div>

        <span className="candidate-count">
          {vessels.length} CANDIDATES
        </span>
      </div>

      <div className="vessel-list">
        {vessels.map((vessel) => (
          <div className="vessel-card" key={vessel.mmsi}>
            <div className="vessel-rank">
              {String(vessel.rank).padStart(2, "0")}
            </div>

            <div className="vessel-main">
              <div className="vessel-name">
                {vessel.name}
              </div>

              <div className="vessel-meta">
                {vessel.type} • {vessel.flag}
              </div>

              <div className="vessel-progress">
                <div
                  style={{
                    width: `${vessel.score * 100}%`,
                  }}
                />
              </div>

              <div className="vessel-identifiers">
                MMSI {vessel.mmsi}
              </div>
            </div>

            <div className="vessel-score">
              <strong>{vessel.score.toFixed(2)}</strong>
              <span>CONF</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}