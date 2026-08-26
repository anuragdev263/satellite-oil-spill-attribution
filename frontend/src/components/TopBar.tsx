type TopBarProps = {
  caseData: {
    caseId: string;
    status: string;
    region: string;
    observation: {
      time: string;
    };
  };
};

export default function TopBar({ caseData }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">ST</div>

        <div>
          <div className="brand-name">OILSPILL INTELLIGENCE</div>

          <div className="brand-subtitle">
            SATELLITE • AIS • MARITIME INTELLIGENCE
          </div>
        </div>
      </div>

      <div className="case-info">
        <span>CASE</span>
        <strong>{caseData.caseId}</strong>

        <span>REGION</span>
        <strong>{caseData.region}</strong>

        <span>OBSERVATION</span>
        <strong>{caseData.observation.time}</strong>
      </div>

      <div className="status">
        <span className="status-dot" />
        {caseData.status}
      </div>
    </header>
  );
}