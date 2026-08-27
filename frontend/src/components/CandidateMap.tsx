import { useEffect, useMemo, useRef } from "react";
import { LngLatBounds, Map, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Point } from "geojson";
import type { Candidate } from "../types/candidates";
import { formatCoordinate, formatDecimal } from "../utils/format";

setWorkerUrl(workerUrl);

type CandidateMapProps = {
  candidates: Candidate[];
  selectedCandidateId: string | null;
  onSelect: (candidateId: string) => void;
};

export default function CandidateMap({
  candidates,
  selectedCandidateId,
  onSelect,
}: CandidateMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  const candidatePatchFeatures = useMemo<FeatureCollection<Point>>(() => {
    const maxScore = Math.max(...candidates.map((candidate) => candidate.finalFusionScore), 1);

    return {
      type: "FeatureCollection",
      features: candidates.flatMap((candidate) =>
        buildCandidatePatchFeatures(
          candidate,
          candidate.finalFusionScore / maxScore,
          candidate.candidateId === selectedCandidateId
        )
      ),
    };
  }, [candidates, selectedCandidateId]);

  const candidateLabelFeatures = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: candidates.map((candidate): Feature<Point> => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [candidate.longitude, candidate.latitude],
        },
        properties: {
          candidateId: candidate.candidateId,
          rank: candidate.rank,
          split: candidate.split,
          scene: candidate.scene,
          acquisitionDate: candidate.acquisitionDate,
          score: candidate.finalFusionScore,
          selected: candidate.candidateId === selectedCandidateId,
          latitude: candidate.latitude,
          longitude: candidate.longitude,
        },
      })),
    }),
    [candidates, selectedCandidateId]
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const first = candidates[0];
    const map = new Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: first ? [first.longitude, first.latitude] : [71.5, 20.0],
      zoom: 7.2,
      minZoom: 3,
      maxZoom: 14,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");

    map.on("load", () => {
      const gridFeatures = [];
      for (let lng = 70; lng <= 73; lng += 0.1) {
        gridFeatures.push({
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: [[lng, 19.5], [lng, 20.4]] },
          properties: {},
        });
      }
      for (let lat = 19.5; lat <= 20.4; lat += 0.1) {
        gridFeatures.push({
          type: "Feature" as const,
          geometry: { type: "LineString" as const, coordinates: [[70, lat], [73, lat]] },
          properties: {},
        });
      }

      map.addSource("candidate-grid", {
        type: "geojson",
        data: { type: "FeatureCollection", features: gridFeatures },
      });
      map.addLayer({
        id: "candidate-grid-layer",
        type: "line",
        source: "candidate-grid",
        paint: {
          "line-color": "#173039",
          "line-width": 1,
          "line-opacity": 0.36,
        },
      });

      map.addSource("candidate-patches", {
        type: "geojson",
        data: candidatePatchFeatures,
      });

      map.addSource("candidate-label-points", {
        type: "geojson",
        data: candidateLabelFeatures,
      });

      map.addLayer({
        id: "candidate-patch-glow",
        type: "circle",
        source: "candidate-patches",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "scoreRatio"],
            0,
            ["*", ["get", "size"], 1.2],
            1,
            ["*", ["get", "size"], 1.9],
          ],
          "circle-color": [
            "case",
            ["==", ["get", "selected"], true],
            "#FF7B50",
            "#69B7D1",
          ],
          "circle-opacity": [
            "case",
            ["==", ["get", "selected"], true],
            ["*", ["get", "opacity"], 0.42],
            ["*", ["get", "opacity"], 0.2],
          ],
          "circle-blur": 0.72,
        },
      });

      map.addLayer({
        id: "candidate-patch-particles",
        type: "circle",
        source: "candidate-patches",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "scoreRatio"],
            0,
            ["get", "size"],
            1,
            ["*", ["get", "size"], 1.32],
          ],
          "circle-color": [
            "case",
            ["==", ["get", "selected"], true],
            "#FF8A54",
            "#75C9E8",
          ],
          "circle-opacity": [
            "case",
            ["==", ["get", "selected"], true],
            ["interpolate", ["linear"], ["get", "opacity"], 0, 0.16, 1, 1],
            ["get", "opacity"],
          ],
          "circle-stroke-color": ["case", ["==", ["get", "selected"], true], "#3b100c", "#061419"],
          "circle-stroke-width": ["case", ["==", ["get", "selected"], true], 0.65, 0.35],
        },
      });

      map.addLayer({
        id: "candidate-labels",
        type: "symbol",
        source: "candidate-label-points",
        layout: {
          "text-field": ["concat", ["upcase", ["get", "split"]], " #", ["to-string", ["get", "rank"]]],
          "text-size": 10,
          "text-offset": [0, 1.75],
          "text-anchor": "top",
          "text-font": ["Metropolis Regular", "sans-serif"],
          "text-allow-overlap": false,
          "text-ignore-placement": false,
        },
        paint: {
          "text-color": "#d8e4e8",
          "text-halo-color": "#061419",
          "text-halo-width": 1.5,
        },
      });

      map.on("click", "candidate-patch-particles", handleMapClick);
      map.on("mouseenter", "candidate-patch-particles", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "candidate-patch-particles", () => {
        map.getCanvas().style.cursor = "";
      });

      fitMapToCandidates(map, candidates);
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const patchSource = map.getSource("candidate-patches") as GeoJSONSource | undefined;
    const labelSource = map.getSource("candidate-label-points") as GeoJSONSource | undefined;
    patchSource?.setData(candidatePatchFeatures);
    labelSource?.setData(candidateLabelFeatures);
    fitMapToCandidates(map, candidates);
  }, [candidatePatchFeatures, candidateLabelFeatures, candidates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedCandidateId) return;
    const selected = candidates.find((candidate) => candidate.candidateId === selectedCandidateId);
    if (!selected) return;

    map.flyTo({
      center: [selected.longitude, selected.latitude],
      zoom: Math.max(map.getZoom(), 8.5),
      essential: true,
      duration: 850,
    });
  }, [selectedCandidateId, candidates]);

  const selected = candidates.find((candidate) => candidate.candidateId === selectedCandidateId);

  return (
    <section className="map-wrapper detection-map-wrapper">
      <div className="map-overlay-title">
        <span className="title-muted">MAP / TILE CENTRE POINTS</span>
        <strong className="title-highlight">Held-Out Candidate Regions</strong>
        <span className="title-note">Points represent tile centres, not slick polygons.</span>
      </div>
      <div className="map-coordinates">
        {selected
          ? `${formatCoordinate(selected.latitude)} N ${formatCoordinate(selected.longitude)} E`
          : "No candidate selected"}
      </div>
      <div ref={mapContainer} className="map-container" />
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#69B7D1" }} />
          <span>TEST SPLIT</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#D83B8C" }} />
          <span>VALIDATION SPLIT</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#FF6B6B" }} />
          <span>SELECTED CANDIDATE</span>
        </div>
        <div className="legend-item">
          <span>Relative review priority - not probability.</span>
        </div>
        <div className="legend-item">
          <span>Candidate patch marker: stylized tile-centre symbol, not georeferenced slick polygon.</span>
        </div>
      </div>
    </section>
  );

  function handleMapClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    const candidateId = feature?.properties?.candidateId;
    if (typeof candidateId !== "string" || feature?.geometry.type !== "Point") return;

    const candidate = candidates.find((item) => item.candidateId === candidateId);
    if (!candidate) return;

    onSelectRef.current(candidateId);
    popupRef.current?.remove();
    popupRef.current = new Popup({
      closeButton: true,
      closeOnClick: true,
      className: "custom-map-popup",
    })
      .setLngLat([candidate.longitude, candidate.latitude])
      .setHTML(
        `<div class="map-popup-content">` +
          `<strong>${escapeHtml(candidate.split.toUpperCase())} rank ${candidate.rank}</strong>` +
          `<span>${escapeHtml(candidate.acquisitionDate)}</span>` +
          `<span>${formatCoordinate(candidate.latitude)}, ${formatCoordinate(candidate.longitude)}</span>` +
          `<span>Review Priority Score: ${formatDecimal(candidate.finalFusionScore)}</span>` +
        `</div>`
      )
      .addTo(mapRef.current!);
  }
}

function buildCandidatePatchFeatures(
  candidate: Candidate,
  scoreRatio: number,
  selected: boolean
): Feature<Point>[] {
  const seed = hashString(candidate.candidateId);
  const particleCount = 6 + (seed % 9);
  const compactScale = 0.0019 + Math.min(1, scoreRatio) * 0.0009;
  const features: Feature<Point>[] = [];

  for (let index = 0; index < particleCount; index += 1) {
    const angle = seededUnit(seed, index * 7 + 1) * Math.PI * 2;
    const radius = (0.2 + seededUnit(seed, index * 7 + 2) * 0.95) * compactScale;
    const stretch = 0.55 + seededUnit(seed, index * 7 + 3) * 0.65;
    const lngOffset = Math.cos(angle) * radius * stretch;
    const latOffset = Math.sin(angle) * radius * (1.35 - stretch * 0.35);
    const size = 1.45 + seededUnit(seed, index * 7 + 4) * 2.3;
    const opacity = 0.36 + seededUnit(seed, index * 7 + 5) * 0.38 + scoreRatio * 0.16;

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [candidate.longitude + lngOffset, candidate.latitude + latOffset],
      },
      properties: {
        candidateId: candidate.candidateId,
        rank: candidate.rank,
        split: candidate.split,
        scene: candidate.scene,
        acquisitionDate: candidate.acquisitionDate,
        score: candidate.finalFusionScore,
        scoreRatio,
        selected,
        size,
        opacity: Math.min(0.94, opacity),
      },
    });
  }

  return features;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number, salt: number): number {
  let value = seed + Math.imul(salt + 1, 374761393);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function fitMapToCandidates(map: Map, candidates: Candidate[]): void {
  if (candidates.length === 0) return;
  const bounds = new LngLatBounds();
  candidates.forEach((candidate) => bounds.extend([candidate.longitude, candidate.latitude]));
  if (bounds.isEmpty()) return;
  map.fitBounds(bounds, {
    padding: { top: 100, right: 120, bottom: 100, left: 80 },
    maxZoom: 9.8,
    duration: 0,
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}
