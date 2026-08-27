import type { BacktrackingPrototypeData, SourceAttributionRecord } from "../types/backtracking";

type SourceAttributionPanelProps = {
  data: BacktrackingPrototypeData;
  selectedVesselId: string | null;
  onSelectVessel: (vesselId: string) => void;
};

export default function SourceAttributionPanel({
  data,
  selectedVesselId,
  onSelectVessel,
}: SourceAttributionPanelProps) {
  const ranked = data.sourceAttribution.slice().sort((a, b) => b.hybridScore - a.hybridScore);
  const selected = selectedVesselId
    ? ranked.find((record) => record.vesselId === selectedVesselId)
    : ranked[0];
  const latestDrift = data.backtrackedTrajectory[0];
  const latestEnvironment = data.environment[data.environment.length - 1];

  return (
    <aside className="right-panel source-panel">
      <section className="panel-section">
        <div className="panel-header compact">
          <div>
            <span className="panel-kicker">VESSEL PROXIMITY RANKING</span>
            <h2>Vessel Proximity Scores</h2>
          </div>
          <span className="candidate-count">{ranked.length} VESSELS</span>
        </div>

        <div className="vessel-list">
          {ranked.map((record, index) => (
            <button
              key={record.vesselId}
              className={`synthetic-vessel-row ${record.vesselId === selectedVesselId ? "selected" : ""}`}
              type="button"
              onClick={() => onSelectVessel(record.vesselId)}
            >
              <div className="candidate-row-top">
                <strong>#{String(index + 1).padStart(2, "0")}</strong>
                <span>{record.vesselId}</span>
              </div>
              <div className="synthetic-score-line">
                <span>Scenario Score</span>
                <strong>{record.hybridScore.toFixed(2)}</strong>
              </div>
              <div className="vessel-progress">
                <div style={{ width: `${Math.min(100, Math.max(0, record.hybridScore))}%` }} />
              </div>
              <dl className="candidate-grid synthetic-score-grid">
                <div>
                  <dt>Direct distance</dt>
                  <dd>{record.directDistanceKm.toFixed(2)} km</dd>
                </div>
                <div>
                  <dt>Minimum distance</dt>
                  <dd>{record.minimumDistanceKm.toFixed(2)} km</dd>
                </div>
              </dl>
            </button>
          ))}
        </div>
      </section>

      {selected ? <SelectedAttributionDetails record={selected} /> : null}

      <section className="panel-section">
        <span className="panel-kicker">SOURCE SUMMARY</span>
        <h2>Probable Source Region</h2>
        <dl className="detail-grid">
          <div>
            <dt>Scenario ID</dt>
            <dd>{data.spillLocation?.caseId ?? "Not supplied"}</dd>
          </div>
          <div>
            <dt>Observed spill date</dt>
            <dd>{data.spillLocation ? "12/08/2019" : "Not supplied"}</dd>
          </div>
          <div>
            <dt>Particle timesteps</dt>
            <dd>{data.times.length}</dd>
          </div>
          <div>
            <dt>Source particles</dt>
            <dd>{data.particles.length.toLocaleString("en-US")}</dd>
          </div>
        </dl>
      </section>

      <section className="panel-section">
        <span className="panel-kicker">DRIFT PROJECTION</span>
        <h2>Current Vector Context</h2>
        <dl className="detail-grid">
          <div>
            <dt>Backtrack start</dt>
            <dd>{latestDrift ? `${latestDrift.latitude.toFixed(4)}, ${latestDrift.longitude.toFixed(4)}` : "Not supplied"}</dd>
          </div>
          <div>
            <dt>Drift U/V</dt>
            <dd>{latestDrift ? `${latestDrift.driftUMs.toFixed(3)} / ${latestDrift.driftVMs.toFixed(3)} m/s` : "Not supplied"}</dd>
          </div>
          <div>
            <dt>Wind U/V</dt>
            <dd>{latestEnvironment ? `${latestEnvironment.windUMs.toFixed(2)} / ${latestEnvironment.windVMs.toFixed(2)} m/s` : "Not supplied"}</dd>
          </div>
          <div>
            <dt>Current U/V</dt>
            <dd>{latestEnvironment ? `${latestEnvironment.currentUMs.toFixed(2)} / ${latestEnvironment.currentVMs.toFixed(2)} m/s` : "Not supplied"}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}

function SelectedAttributionDetails({ record }: { record: SourceAttributionRecord }) {
  return (
    <section className="panel-section">
      <span className="panel-kicker">SELECTED VESSEL</span>
      <h2>{record.vesselId}</h2>
      <dl className="detail-grid">
        <div>
          <dt>Scenario Score</dt>
          <dd>{record.hybridScore.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Trajectory score</dt>
          <dd>{record.trajectoryScore.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Case ID</dt>
          <dd>{record.caseId}</dd>
        </div>
        <div>
          <dt>Observed spill date</dt>
          <dd>12/08/2019</dd>
        </div>
      </dl>
    </section>
  );
}
