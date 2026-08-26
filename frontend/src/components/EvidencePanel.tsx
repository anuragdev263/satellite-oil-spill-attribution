type Evidence = {
  label: string;
  score: number;
  description: string;
};

type EvidencePanelProps = {
  evidence: Evidence[];
  confidence: number;
};

export default function EvidencePanel({
  evidence,
  confidence,
}: EvidencePanelProps) {
  return (
    <section className="panel-section evidence-section">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">EVIDENCE FUSION</span>
          <h2>CONFIDENCE CHAIN</h2>
        </div>
      </div>

      <div className="overall-confidence">
        <div>
          <span>PROBABLE SOURCE CONFIDENCE</span>
          <strong>
            {(confidence * 100).toFixed(0)}%
          </strong>
        </div>

        <div className="confidence-bar">
          <div
            style={{
              width: `${confidence * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="evidence-list">
        {evidence.map((item) => (
          <div className="evidence-item" key={item.label}>
            <div className="evidence-top">
              <span>{item.label}</span>

              <strong>
                {(item.score * 100).toFixed(0)}%
              </strong>
            </div>

            <div className="evidence-bar">
              <div
                style={{
                  width: `${item.score * 100}%`,
                }}
              />
            </div>

            <p>{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}