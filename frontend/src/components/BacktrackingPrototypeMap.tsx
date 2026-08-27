import { useEffect, useMemo, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type {
  BacktrackingParticle,
  BacktrackingPrototypeData,
  VesselTrackPoint,
} from "../types/backtracking";

setWorkerUrl(workerUrl);

type BacktrackingPrototypeMapProps = {
  data: BacktrackingPrototypeData;
  selectedVesselId: string | null;
  onSelectVessel: (vesselId: string | null) => void;
};

export default function BacktrackingPrototypeMap({
  data,
  selectedVesselId,
  onSelectVessel,
}: BacktrackingPrototypeMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const [timeIndex, setTimeIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    particles: true,
    backtrack: true,
    vesselTracks: true,
    highRisk: true,
  });
  const onSelectVesselRef = useRef(onSelectVessel);
  const times = data.times;
  const currentTime = times[timeIndex] ?? times[0] ?? "";
  const currentParticles = useMemo(
    () => data.particles.filter((particle) => particle.time === currentTime),
    [data.particles, currentTime]
  );
  const peakLikelihood = currentParticles.reduce(
    (peak, particle) => Math.max(peak, particle.likelihood),
    0
  );

  useEffect(() => {
    onSelectVesselRef.current = onSelectVessel;
  }, [onSelectVessel]);

  useEffect(() => {
    if (!playing || times.length <= 1) return;
    const timer = window.setInterval(() => {
      setTimeIndex((value) => (value + 1) % times.length);
    }, 850);
    return () => window.clearInterval(timer);
  }, [playing, times.length]);

  const particleData = useMemo(
    () => particlesToGeoJson(currentParticles),
    [currentParticles]
  );

  const highRiskData = useMemo(
    () => particlesToGeoJson(data.probabilityPoints.filter((particle) => particle.likelihood >= 0.72)),
    [data.probabilityPoints]
  );

  const vesselTrackData = useMemo(
    () => vesselTracksToGeoJson(data.vesselTracks, selectedVesselId),
    [data.vesselTracks, selectedVesselId]
  );

  const backtrackData = useMemo<FeatureCollection<LineString>>(
    () => ({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: data.backtrackedTrajectory
              .slice()
              .sort((a, b) => a.time.localeCompare(b.time))
              .map((point) => [point.longitude, point.latitude]),
          },
          properties: {},
        },
      ],
    }),
    [data.backtrackedTrajectory]
  );

  const spillData = useMemo<FeatureCollection<Point>>(
    () => ({
      type: "FeatureCollection",
      features: data.spillLocation
        ? [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [data.spillLocation.longitude, data.spillLocation.latitude],
              },
              properties: {
                caseId: data.spillLocation.caseId,
                observationTime: data.spillLocation.observationTime,
              },
            },
          ]
        : [],
    }),
    [data.spillLocation]
  );

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const center = data.spillLocation
      ? [data.spillLocation.longitude, data.spillLocation.latitude]
      : [70.08, 19.6];

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: center as [number, number],
      zoom: 8,
      minZoom: 4,
      maxZoom: 14,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");

    map.on("load", () => {
      map.addSource("prototype-vessel-tracks", { type: "geojson", data: vesselTrackData });
      map.addSource("prototype-backtrack", { type: "geojson", data: backtrackData });
      map.addSource("prototype-particles", { type: "geojson", data: particleData });
      map.addSource("prototype-high-risk", { type: "geojson", data: highRiskData });
      map.addSource("prototype-spill", { type: "geojson", data: spillData });

      map.addSource("prototype-grid", {
        type: "geojson",
        data: buildGrid(data),
      });

      map.addLayer({
        id: "prototype-grid",
        type: "line",
        source: "prototype-grid",
        paint: {
          "line-color": "#173039",
          "line-width": 1,
          "line-opacity": 0.34,
        },
      });

      map.addLayer({
        id: "prototype-vessel-tracks",
        type: "line",
        source: "prototype-vessel-tracks",
        paint: {
          "line-color": ["case", ["==", ["get", "selected"], true], "#D6A94A", "#69B7D1"],
          "line-width": ["case", ["==", ["get", "selected"], true], 2.2, 1.1],
          "line-opacity": ["case", ["==", ["get", "selected"], true], 0.95, 0.42],
        },
      });

      map.addLayer({
        id: "prototype-backtrack",
        type: "line",
        source: "prototype-backtrack",
        paint: {
          "line-color": "#FF6B6B",
          "line-width": 2.4,
          "line-opacity": 0.9,
          "line-dasharray": [0, 2, 2],
        },
      });

      map.addLayer({
        id: "prototype-backtrack-arrows",
        type: "symbol",
        source: "prototype-backtrack",
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 52,
          "text-field": ">",
          "text-size": 14,
          "text-keep-upright": false,
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#FF6B6B",
          "text-halo-color": "#061419",
          "text-halo-width": 1.5,
        },
      });

      map.addLayer({
        id: "prototype-backtrack-label",
        type: "symbol",
        source: "prototype-backtrack",
        layout: {
          "symbol-placement": "line-center",
          "text-field": "Backtracked drift path",
          "text-size": 11,
          "text-offset": [0, -1.2],
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#FFB49F",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      map.addLayer({
        id: "prototype-high-risk-glow",
        type: "circle",
        source: "prototype-high-risk",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 5, 1, 9],
          "circle-color": "#ff765c",
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 0.08, 1, 0.28],
          "circle-blur": 0.78,
        },
      });

      map.addLayer({
        id: "prototype-high-risk",
        type: "circle",
        source: "prototype-high-risk",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 2.2, 1, 4],
          "circle-color": "#ffcf66",
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 0.26, 1, 0.72],
          "circle-blur": 0.16,
        },
      });

      map.addLayer({
        id: "prototype-particle-glow",
        type: "circle",
        source: "prototype-particles",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0, 2, 0.72, 5.5, 1, 8],
          "circle-color": ["interpolate", ["linear"], ["get", "likelihood"], 0, "#4aa9d8", 0.7, "#d6a94a", 1, "#ff765c"],
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0, 0, 0.72, 0.18, 1, 0.42],
          "circle-blur": 0.72,
        },
      });

      map.addLayer({
        id: "prototype-particles",
        type: "circle",
        source: "prototype-particles",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0, 2, 0.5, 3.2, 1, 5],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "likelihood"],
            0,
            "#4aa9d8",
            0.5,
            "#bf8f4e",
            1,
            "#ffcf66",
          ],
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0, 0.1, 0.5, 0.42, 1, 1],
          "circle-blur": ["interpolate", ["linear"], ["get", "likelihood"], 0, 0.72, 1, 0.06],
        },
      });

      map.addLayer({
        id: "prototype-spill",
        type: "circle",
        source: "prototype-spill",
        paint: {
          "circle-radius": 6,
          "circle-color": "#D6A94A",
          "circle-stroke-color": "#061419",
          "circle-stroke-width": 2,
        },
      });

      map.addLayer({
        id: "prototype-spill-label",
        type: "symbol",
        source: "prototype-spill",
        layout: {
          "text-field": "Observed spill location",
          "text-size": 10,
          "text-offset": [0, 1.35],
          "text-anchor": "top",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#D6A94A",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      map.on("click", "prototype-vessel-tracks", handleVesselTrackClick);
      map.on("mouseenter", "prototype-vessel-tracks", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "prototype-vessel-tracks", () => {
        map.getCanvas().style.cursor = "";
      });

      fitMap(map, data);
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
    (map.getSource("prototype-particles") as GeoJSONSource | undefined)?.setData(particleData);
  }, [particleData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const dashFrames = [
      [0, 2, 2],
      [1, 2, 2],
      [2, 2, 2],
    ];
    let frame = 0;
    const timer = window.setInterval(() => {
      if (map.getLayer("prototype-backtrack")) {
        map.setPaintProperty("prototype-backtrack", "line-dasharray", dashFrames[frame]);
        frame = (frame + 1) % dashFrames.length;
      }
    }, 420);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("prototype-vessel-tracks") as GeoJSONSource | undefined)?.setData(vesselTrackData);
  }, [vesselTrackData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    setLayerVisibility(map, ["prototype-particles", "prototype-particle-glow"], visibleLayers.particles);
    setLayerVisibility(
      map,
      ["prototype-backtrack", "prototype-backtrack-arrows", "prototype-backtrack-label"],
      visibleLayers.backtrack
    );
    setLayerVisibility(map, ["prototype-vessel-tracks"], visibleLayers.vesselTracks);
    setLayerVisibility(map, ["prototype-high-risk", "prototype-high-risk-glow"], visibleLayers.highRisk);
  }, [visibleLayers]);

  return (
    <section className="backtracking-map-shell">
      <div className="map-overlay-title">
        <span className="title-muted">BACKTRACKING SIMULATION / SOURCE ANALYSIS</span>
        <strong className="title-highlight">Drift Source Projection</strong>
        <span className="title-note">Scenario particles are not SAR detection candidates.</span>
      </div>

      <div className="map-coordinates prototype-time-readout">
        Step {timeIndex + 1}/{times.length} - {currentTime || "No timestamp supplied"}
      </div>

      <div ref={mapContainer} className="map-container" />

      <section className="prototype-summary-card" aria-label="Current timestep summary">
        <span className="panel-kicker">CURRENT TIMESTEP</span>
        <dl className="detail-grid">
          <div>
            <dt>Step</dt>
            <dd>{timeIndex + 1}/{times.length}</dd>
          </div>
          <div>
            <dt>Timestamp</dt>
            <dd>{currentTime || "Not supplied"}</dd>
          </div>
          <div>
            <dt>Particles shown</dt>
            <dd>{currentParticles.length.toLocaleString("en-US")}</dd>
          </div>
          <div>
            <dt>Peak likelihood</dt>
            <dd>{peakLikelihood.toFixed(3)}</dd>
          </div>
          <div>
            <dt>Observed spill time</dt>
            <dd>{formatObservedSpillDate()}</dd>
          </div>
        </dl>
        <p>Particles show prototype backtracking likelihood, not SAR detection candidates.</p>
      </section>

      <section className="prototype-layer-toggles" aria-label="Backtracking map layers">
        <span className="panel-kicker">LAYERS</span>
        {[
          ["particles", "Source particles"],
          ["backtrack", "Backtracked path"],
          ["vesselTracks", "Vessel tracks"],
          ["highRisk", "High-risk zone"],
        ].map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={visibleLayers[key as keyof typeof visibleLayers]}
              onChange={(event) =>
                setVisibleLayers((value) => ({
                  ...value,
                  [key]: event.target.checked,
                }))
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </section>

      <div className="prototype-time-controls">
        <button className="console-button action" type="button" onClick={() => setPlaying((value) => !value)}>
          {playing ? "Pause" : "Play"}
        </button>
        <input
          aria-label="Backtracking particle time"
          type="range"
          min="0"
          max={Math.max(0, times.length - 1)}
          value={timeIndex}
          onChange={(event) => {
            setPlaying(false);
            setTimeIndex(Number(event.target.value));
          }}
        />
        <span>{timeIndex + 1}/{times.length}</span>
      </div>

      <div className="map-legend prototype-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#4aa9d8" }} />
          <span>LOW: faint drift source likelihood</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#bf8f4e" }} />
          <span>MEDIUM: clustered likelihood support</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#ffcf66" }} />
          <span>HIGH: brighter projected source likelihood</span>
        </div>
        <div className="legend-item prototype-legend-note">
          <span>Particle density shows scenario likelihood, not confirmed source probability or SAR candidates.</span>
        </div>
      </div>
    </section>
  );

  function handleVesselTrackClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    const vesselId = feature?.properties?.vesselId;
    if (typeof vesselId !== "string") return;

    onSelectVesselRef.current(vesselId);
    popupRef.current?.remove();
    popupRef.current = new Popup({
      closeButton: true,
      closeOnClick: true,
      className: "custom-map-popup",
    })
      .setLngLat(event.lngLat)
      .setHTML(
          `<div class="map-popup-content">` +
          `<strong>${escapeHtml(vesselId)}</strong>` +
          `<span>Scenario vessel trajectory</span>` +
          `<span>Ranked vessel proximity for source analysis</span>` +
        `</div>`
      )
      .addTo(mapRef.current!);
  }

  function formatObservedSpillDate(): string {
    return data.spillLocation ? "12/08/2019" : "Not supplied";
  }
}

function particlesToGeoJson(particles: BacktrackingParticle[]): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: particles.map((particle): Feature<Point> => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [particle.longitude, particle.latitude],
      },
      properties: {
        time: particle.time,
        likelihood: particle.likelihood,
      },
    })),
  };
}

function vesselTracksToGeoJson(
  points: VesselTrackPoint[],
  selectedVesselId: string | null
): FeatureCollection<LineString> {
  const byVessel = new globalThis.Map<string, VesselTrackPoint[]>();
  points.forEach((point) => {
    byVessel.set(point.vesselId, [...(byVessel.get(point.vesselId) ?? []), point]);
  });

  return {
    type: "FeatureCollection",
    features: Array.from(byVessel.entries()).map(([vesselId, vesselPoints]) => ({
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: vesselPoints
          .slice()
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((point) => [point.longitude, point.latitude]),
      },
      properties: {
        vesselId,
        selected: vesselId === selectedVesselId,
      },
    })),
  };
}

function fitMap(map: MapLibreMap, data: BacktrackingPrototypeData): void {
  const bounds = new LngLatBounds();
  data.particles.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  data.vesselTracks.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  data.backtrackedTrajectory.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  if (data.spillLocation) bounds.extend([data.spillLocation.longitude, data.spillLocation.latitude]);
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: { top: 105, right: 80, bottom: 120, left: 70 },
      maxZoom: 10,
      duration: 0,
    });
  }
}

function buildGrid(data: BacktrackingPrototypeData): FeatureCollection<LineString> {
  const bounds = new LngLatBounds();
  data.particles.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  data.vesselTracks.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  data.backtrackedTrajectory.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  if (data.spillLocation) bounds.extend([data.spillLocation.longitude, data.spillLocation.latitude]);

  if (bounds.isEmpty()) {
    return { type: "FeatureCollection", features: [] };
  }

  const west = Math.floor(bounds.getWest() * 10) / 10;
  const east = Math.ceil(bounds.getEast() * 10) / 10;
  const south = Math.floor(bounds.getSouth() * 10) / 10;
  const north = Math.ceil(bounds.getNorth() * 10) / 10;
  const features: Feature<LineString>[] = [];

  for (let lng = west; lng <= east; lng += 0.05) {
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[lng, south], [lng, north]] },
      properties: {},
    });
  }

  for (let lat = south; lat <= north; lat += 0.05) {
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates: [[west, lat], [east, lat]] },
      properties: {},
    });
  }

  return { type: "FeatureCollection", features };
}

function setLayerVisibility(map: MapLibreMap, layerIds: string[], visible: boolean): void {
  layerIds.forEach((layerId) => {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
    }
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
