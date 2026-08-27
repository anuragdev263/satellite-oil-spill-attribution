import type { FusionSummary, PipelineRun } from "../types/candidates";
import { formatDecimal, formatInteger } from "../utils/format";

type RunInformationDrawerProps = {
  run: PipelineRun;
  open: boolean;
  onClose: () => void;
};

export default function RunInformationDrawer({ run, open, onClose }: RunInformationDrawerProps) {
  if (!open) return null;
  const summary = run.summary;

  return (
    <aside className="run-drawer" aria-label="Run information">
      <div className="panel-header compact">
        <div>
          <span className="panel-kicker">RUN INFORMATION</span>
          <h2>Data Provenance</h2>
        </div>
        <button className="console-button subtle" type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <p className="central-disclaimer">
        This experimental system prioritizes SAR regions for human review. It does not confirm
        an oil spill or identify a responsible vessel.
      </p>

      <dl className="detail-grid">
        <Info label="Creation timestamp" value={summary?.createdAt} suffix="timezone unspecified" />
        <Info label="Grouped split only" value={summary?.groupedSplitOnly ? "Yes" : "Not supplied"} />
        <Info label="CNN model identifier" value={summary?.cnnModel} />
        <Info label="U-Net model identifier" value={summary?.unetModel} />
        <Info label="Image size" value={summary?.imageSize ? `${summary.imageSize} px` : undefined} />
        <Info label="U-Net threshold" value={formatOptionalDecimal(summary?.unetThreshold, 2)} />
        <Info label="Fusion formula" value={summary?.fusionFormula} />
        <Info label="Source CRS" value={summary?.sourceCrs} />
        <Info label="Lat/Lon CRS" value={summary?.latlonCrs} />
        <Info label="Ranked rows" value={formatOptionalInteger(summary?.rowsRanked)} />
        <Info label="Validation candidates" value={formatOptionalInteger(summary?.validationTiles)} />
        <Info label="Test candidates" value={formatOptionalInteger(summary?.testTiles)} />
        <Info label="Preview assets" value={formatInteger(run.assets.length)} />
        <Info label="Model hashes" value={undefined} />
        <Info label="Dataset version" value={undefined} />
        <Info label="Git commit" value={undefined} />
        <Info label="Pipeline version" value={undefined} />
        <Info label="Calibration method" value={undefined} />
        <Info label="Asset checksums" value={undefined} />
      </dl>

      {run.warnings.length > 0 ? (
        <section className="warning-list">
          <span className="panel-kicker">WARNINGS</span>
          {run.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </section>
      ) : null}

      <section className="warning-list">
        <span className="panel-kicker">PROTOTYPE LIMITATIONS</span>
        <p>No AIS positions, vessel metadata, drift fields, source-estimation outputs, or georeferenced slick polygons are connected to this run.</p>
      </section>
    </aside>
  );
}

function Info({ label, value, suffix }: { label: string; value?: string; suffix?: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {value && value.trim() !== "" ? value : "Not supplied"}
        {value && suffix ? <span className="field-suffix"> {suffix}</span> : null}
      </dd>
    </div>
  );
}

function formatOptionalDecimal(value: FusionSummary["unetThreshold"], digits: number): string | undefined {
  return value === undefined ? undefined : formatDecimal(value, digits);
}

function formatOptionalInteger(value: FusionSummary["rowsRanked"]): string | undefined {
  return value === undefined ? undefined : formatInteger(value);
}
