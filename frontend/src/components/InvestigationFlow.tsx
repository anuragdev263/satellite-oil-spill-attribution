import { useState } from "react";
import {
  Anchor,
  ChevronDown,
  ClipboardCheck,
  Database,
  FileText,
  GitBranch,
  Layers,
  Radar,
  Route,
  Scale,
  Search,
  ShieldCheck,
  Ship,
} from "lucide-react";

const FLOW_STEPS = [
  {
    title: "Incident Intake",
    tag: "Future backend needed",
    icon: Anchor,
    detail: "Incident ID, time, location, source, and slick footprint when available.",
  },
  {
    title: "Detection Review",
    tag: "Available in current MVP",
    icon: Radar,
    detail: "SAR preview, CNN score, U-Net cue, fusion rank, analyst decision.",
  },
  {
    title: "Source Reconstruction / Backtracking",
    tag: "Future backend needed",
    icon: Route,
    detail: "Candidate-specific source zone, release window, path, and uncertainty only when linked data exists.",
  },
  {
    title: "Vessel Correlation",
    tag: "Future backend needed",
    icon: Ship,
    detail: "AIS tracks inside a candidate-specific source region and release window.",
  },
  {
    title: "Attribution & Ranking",
    tag: "Prototype/synthetic",
    icon: Scale,
    detail: "Relative evidence scoring only. Never a confirmed polluter ranking.",
  },
  {
    title: "Evidence Review",
    tag: "Data-linked",
    icon: Search,
    detail: "Candidate details, supporting or weakening evidence, reviewer notes.",
  },
  {
    title: "Investigator Decision",
    tag: "Data-linked",
    icon: ClipboardCheck,
    detail: "Further investigation, cleared, inconclusive, unresolved, or escalate.",
  },
  {
    title: "Report & Case Closure",
    tag: "Data-linked",
    icon: FileText,
    detail: "Candidate report export, audit trail, maps, and review summary.",
  },
];

const SUPPORT_GROUPS = [
  { title: "Data Sources", items: "Satellite, AIS, environmental, external inputs", icon: Database },
  { title: "Supporting Systems", items: "Model registry, catalog, audit log, roles, access", icon: ShieldCheck },
  { title: "Key Outputs", items: "Source zones, scores, evidence, reports, trajectories", icon: Layers },
];

export default function InvestigationFlow() {
  const [open, setOpen] = useState(false);

  return (
    <section className="flow-drawer">
      <button className="flow-trigger" type="button" onClick={() => setOpen((value) => !value)}>
        <GitBranch size={15} />
        <span>TARANG Product Flow</span>
        <ChevronDown className={open ? "open" : ""} size={15} />
      </button>

      {open ? (
        <div className="flow-content">
          <div className="flow-steps">
            {FLOW_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <details key={step.title} className="flow-step" open={index < 2}>
                  <summary>
                    <Icon size={15} />
                    <span>{index + 1}. {step.title}</span>
                    <em>{step.tag}</em>
                  </summary>
                  <p>{step.detail}</p>
                </details>
              );
            })}
          </div>
          <div className="flow-support">
            {SUPPORT_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title}>
                  <Icon size={14} />
                  <strong>{group.title}</strong>
                  <span>{group.items}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
