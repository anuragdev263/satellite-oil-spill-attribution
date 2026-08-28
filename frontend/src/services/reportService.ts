import { jsPDF } from "jspdf";
import { QESHM_INCIDENT_METADATA } from "../constants/qeshmIncident";
import type { BacktrackingPrototypeData, SourceAttributionRecord } from "../types/backtracking";
import type { Candidate, FusionSummary } from "../types/candidates";

export function generateCandidateReviewPdf(candidate: Candidate, summary: FusionSummary | null): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  doc.setFillColor(8, 20, 25);
  doc.rect(margin, y, contentWidth, 24, "F");
  doc.setTextColor(80, 227, 194);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("TARANG / OILSPILL INTELLIGENCE | CANDIDATE REVIEW EXPORT", margin + 6, y + 7);
  doc.setTextColor(216, 228, 232);
  doc.setFontSize(13);
  doc.text(`SAR CANDIDATE REVIEW - ${candidate.split.toUpperCase()} RANK ${candidate.rank}`, margin + 6, y + 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(155, 177, 186);
  doc.text("Prototype review-support output. Not a confirmed spill or source attribution.", margin + 6, y + 20);
  y += 30;

  y = drawSectionHeader(doc, margin, y, contentWidth, "1. CANDIDATE SNAPSHOT");
  y = drawTable(
    doc,
    margin,
    y,
    contentWidth,
    ["FIELD", "VALUE", "PROVENANCE"],
    [
      ["Candidate ID", candidate.candidateId, "CSV / LOCAL REVIEW"],
      ["Scene", candidate.scene, "SAR FUSION OUTPUT"],
      ["Acquisition Date", candidate.acquisitionDate, "SAR FUSION OUTPUT"],
      ["Latitude / Longitude", `${candidate.latitude.toFixed(6)}, ${candidate.longitude.toFixed(6)}`, "DERIVED TILE CENTRE"],
      ["Split / Rank", `${candidate.split} / #${candidate.rank}`, "HELD-OUT EVALUATION DATA"],
      ["Tile", candidate.tileName, "STATIC CSV"],
    ],
    [42, 94, 42]
  );

  y += 4;
  y = drawSectionHeader(doc, margin, y, contentWidth, "2. MODEL REVIEW SCORES");
  y = drawTable(
    doc,
    margin,
    y,
    contentWidth,
    ["SCORE", "VALUE", "INTERPRETATION"],
    [
      ["Fusion Ranking Score", candidate.finalFusionScore.toFixed(3), "Raw priority score, not probability"],
      ["CNN Screening Score", candidate.cnnScore.toFixed(3), "Tile-level model signal"],
      ["U-Net p95 Heatmap", candidate.unetP95Probability.toFixed(3), "Pixel-level support cue"],
      ["Candidate Pixels", candidate.candidatePixelCount.toLocaleString("en-US"), "Mask-like candidate area"],
      ["Candidate Fraction", `${(candidate.candidateFraction * 100).toFixed(2)}%`, "Share of tile above threshold"],
      ["U-Net Threshold", summary?.unetThreshold !== undefined ? summary.unetThreshold.toFixed(2) : "Not supplied", "RUN SUMMARY"],
    ],
    [50, 42, 86]
  );

  y += 4;
  y = drawSectionHeader(doc, margin, y, contentWidth, "3. MANUAL REVIEW RECORD");
  y = drawTable(
    doc,
    margin,
    y,
    contentWidth,
    ["FIELD", "VALUE", "PROVENANCE"],
    [
      ["Review Status", candidate.review.status, "LOCAL REVIEW REPOSITORY"],
      ["Reviewer", candidate.review.reviewerName || "Not supplied", "LOCAL REVIEW REPOSITORY"],
      ["Updated At", candidate.review.updatedAt || "Not reviewed yet", "LOCAL REVIEW REPOSITORY"],
    ],
    [42, 94, 42]
  );

  y += 3;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 35, 45);
  doc.text("Reviewer Notes", margin + 2, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 65);
  const notes = candidate.review.notes.trim() || "No reviewer notes recorded.";
  const splitNotes = doc.splitTextToSize(notes, contentWidth - 4);
  doc.text(splitNotes, margin + 2, y);
  y += splitNotes.length * 3.8 + 6;

  y = drawSectionHeader(doc, margin, y, contentWidth, "4. CAUTION AND NEXT ACTION");
  const disclaimer =
    "This export documents a SAR candidate review state from static prototype outputs. It supports manual triage only and does not confirm an oil spill, identify a source vessel, or establish liability. Use approved/unclear/rejected decisions as audit inputs for future training and investigation follow-up.";
  doc.text(doc.splitTextToSize(disclaimer, contentWidth - 4), margin + 2, y);

  drawFooter(doc, margin, contentWidth, "SAR CANDIDATE REVIEW | PROVENANCE: STATIC MODEL OUTPUT + LOCAL HUMAN REVIEW");
  doc.save(`Candidate_Review_${candidate.split}_rank_${candidate.rank}_${candidate.acquisitionDate}.pdf`);
}

/**
 * Report 1: Real Incident Review PDF
 * Generates an authoritative technical review document for the Qeshm/Hengam oil pollution event.
 * Contains only authoritative reported facts, external attribution hypothesis, and data provenance disclaimers.
 * Never includes prototype scenario values as real incident facts.
 */
export function generateIncidentReviewPdf(): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const meta = QESHM_INCIDENT_METADATA;

  // Page geometry
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // --- HEADER BANNER ---
  doc.setFillColor(8, 20, 25);
  doc.rect(margin, y, contentWidth, 24, "F");

  doc.setTextColor(80, 227, 194);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("OILSPILL INTELLIGENCE  |  MARITIME ATTRIBUTION INTELLIGENCE CONSOLE", margin + 6, y + 7);

  doc.setTextColor(216, 228, 232);
  doc.setFontSize(13);
  doc.text("INCIDENT REVIEW: QESHM / HENGAM OIL POLLUTION EVENT", margin + 6, y + 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(155, 177, 186);
  doc.text(`CASE ID: ${meta.caseId}  |  STATUS: ${meta.sourceStatus}`, margin + 6, y + 20);

  y += 30;

  // --- SECTION: INCIDENT SNAPSHOT ---
  y = drawSectionHeader(doc, margin, y, contentWidth, "1. INCIDENT SNAPSHOT (EXTERNAL / REPORTED CONTEXT)");

  const snapshotRows = [
    ["Incident Name", meta.name, "REPORTED"],
    ["Geographic Region", meta.region, "REPORTED"],
    ["Observation Date", meta.observationDate, "REPORTED · UNU-INWEH"],
    ["Reported Extent", meta.reportedExtent, "REPORTED · SATELLITE OBSERVATION"],
    ["Reporting Agency", `${meta.reportingAgency} (United Nations University)`, "AUTHORITATIVE REPORT"],
    ["Source Status", meta.sourceStatus, "UNDER INVESTIGATION"],
    ["External Attribution", meta.externalAttributionHypothesis.vesselName, "REPORTED LIKELY SOURCE"],
    ["Vessel Type", meta.externalAttributionHypothesis.vesselType, "REPORTED IDENTIFIER"],
    ["MMSI / IMO", `${meta.externalAttributionHypothesis.mmsi} / ${meta.externalAttributionHypothesis.imo}`, "UNKNOWN (NOT IN REPORT)"],
    ["System Confirmation", "NOT ESTABLISHED (EXTERNAL HYPOTHESIS)", "CAUTIONARY SAFEGUARD"],
  ];

  y = drawTable(doc, margin, y, contentWidth, ["PARAMETER", "INCIDENT VALUE", "PROVENANCE CLASS"], snapshotRows, [42, 78, 58]);

  // --- SECTION: INCIDENT SUMMARY & EXTERNAL ATTRIBUTION ---
  y += 4;
  y = drawSectionHeader(doc, margin, y, contentWidth, "2. EXTERNAL ATTRIBUTION & REPORTED CONTEXT");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 50, 55);

  const summaryText =
    "On 14 August 2026, UNU-INWEH published satellite observations identifying a major marine oil pollution event " +
    "in the Strait of Hormuz near Qeshm and Hengam Islands (Iran), observed on 10 August 2026, with an estimated extent " +
    "of approximately 100 km² of contaminated water surface.\n\n" +
    `External Attribution Note: ${meta.externalAttributionHypothesis.summary}\n\n` +
    "IMPORTANT COMPLIANCE STATEMENT: Source attribution is not independently confirmed by this system. " +
    "The identified vessel (Minoan Pioneer) represents an external hypothesis under ongoing investigation. " +
    "This system does not assert independent real-world attribution.";

  const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 4);
  doc.text(splitSummary, margin + 2, y);
  y += splitSummary.length * 4.2 + 6;

  // --- SECTION: INVESTIGATION WORKFLOW ---
  y = drawSectionHeader(doc, margin, y, contentWidth, "3. INVESTIGATION WORKFLOW (CONCEPTUAL PIPELINE)");

  const workflowStages = [
    "1. SATELLITE / SAR DETECTION  [Operational Screening]",
    "2. SPILL REGION EXTRACTION    [Held-Out Candidate Patches]",
    "3. HYDRODYNAMIC BACKTRACKING   [Prototype Simulation Framework]",
    "4. HISTORICAL AIS TRACKS      [Scenario Vessel Analysis]",
    "5. EVIDENCE FUSION            [Multi-Source Feature Alignment]",
    "6. SOURCE ATTRIBUTION         [Relative Scenario Scoring]",
    "7. INVESTIGATOR REVIEW        [Human Review & Verification]",
  ];

  doc.setFillColor(245, 248, 250);
  doc.rect(margin, y, contentWidth, workflowStages.length * 4.8 + 4, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(20, 45, 55);

  workflowStages.forEach((stage, idx) => {
    doc.text(stage, margin + 4, y + 4.5 + idx * 4.8);
  });

  y += workflowStages.length * 4.8 + 10;

  // --- SECTION: DATA PROVENANCE ---
  y = drawSectionHeader(doc, margin, y, contentWidth, "4. DATA PROVENANCE FRAMEWORK");

  const provenanceRows = [
    ["EXTERNAL / REPORTED", "Authoritative facts supported by UNU-INWEH reporting and official disclosures."],
    ["DERIVED", "Quantitative scores and distances calculated from available scenario inputs."],
    ["PROTOTYPE / SYNTHETIC", "TEST_04 scenario coordinates, simulated particle clouds, and prototype vessels."],
    ["UNKNOWN", "Missing fields (e.g. unrecorded MMSI/IMO, live AIS streams) labeled UNKNOWN."],
  ];

  y = drawTable(doc, margin, y, contentWidth, ["PROVENANCE LEVEL", "OPERATIONAL DEFINITION"], provenanceRows, [50, 128]);

  // --- SECTION: LIMITATIONS & REFERENCES ---
  y += 4;
  y = drawSectionHeader(doc, margin, y, contentWidth, "5. SYSTEM LIMITATIONS & CITATIONS");

  const limitations = [
    "• Source attribution is not independently confirmed by this prototype platform.",
    "• Prototype coordinates (TEST_04) represent synthetic testing inputs and are distinct from real incident coordinates.",
    "• Live AIS feed is disconnected; scenario tracks reflect prototype AIS trajectories.",
    `• Reference Citation: UNU-INWEH Official Release (${meta.reportingAgencyUrl}).`,
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(60, 70, 75);

  limitations.forEach((item) => {
    const lines = doc.splitTextToSize(item, contentWidth - 4);
    doc.text(lines, margin + 2, y);
    y += lines.length * 3.8 + 1.2;
  });

  // --- FOOTER ---
  drawFooter(doc, margin, contentWidth, "REAL INCIDENT REVIEW  |  DATA PROVENANCE: EXTERNAL / REPORTED CONTEXT");

  doc.save(`Incident_Review_${meta.caseId}.pdf`);
}

/**
 * Report 2: Prototype Source Attribution Analysis PDF
 * Generates a comprehensive technical report for the active prototype scenario (TEST_04).
 * Surfaces dynamic candidate ranking, spatial/temporal evidence breakdown, hydrodynamic vectors, and forward projections.
 */
export function generatePrototypeAnalysisPdf(
  data: BacktrackingPrototypeData,
  selectedVesselId: string | null,
  currentTime: string,
  timeIndex: number
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const ranked = data.sourceAttribution.slice().sort((a, b) => b.hybridScore - a.hybridScore);
  const selected = selectedVesselId
    ? ranked.find((r) => r.vesselId === selectedVesselId) ?? ranked[0]
    : ranked[0];

  const latestDrift = data.backtrackedTrajectory[0];
  const oldestDrift = data.backtrackedTrajectory[data.backtrackedTrajectory.length - 1];
  const latestEnvironment = data.environment[data.environment.length - 1];

  const forwardDrift6h = latestDrift && data.spillLocation
    ? calculateForwardDrift(
        data.spillLocation.latitude,
        data.spillLocation.longitude,
        latestDrift.driftUMs,
        latestDrift.driftVMs,
        6
      )
    : null;

  const vesselPoints = selected
    ? data.vesselTracks.filter((p) => p.vesselId === selected.vesselId)
    : [];

  const overlapCount = vesselPoints.filter((p) => data.times.includes(p.time)).length;
  const overlapPercent = data.times.length > 0 ? (overlapCount / data.times.length) * 100 : 0;

  const originDistKm = oldestDrift && vesselPoints[0]
    ? haversineKm(vesselPoints[0].latitude, vesselPoints[0].longitude, oldestDrift.latitude, oldestDrift.longitude)
    : null;

  // Page geometry
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // --- HEADER BANNER ---
  doc.setFillColor(10, 24, 30);
  doc.rect(margin, y, contentWidth, 24, "F");

  doc.setTextColor(214, 169, 74);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("OILSPILL INTELLIGENCE  |  TECHNICAL PROTOTYPE ANALYSIS EXPORT", margin + 6, y + 7);

  doc.setTextColor(216, 228, 232);
  doc.setFontSize(12.5);
  doc.text(`PROTOTYPE SOURCE ATTRIBUTION ANALYSIS — SCENARIO ${data.spillLocation?.caseId ?? "TEST_04"}`, margin + 6, y + 15);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(155, 177, 186);
  doc.text(`TIMESTEP: ${timeIndex + 1}/${data.times.length} (${currentTime || "UNKNOWN"})  |  PROVENANCE: PROTOTYPE / DERIVED`, margin + 6, y + 20);

  y += 30;

  // --- SECTION 1: SCENARIO SNAPSHOT ---
  y = drawSectionHeader(doc, margin, y, contentWidth, "1. PROTOTYPE SCENARIO SNAPSHOT");

  const scenarioRows = [
    ["Scenario Identifier", data.spillLocation?.caseId ?? "TEST_04", "PROTOTYPE SCENARIO"],
    ["Observation Time", data.spillLocation?.observationTime ?? "UNKNOWN", "PROTOTYPE INPUT"],
    ["Spill Location (Observed)", data.spillLocation ? `${data.spillLocation.latitude.toFixed(5)} N, ${data.spillLocation.longitude.toFixed(5)} E` : "UNKNOWN", "PROTOTYPE FIXTURE"],
    ["Estimated Release Origin (t-6h)", oldestDrift ? `${oldestDrift.latitude.toFixed(5)} N, ${oldestDrift.longitude.toFixed(5)} E` : "UNKNOWN", "DERIVED DRIFT CENTROID"],
    ["Particle Cloud Volume", `${data.particles.length.toLocaleString("en-US")} particles across ${data.times.length} timesteps`, "PROTOTYPE PARTICLES"],
    ["Candidate Vessels Analyzed", `${ranked.length} scenario tracks (V001 - V005)`, "PROTOTYPE AIS TRACKS"],
    ["Selected Candidate", selected ? `${selected.vesselId} (Rank #1, Scenario Score: ${selected.hybridScore.toFixed(2)})` : "UNKNOWN", "ACTIVE SELECTION"],
  ];

  y = drawTable(doc, margin, y, contentWidth, ["PARAMETER", "SCENARIO VALUE", "PROVENANCE"], scenarioRows, [45, 80, 53]);

  // --- SECTION 2: SELECTED CANDIDATE DETAILED EVIDENCE ---
  y += 4;
  y = drawSectionHeader(doc, margin, y, contentWidth, `2. SELECTED CANDIDATE EVIDENCE: ${selected?.vesselId ?? "UNKNOWN"}`);

  if (selected) {
    const candidateEvidenceRows = [
      ["Derived Scenario Score", `${selected.hybridScore.toFixed(2)} / 100.00`, "DERIVED · FUSED SCENARIO SCORE"],
      ["Trajectory Alignment Score", `${selected.trajectoryScore.toFixed(2)} / 100.00`, "DERIVED · DRIFT PATH ALIGNMENT"],
      ["Direct Separation Distance", `${selected.directDistanceKm.toFixed(2)} km (to observed slick)`, "DERIVED · GEODESIC SEPARATION"],
      ["Minimum Track Approach", `${selected.minimumDistanceKm.toFixed(2)} km (to backtracked path)`, "DERIVED · CLOSEST POINT"],
      ["Average Track Separation", `${selected.averageDistanceKm.toFixed(2)} km`, "DERIVED · MEAN PATH DISTANCE"],
      ["Release Origin Proximity (t-6h)", originDistKm !== null ? `${originDistKm.toFixed(2)} km` : "UNKNOWN", "DERIVED · T-6H DISTANCE"],
      ["Temporal Coincidence", `${overlapCount}/${data.times.length} fixes (${overlapPercent.toFixed(0)}% window overlap)`, "DERIVED · TEMPORAL FIXES"],
      ["Spatial Geometry Type", "LineString (No polygon slick mask in CSV)", "INSUFFICIENT GEOMETRY"],
    ];

    y = drawTable(doc, margin, y, contentWidth, ["EVIDENCE DIMENSION", "COMPUTED VALUE", "PROVENANCE CLASS"], candidateEvidenceRows, [48, 77, 53]);

    // Rationale narrative
    y += 3;
    doc.setFillColor(245, 248, 250);
    doc.rect(margin, y, contentWidth, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(155, 119, 53);
    doc.text("ATTRIBUTION RATIONALE (SCENARIO EVIDENCE):", margin + 4, y + 4.5);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 50, 55);
    const rationale = describeRationale(selected);
    const splitRationale = doc.splitTextToSize(rationale, contentWidth - 8);
    doc.text(splitRationale, margin + 4, y + 8.5);

    y += 18;
  }

  // --- SECTION 3: CANDIDATE COMPARISON RANKING TABLE ---
  y = drawSectionHeader(doc, margin, y, contentWidth, "3. CANDIDATE VESSEL RANKING & PROXIMITY COMPARISON");

  const comparisonHeaders = ["RANK", "VESSEL ID", "SCENARIO SCORE", "TRAJECTORY", "DIRECT DIST", "MIN DIST", "PROVENANCE"];
  const comparisonRows = ranked.map((record, idx) => [
    `#${idx + 1}`,
    record.vesselId,
    record.hybridScore.toFixed(2),
    record.trajectoryScore.toFixed(2),
    `${record.directDistanceKm.toFixed(2)} km`,
    `${record.minimumDistanceKm.toFixed(2)} km`,
    "PROTOTYPE VESSEL",
  ]);

  y = drawTable(doc, margin, y, contentWidth, comparisonHeaders, comparisonRows, [16, 24, 28, 26, 28, 28, 28]);

  // Check if we need to add a second page for remaining sections
  if (y > 220) {
    doc.addPage();
    y = 18;
  }

  // --- SECTION 4: HYDRODYNAMIC TRANSPORT & FORWARD PROJECTIONS ---
  y += 4;
  y = drawSectionHeader(doc, margin, y, contentWidth, "4. HYDRODYNAMIC TRANSPORT & FORWARD PROJECTIONS");

  const transportRows = [
    ["Hydrodynamic Transport Model", "Voil = Vcurrent + 0.03 * Vwind", "PROTOTYPE MODEL"],
    ["Wind Vector (U / V)", latestEnvironment ? `${latestEnvironment.windUMs.toFixed(2)} / ${latestEnvironment.windVMs.toFixed(2)} m/s` : "UNKNOWN", "PROTOTYPE INPUT"],
    ["Current Vector (U / V)", latestEnvironment ? `${latestEnvironment.currentUMs.toFixed(2)} / ${latestEnvironment.currentVMs.toFixed(2)} m/s` : "UNKNOWN", "PROTOTYPE INPUT"],
    ["Net Oil Drift Velocity", latestDrift ? `${latestDrift.driftUMs.toFixed(3)} / ${latestDrift.driftVMs.toFixed(3)} m/s (${(Math.hypot(latestDrift.driftUMs, latestDrift.driftVMs) * 1.94384).toFixed(2)} kts)` : "UNKNOWN", "DERIVED METOCEAN VECTOR"],
    ["+6h Forward Drift Projection", forwardDrift6h ? `${forwardDrift6h.lat.toFixed(4)} N, ${forwardDrift6h.lng.toFixed(4)} E (+${forwardDrift6h.distKm.toFixed(1)} km)` : "UNKNOWN", "DERIVED FROM ACTIVE VECTOR"],
    ["+12h / +24h / +48h Projections", "INSUFFICIENT FORECAST DATA (Forecast inputs not supplied)", "INSUFFICIENT DATA"],
  ];

  y = drawTable(doc, margin, y, contentWidth, ["METOCEAN FACTOR", "VALUE / STATUS", "PROVENANCE"], transportRows, [48, 80, 50]);

  // --- SECTION 5: ANALYSIS INTERPRETATION ---
  y += 4;
  y = drawSectionHeader(doc, margin, y, contentWidth, "5. SCIENTIFIC INTERPRETATION & DISCLAIMER");

  const disclaimerText =
    "The scenario ranking produced by this prototype is a relative evidence-fusion indicator derived strictly from " +
    "the available synthetic inputs (TEST_04). It reflects geometric proximity and hydrodynamic trajectory alignment " +
    "within the simulation boundary. It DOES NOT represent a confirmed real-world probability of source responsibility and " +
    "does not independently confirm the actual source of the Qeshm/Hengam oil pollution event.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 65);
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth - 4);
  doc.text(splitDisclaimer, margin + 2, y);
  // --- FOOTER ---
  drawFooter(doc, margin, contentWidth, "PROTOTYPE SOURCE ATTRIBUTION ANALYSIS  |  DATA PROVENANCE: PROTOTYPE / DERIVED DATA");

  doc.save(`Prototype_Analysis_${data.spillLocation?.caseId ?? "TEST_04"}_${selected?.vesselId ?? "Summary"}.pdf`);
}

/* ==========================================================
   HELPER UTILITIES FOR CLEAN VECTOR PDF DRAWING
========================================================== */

function drawSectionHeader(doc: jsPDF, x: number, y: number, width: number, title: string): number {
  doc.setFillColor(235, 240, 244);
  doc.rect(x, y - 4, width, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 35, 45);
  doc.text(title, x + 2, y);

  return y + 4;
}

function drawTable(
  doc: jsPDF,
  startX: number,
  startY: number,
  totalWidth: number,
  headers: string[],
  rows: string[][],
  colWidths: number[]
): number {
  let curY = startY;

  // Header Row
  doc.setFillColor(15, 35, 45);
  doc.rect(startX, curY, totalWidth, 5.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);

  let curX = startX;
  headers.forEach((h, idx) => {
    doc.text(h, curX + 2, curY + 3.8);
    curX += colWidths[idx] ?? 30;
  });

  curY += 5.5;

  // Data Rows
  rows.forEach((row, rowIdx) => {
    const isEven = rowIdx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(startX, curY, totalWidth, 5, "F");

    // Row borders
    doc.setDrawColor(220, 228, 232);
    doc.line(startX, curY + 5, startX + totalWidth, curY + 5);

    curX = startX;
    row.forEach((cell, cellIdx) => {
      doc.setFont("helvetica", cellIdx === 0 ? "bold" : "normal");
      doc.setFontSize(7);
      doc.setTextColor(30, 40, 45);

      // Truncate if too long
      const text = doc.splitTextToSize(cell, (colWidths[cellIdx] ?? 30) - 4)[0] ?? "";
      doc.text(text, curX + 2, curY + 3.6);
      curX += colWidths[cellIdx] ?? 30;
    });

    curY += 5;
  });

  return curY + 2;
}

function drawFooter(doc: jsPDF, margin: number, contentWidth: number, provenanceNote: string): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerY = pageHeight - 12;

  doc.setDrawColor(180, 195, 202);
  doc.line(margin, footerY - 2, margin + contentWidth, footerY - 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(70, 85, 95);
  doc.text("OILSPILL INTELLIGENCE  |  SATELLITE OIL-SPILL ATTRIBUTION PLATFORM", margin, footerY + 2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(110, 125, 135);
  doc.text(provenanceNote, margin, footerY + 6);
  doc.text(`CONFIDENTIAL TECHNICAL ASSESSMENT  |  PAGE ${doc.getCurrentPageInfo().pageNumber}`, margin + contentWidth - 62, footerY + 2);
}

function describeRationale(record: SourceAttributionRecord): string {
  if (record.hybridScore >= 80) {
    return `${record.vesselId} ranks #1 in scenario alignment (${record.hybridScore.toFixed(2)}) due to strong proximity to the observed spill (${record.directDistanceKm.toFixed(2)} km) and minimum drift path approach of ${record.minimumDistanceKm.toFixed(2)} km.`;
  }
  if (record.trajectoryScore >= 80) {
    return `${record.vesselId} displays high trajectory alignment (${record.trajectoryScore.toFixed(2)}) with closest approach of ${record.minimumDistanceKm.toFixed(2)} km, but larger direct distance (${record.directDistanceKm.toFixed(2)} km) from observed slick.`;
  }
  return `${record.vesselId} shows moderate scenario proximity (${record.hybridScore.toFixed(2)}) with ${record.minimumDistanceKm.toFixed(2)} km minimum approach and ${record.directDistanceKm.toFixed(2)} km direct separation.`;
}

function calculateForwardDrift(
  lat: number,
  lng: number,
  uMs: number,
  vMs: number,
  hours: number
): { lat: number; lng: number; distKm: number } {
  const seconds = hours * 3600;
  const deltaXMeters = uMs * seconds;
  const deltaYMeters = vMs * seconds;
  const distKm = Math.hypot(deltaXMeters, deltaYMeters) / 1000;

  const latDegPerKm = 1 / 110.7;
  const lngDegPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

  const newLat = lat + (deltaYMeters / 1000) * latDegPerKm;
  const newLng = lng + (deltaXMeters / 1000) * lngDegPerKm;

  return { lat: newLat, lng: newLng, distKm };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
