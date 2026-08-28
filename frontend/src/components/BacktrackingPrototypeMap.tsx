import { useEffect, useMemo, useRef, useState } from "react";
import { LngLatBounds, Map as MapLibreMap, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import type { GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import type {
  BacktrackingParticle,
  BacktrackingPrototypeData,
  BacktrackingTrajectoryPoint,
  VesselTrackPoint,
} from "../types/backtracking";
import { QESHM_INCIDENT_METADATA } from "../constants/qeshmIncident";
import ProvenanceTag from "./ProvenanceTag";

setWorkerUrl(workerUrl);

type BacktrackingPrototypeMapProps = {
  data: BacktrackingPrototypeData;
  selectedVesselId: string | null;
  onSelectVessel: (vesselId: string | null) => void;
  timeIndex?: number;
  onTimeIndexChange?: (index: number) => void;
};

export default function BacktrackingPrototypeMap({
  data,
  selectedVesselId,
  onSelectVessel,
  timeIndex: timeIndexProp,
  onTimeIndexChange: onTimeIndexChangeProp,
}: BacktrackingPrototypeMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const [internalTimeIndex, setInternalTimeIndex] = useState(0);
  const timeIndex = timeIndexProp !== undefined ? timeIndexProp : internalTimeIndex;
  const setTimeIndex = (updater: number | ((prev: number) => number)) => {
    if (typeof updater === "function") {
      const nextVal = updater(timeIndex);
      if (onTimeIndexChangeProp) onTimeIndexChangeProp(nextVal);
      else setInternalTimeIndex(nextVal);
    } else {
      if (onTimeIndexChangeProp) onTimeIndexChangeProp(updater);
      else setInternalTimeIndex(updater);
    }
  };

  const [playing, setPlaying] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState({
    particles: true,
    backtrack: true,
    vesselTracks: true,
    highRisk: true,
    forwardDrift: true,
  });
  const onSelectVesselRef = useRef(onSelectVessel);
  const times = data.times;
  const currentTime = times[timeIndex] ?? times[0] ?? "";

  // Always keep a ref to the latest timeIndex so the playback interval never
  // captures a stale value through the setTimeIndex closure.
  const timeIndexRef = useRef(timeIndex);
  useEffect(() => {
    timeIndexRef.current = timeIndex;
  });

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
      // Wrap around after the last step for continuous looping.
      const next = (timeIndexRef.current + 1) % times.length;
      if (onTimeIndexChangeProp) onTimeIndexChangeProp(next);
      else setInternalTimeIndex(next);
    }, 850);
    return () => window.clearInterval(timer);
  }, [playing, times.length, onTimeIndexChangeProp]);

  const particleData = useMemo(
    () => particlesToGeoJson(currentParticles),
    [currentParticles]
  );

  const highRiskData = useMemo(
    () =>
      particlesToGeoJson(
        currentParticles.length > 0
          ? currentParticles.filter((particle) => particle.likelihood >= 0.72)
          : data.probabilityPoints.filter((particle) => particle.likelihood >= 0.72)
      ),
    [currentParticles, data.probabilityPoints]
  );

  const vesselTrackData = useMemo(
    () => vesselTracksToGeoJson(data.vesselTracks, selectedVesselId),
    [data.vesselTracks, selectedVesselId]
  );

  const currentVesselsData = useMemo(
    () => currentVesselsToGeoJson(data.vesselTracks, currentTime, selectedVesselId),
    [data.vesselTracks, currentTime, selectedVesselId]
  );

  const backtrackLineData = useMemo<FeatureCollection<LineString>>(
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
          properties: {
            stepCount: data.backtrackedTrajectory.length,
          },
        },
      ],
    }),
    [data.backtrackedTrajectory]
  );

  const backtrackWaypointsData = useMemo<FeatureCollection<Point>>(
    () => trajectoryWaypointsToGeoJson(data.backtrackedTrajectory, currentTime),
    [data.backtrackedTrajectory, currentTime]
  );

  // Active analysis cursor along the backtracked trajectory synchronized with currentTime and playback
  const activeTrajectoryPoint = useMemo(() => {
    return data.backtrackedTrajectory.find((point) => point.time === currentTime) ?? null;
  }, [data.backtrackedTrajectory, currentTime]);

  const activeCursorData = useMemo<FeatureCollection<Point>>(() => {
    if (!activeTrajectoryPoint) {
      return { type: "FeatureCollection", features: [] };
    }
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [activeTrajectoryPoint.longitude, activeTrajectoryPoint.latitude],
          },
          properties: {
            time: activeTrajectoryPoint.time,
            isPlaying: playing,
            stepIndex: timeIndex + 1,
            totalSteps: times.length,
          },
        },
      ],
    };
  }, [activeTrajectoryPoint, playing, timeIndex, times.length]);

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
                expectedVessel: data.spillLocation.expectedVessel,
              },
            },
          ]
        : [],
    }),
    [data.spillLocation]
  );

  const forwardDriftData = useMemo<FeatureCollection<LineString | Point>>(() => {
    const latestDrift = data.backtrackedTrajectory[0];
    if (!data.spillLocation || !latestDrift) {
      return { type: "FeatureCollection", features: [] };
    }
    const originLat = data.spillLocation.latitude;
    const originLng = data.spillLocation.longitude;
    const projected = calculateForwardDrift(originLat, originLng, latestDrift.driftUMs, latestDrift.driftVMs, 6);

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [originLng, originLat],
              [projected.lng, projected.lat],
            ],
          },
          properties: {
            label: "+6h Forward Projection",
            distKm: projected.distKm,
          },
        },
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [projected.lng, projected.lat],
          },
          properties: {
            label: "+6h Forecast Centroid",
            distKm: projected.distKm,
          },
        },
      ],
    };
  }, [data.spillLocation, data.backtrackedTrajectory]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const center = data.spillLocation
      ? [data.spillLocation.longitude, data.spillLocation.latitude]
      : [70.08, 19.58];

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: center as [number, number],
      zoom: 9.5,
      minZoom: 4,
      maxZoom: 16,
    });

    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: true, showZoom: true }), "bottom-right");

    map.on("load", () => {
      // 1. Grid
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
          "line-opacity": 0.28,
        },
      });

      // 2. Vessel Tracks (LineStrings)
      map.addSource("prototype-vessel-tracks", { type: "geojson", data: vesselTrackData });
      map.addLayer({
        id: "prototype-vessel-tracks-glow",
        type: "line",
        source: "prototype-vessel-tracks",
        paint: {
          "line-color": ["case", ["==", ["get", "selected"], true], "#D6A94A", "#69B7D1"],
          "line-width": ["case", ["==", ["get", "selected"], true], 5, 2.5],
          "line-opacity": ["case", ["==", ["get", "selected"], true], 0.45, 0.15],
          "line-blur": 1.2,
        },
      });
      map.addLayer({
        id: "prototype-vessel-tracks",
        type: "line",
        source: "prototype-vessel-tracks",
        paint: {
          "line-color": ["case", ["==", ["get", "selected"], true], "#D6A94A", "#69B7D1"],
          "line-width": ["case", ["==", ["get", "selected"], true], 2.8, 1.6],
          "line-opacity": ["case", ["==", ["get", "selected"], true], 0.95, 0.6],
        },
      });

      // 3. Backtracked Trajectory Line
      map.addSource("prototype-backtrack", { type: "geojson", data: backtrackLineData });
      map.addLayer({
        id: "prototype-backtrack-glow",
        type: "line",
        source: "prototype-backtrack",
        paint: {
          "line-color": "#FF6B6B",
          "line-width": 6,
          "line-opacity": 0.35,
          "line-blur": 1.5,
        },
      });
      map.addLayer({
        id: "prototype-backtrack",
        type: "line",
        source: "prototype-backtrack",
        paint: {
          "line-color": "#FF6B6B",
          "line-width": 2.8,
          "line-opacity": 0.95,
          "line-dasharray": [0, 2, 2],
        },
      });

      // Trajectory waypoints
      map.addSource("prototype-backtrack-waypoints", { type: "geojson", data: backtrackWaypointsData });
      map.addLayer({
        id: "prototype-backtrack-waypoints",
        type: "circle",
        source: "prototype-backtrack-waypoints",
        paint: {
          "circle-radius": ["case", ["==", ["get", "isCurrent"], true], 5.5, 3.2],
          "circle-color": ["case", ["==", ["get", "isCurrent"], true], "#FF6B6B", "#FFA894"],
          "circle-stroke-color": "#061419",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "prototype-backtrack-origin-label",
        type: "symbol",
        source: "prototype-backtrack-waypoints",
        filter: ["==", ["get", "isOrigin"], true],
        layout: {
          "text-field": "Estimated Release (t-6h)",
          "text-size": 10,
          "text-offset": [0, -1.3],
          "text-anchor": "bottom",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#FFB49F",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      // Active Playback / Analysis Cursor on Backtracked Trajectory
      map.addSource("prototype-trajectory-cursor", { type: "geojson", data: activeCursorData });
      map.addLayer({
        id: "prototype-trajectory-cursor-pulse",
        type: "circle",
        source: "prototype-trajectory-cursor",
        paint: {
          "circle-radius": ["case", ["==", ["get", "isPlaying"], true], 16, 12],
          "circle-color": "#FF6B6B",
          "circle-opacity": ["case", ["==", ["get", "isPlaying"], true], 0.45, 0.22],
          "circle-blur": 0.75,
        },
      });
      map.addLayer({
        id: "prototype-trajectory-cursor",
        type: "circle",
        source: "prototype-trajectory-cursor",
        paint: {
          "circle-radius": ["case", ["==", ["get", "isPlaying"], true], 6.5, 5],
          "circle-color": "#FF6B6B",
          "circle-stroke-color": "#FFFFFF",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "prototype-trajectory-cursor-label",
        type: "symbol",
        source: "prototype-trajectory-cursor",
        layout: {
          "text-field": ["case", ["==", ["get", "isPlaying"], true], "PLAYBACK CURSOR", "ACTIVE STEP"],
          "text-size": 9.5,
          "text-offset": [0, -1.35],
          "text-anchor": "bottom",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#FFA894",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      // 4. Forward Drift (+6h projection)
      map.addSource("prototype-forward-drift", { type: "geojson", data: forwardDriftData });
      map.addLayer({
        id: "prototype-forward-drift-line",
        type: "line",
        source: "prototype-forward-drift",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "#50E3C2",
          "line-width": 2.2,
          "line-opacity": 0.85,
          "line-dasharray": [2, 2],
        },
      });
      map.addLayer({
        id: "prototype-forward-drift-point",
        type: "circle",
        source: "prototype-forward-drift",
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-radius": 4.5,
          "circle-color": "#50E3C2",
          "circle-stroke-color": "#061419",
          "circle-stroke-width": 1.5,
          "circle-opacity": 0.9,
        },
      });
      map.addLayer({
        id: "prototype-forward-drift-label",
        type: "symbol",
        source: "prototype-forward-drift",
        filter: ["==", "$type", "Point"],
        layout: {
          "text-field": "+6h Forward Projection (Derived)",
          "text-size": 9.5,
          "text-offset": [0, 1.3],
          "text-anchor": "top",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#50E3C2",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      // 5. High-risk likelihood zone
      map.addSource("prototype-high-risk", { type: "geojson", data: highRiskData });
      map.addLayer({
        id: "prototype-high-risk-glow",
        type: "circle",
        source: "prototype-high-risk",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 6, 1, 11],
          "circle-color": "#ff765c",
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 0.12, 1, 0.35],
          "circle-blur": 0.78,
        },
      });
      map.addLayer({
        id: "prototype-high-risk",
        type: "circle",
        source: "prototype-high-risk",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 3, 1, 5],
          "circle-color": "#ffcf66",
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0.72, 0.45, 1, 0.85],
          "circle-blur": 0.12,
        },
      });

      // 6. Source Particles
      map.addSource("prototype-particles", { type: "geojson", data: particleData });
      map.addLayer({
        id: "prototype-particle-glow",
        type: "circle",
        source: "prototype-particles",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0, 2.5, 0.72, 6, 1, 9],
          "circle-color": ["interpolate", ["linear"], ["get", "likelihood"], 0, "#4aa9d8", 0.7, "#d6a94a", 1, "#ff765c"],
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0, 0.05, 0.72, 0.22, 1, 0.45],
          "circle-blur": 0.72,
        },
      });
      map.addLayer({
        id: "prototype-particles",
        type: "circle",
        source: "prototype-particles",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "likelihood"], 0, 2.2, 0.5, 3.5, 1, 5.5],
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
          "circle-opacity": ["interpolate", ["linear"], ["get", "likelihood"], 0, 0.2, 0.5, 0.6, 1, 1],
          "circle-blur": ["interpolate", ["linear"], ["get", "likelihood"], 0, 0.6, 1, 0.05],
        },
      });

      // 7. Current Vessel Positions (at currentTime)
      map.addSource("prototype-current-vessels", { type: "geojson", data: currentVesselsData });
      map.addLayer({
        id: "prototype-current-vessels-glow",
        type: "circle",
        source: "prototype-current-vessels",
        paint: {
          "circle-radius": ["case", ["==", ["get", "selected"], true], 11, 7],
          "circle-color": ["case", ["==", ["get", "selected"], true], "#D6A94A", "#69B7D1"],
          "circle-opacity": ["case", ["==", ["get", "selected"], true], 0.45, 0.25],
          "circle-blur": 0.6,
        },
      });
      map.addLayer({
        id: "prototype-current-vessels",
        type: "circle",
        source: "prototype-current-vessels",
        paint: {
          "circle-radius": ["case", ["==", ["get", "selected"], true], 5.5, 4],
          "circle-color": ["case", ["==", ["get", "selected"], true], "#D6A94A", "#69B7D1"],
          "circle-stroke-color": "#061419",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "prototype-current-vessels-label",
        type: "symbol",
        source: "prototype-current-vessels",
        layout: {
          "text-field": ["get", "vesselId"],
          "text-size": 11,
          "text-offset": [0, 1.35],
          "text-anchor": "top",
          "text-font": ["Metropolis Regular", "sans-serif"],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": ["case", ["==", ["get", "selected"], true], "#FFDF85", "#A8DBEB"],
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      // 8. Spill Location
      map.addSource("prototype-spill", { type: "geojson", data: spillData });
      map.addLayer({
        id: "prototype-spill-glow",
        type: "circle",
        source: "prototype-spill",
        paint: {
          "circle-radius": 14,
          "circle-color": "#D6A94A",
          "circle-opacity": 0.25,
          "circle-blur": 0.7,
        },
      });
      map.addLayer({
        id: "prototype-spill",
        type: "circle",
        source: "prototype-spill",
        paint: {
          "circle-radius": 6.5,
          "circle-color": "#D6A94A",
          "circle-stroke-color": "#061419",
          "circle-stroke-width": 2.5,
        },
      });
      map.addLayer({
        id: "prototype-spill-label",
        type: "symbol",
        source: "prototype-spill",
        layout: {
          "text-field": "Observed Spill Location (TEST_04)",
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#D6A94A",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      // Click and hover handlers
      map.on("click", "prototype-vessel-tracks", handleVesselTrackClick);
      map.on("click", "prototype-current-vessels", handleVesselPointClick);

      map.on("mouseenter", "prototype-vessel-tracks", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "prototype-vessel-tracks", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseenter", "prototype-current-vessels", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "prototype-current-vessels", () => {
        map.getCanvas().style.cursor = "";
      });

      fitMap(map, data);
    });

    // Resize observer for layout changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });
    if (mapContainer.current) {
      resizeObserver.observe(mapContainer.current);
    }

    return () => {
      resizeObserver.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync data updates to sources
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("prototype-particles") as GeoJSONSource | undefined)?.setData(particleData);
  }, [particleData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("prototype-high-risk") as GeoJSONSource | undefined)?.setData(highRiskData);
  }, [highRiskData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("prototype-current-vessels") as GeoJSONSource | undefined)?.setData(currentVesselsData);
  }, [currentVesselsData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("prototype-backtrack-waypoints") as GeoJSONSource | undefined)?.setData(backtrackWaypointsData);
  }, [backtrackWaypointsData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("prototype-trajectory-cursor") as GeoJSONSource | undefined)?.setData(activeCursorData);
  }, [activeCursorData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    (map.getSource("prototype-forward-drift") as GeoJSONSource | undefined)?.setData(forwardDriftData);
  }, [forwardDriftData]);

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
      [
        "prototype-backtrack",
        "prototype-backtrack-glow",
        "prototype-backtrack-waypoints",
        "prototype-backtrack-origin-label",
        "prototype-trajectory-cursor",
        "prototype-trajectory-cursor-pulse",
        "prototype-trajectory-cursor-label",
      ],
      visibleLayers.backtrack
    );
    setLayerVisibility(
      map,
      [
        "prototype-forward-drift-line",
        "prototype-forward-drift-point",
        "prototype-forward-drift-label",
      ],
      visibleLayers.forwardDrift
    );
    setLayerVisibility(
      map,
      [
        "prototype-vessel-tracks",
        "prototype-vessel-tracks-glow",
        "prototype-current-vessels",
        "prototype-current-vessels-glow",
        "prototype-current-vessels-label",
      ],
      visibleLayers.vesselTracks
    );
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
        <span className={`playback-status-pill ${playing ? "active" : "paused"}`}>
          <span className="status-dot" />
          {playing ? "PLAYBACK ACTIVE" : "PLAYBACK PAUSED"}
        </span>
        <span>Step {timeIndex + 1}/{times.length} - {currentTime || "No timestamp supplied"}</span>
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
            <dt>Scenario observation time</dt>
            <dd>{data.spillLocation?.observationTime ?? "UNKNOWN"}</dd>
          </div>
        </dl>
        <p>Particles show prototype backtracking likelihood, not SAR detection candidates.</p>
        <p className="prototype-region-note">
          <ProvenanceTag level="prototype" /> This map plots the{" "}
          {data.spillLocation?.caseId ?? "scenario"} prototype scenario location, which is a synthetic test
          fixture and is not the real Qeshm/Hengam incident location. The real incident (
          <ProvenanceTag level="reported" />) is in {QESHM_INCIDENT_METADATA.region}; the coordinates plotted here
          are unrelated to that region.
        </p>
      </section>

      <section className="prototype-layer-toggles" aria-label="Backtracking map layers">
        <span className="panel-kicker">LAYERS</span>
        {[
          ["particles", "Source particles"],
          ["backtrack", "Backtracked path"],
          ["forwardDrift", "Forward drift (+6h)"],
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
        <button
          className={`console-button action ${playing ? "playing" : ""}`}
          type="button"
          onClick={() => setPlaying((value) => !value)}
        >
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
        <div className="time-readout-compact">
          <span className="playback-indicator-text">{playing ? "PLAYING" : "PAUSED"}</span>
          <span>{timeIndex + 1}/{times.length}</span>
        </div>
      </div>

      <div className="map-legend prototype-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#4aa9d8" }} />
          <span>LOW: faint drift source likelihood (PROTOTYPE)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#bf8f4e" }} />
          <span>MEDIUM: clustered likelihood support (PROTOTYPE)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#ffcf66" }} />
          <span>HIGH: brighter projected source likelihood (PROTOTYPE)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#D6A94A" }} />
          <span>VESSELS: scenario AIS tracks & positions (PROTOTYPE)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#FF6B6B" }} />
          <span>DRIFT: hydrodynamic backtracking path (DERIVED)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#50E3C2" }} />
          <span>FORWARD: +6h projected drift vector (DERIVED)</span>
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

  function handleVesselPointClick(event: MapLayerMouseEvent) {
    const feature = event.features?.[0];
    const vesselId = feature?.properties?.vesselId;
    const speed = feature?.properties?.speedKnots;
    const heading = feature?.properties?.headingDeg;
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
          `<strong>${escapeHtml(vesselId)} (at ${escapeHtml(currentTime)})</strong>` +
          `<span>Speed: ${Number(speed ?? 0).toFixed(1)} kts | Heading: ${Number(heading ?? 0).toFixed(0)}&deg;</span>` +
          `<span>Scenario vessel position</span>` +
        `</div>`
      )
      .addTo(mapRef.current!);
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

function currentVesselsToGeoJson(
  points: VesselTrackPoint[],
  currentTime: string,
  selectedVesselId: string | null
): FeatureCollection<Point> {
  const currentPoints = points.filter((point) => point.time === currentTime);
  return {
    type: "FeatureCollection",
    features: currentPoints.map((point): Feature<Point> => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
      properties: {
        vesselId: point.vesselId,
        speedKnots: point.speedKnots,
        headingDeg: point.headingDeg,
        syntheticLabel: point.syntheticLabel,
        selected: point.vesselId === selectedVesselId,
      },
    })),
  };
}

function trajectoryWaypointsToGeoJson(
  trajectory: BacktrackingTrajectoryPoint[],
  currentTime: string
): FeatureCollection<Point> {
  const sorted = trajectory.slice().sort((a, b) => a.time.localeCompare(b.time));
  return {
    type: "FeatureCollection",
    features: sorted.map((point, index): Feature<Point> => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
      properties: {
        time: point.time,
        isCurrent: point.time === currentTime,
        isOrigin: index === 0,
        isTerminus: index === sorted.length - 1,
      },
    })),
  };
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

  // 1 deg lat approx 110.7 km; 1 deg lng approx 111.32 * cos(lat) km
  const latDegPerKm = 1 / 110.7;
  const lngDegPerKm = 1 / (111.32 * Math.cos((lat * Math.PI) / 180));

  const newLat = lat + (deltaYMeters / 1000) * latDegPerKm;
  const newLng = lng + (deltaXMeters / 1000) * lngDegPerKm;

  return { lat: newLat, lng: newLng, distKm };
}

function fitMap(map: MapLibreMap, data: BacktrackingPrototypeData): void {
  const bounds = new LngLatBounds();
  data.particles.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  data.vesselTracks.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  data.backtrackedTrajectory.forEach((point) => bounds.extend([point.longitude, point.latitude]));
  if (data.spillLocation) bounds.extend([data.spillLocation.longitude, data.spillLocation.latitude]);
  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: { top: 90, right: 260, bottom: 120, left: 360 },
      maxZoom: 12.5,
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
