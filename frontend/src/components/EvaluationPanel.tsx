import { EVALUATION_SUMMARY } from "../services/fusionDataService";
import type { Candidate } from "../types/candidates";
import { formatDecimal } from "../utils/format";

type EvaluationPanelProps = {
  candidates: Candidate[];
};

export default function EvaluationPanel({ candidates }: EvaluationPanelProps) {
  const positives = candidates.filter((candidate) => candidate.groundTruthLabel === "positive").length;
  const negatives = candidates.filter((candidate) => candidate.groundTruthLabel === "negative").length;

  return (
    <section className="evaluation-panel">
      <div>
        <span className="panel-kicker">EVALUATION MODE</span>
        <h2>Held-Out Ground Truth Visible</h2>
        <p>
          Evaluation Mode reveals held-out ground truth and is not part of the operational
          review workflow.
        </p>
      </div>
      <dl className="metric-strip">
        <div>
          <dt>Rows Loaded</dt>
          <dd>{candidates.length}</dd>
        </div>
        <div>
          <dt>Ground-Truth Positives</dt>
          <dd>{positives}</dd>
        </div>
        <div>
          <dt>Ground-Truth Negatives</dt>
          <dd>{negatives}</dd>
        </div>
        <div>
          <dt>Test Top 12</dt>
          <dd>{EVALUATION_SUMMARY.testTop12Positives}/12 positive</dd>
        </div>
        <div>
          <dt>Validation Top 12</dt>
          <dd>{EVALUATION_SUMMARY.validationTop12Positives}/12 positive</dd>
        </div>
        <div>
          <dt>CNN Test F1</dt>
          <dd>{formatDecimal(EVALUATION_SUMMARY.cnnTest.f1)}</dd>
        </div>
        <div>
          <dt>CNN Test AUC-ROC</dt>
          <dd>{formatDecimal(EVALUATION_SUMMARY.cnnTest.aucRoc)}</dd>
        </div>
        <div>
          <dt>U-Net Test Dice</dt>
          <dd>{formatDecimal(EVALUATION_SUMMARY.unetTest.dice, 4)}</dd>
        </div>
      </dl>
    </section>
  );
}
