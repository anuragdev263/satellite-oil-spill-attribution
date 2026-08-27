type DataStatePanelProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function DataStatePanel({
  title,
  message,
  actionLabel,
  onAction,
}: DataStatePanelProps) {
  return (
    <section className="data-state">
      <span className="panel-kicker">DATA STATE</span>
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button className="console-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  );
}
