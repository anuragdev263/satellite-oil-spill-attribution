import React, { useEffect, useRef } from "react";
import { Map, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import type { MapLayerMouseEvent, GeoJSONSource } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Feature, Polygon, Point, LineString } from "geojson";

setWorkerUrl(workerUrl);

export interface Vessel {
  rank: number;
  name: string;
  mmsi: string;
  imo: string;
  type: string;
  flag: string;
  latitude: number;
  longitude: number;
  score: number;
}

export interface Evidence {
  label: string;
  score: number;
  description: string;
}

export interface CaseData {
  caseId: string;
  status: string;
  region: string;
  observation: {
    time: string;
  };
  slick: {
    areaKm2: number;
    oilConfidence: number;
  };
  sourceRegion: {
    latitude: number;
    longitude: number;
    confidence: number;
  };
  vessels: Vessel[];
  evidenceChain: Evidence[];
  backtrack: { hoursAgo: number }[];
  forwardDrift: { hoursAhead: number }[];
}

export interface FlyToRequest {
  mmsi: string;
  token: number;
}

export interface MapViewProps {
  caseData?: CaseData;
  selectedVesselMmsi?: string | null;
  selectedSpillId?: number | null;
  selectedTimeOffset?: number;
  simulatedTrajectory?: [number, number][] | null;
  flyToRequest?: FlyToRequest | null;
  onVesselSelect?: (mmsi: string | null) => void;
  onSpillSelect?: (id: number | null) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  caseData,
  selectedVesselMmsi = null,
  selectedSpillId = null,
  selectedTimeOffset = 0,
  simulatedTrajectory = null,
  flyToRequest = null,
  onVesselSelect,
  onSpillSelect,
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  // Tracks the real on-map coordinates for each vessel name, populated once
  // the vessels layer is added. Used so VIEW TRACK flies to where the
  // marker actually is, not just an arbitrary source coordinate.
  const vesselCoordsRef = useRef<Record<string, [number, number]>>({});

  const onVesselSelectRef = useRef(onVesselSelect);
  const onSpillSelectRef = useRef(onSpillSelect);

  useEffect(() => {
    onVesselSelectRef.current = onVesselSelect;
  }, [onVesselSelect]);

  useEffect(() => {
    onSpillSelectRef.current = onSpillSelect;
  }, [onSpillSelect]);

  const applySelectionStyles = () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const selectedVesselName =
      caseData?.vessels?.find((v) => v.mmsi === selectedVesselMmsi)?.name || null;

    if (map.getLayer("vessels")) {
      if (selectedVesselName) {
        map.setPaintProperty("vessels", "circle-radius", [
          "case",
          ["==", ["get", "name"], selectedVesselName],
          8,
          3.5,
        ]);
        map.setPaintProperty("vessels", "circle-opacity", [
          "case",
          ["==", ["get", "name"], selectedVesselName],
          1,
          0.3,
        ]);
        map.setPaintProperty("vessels", "circle-stroke-opacity", [
          "case",
          ["==", ["get", "name"], selectedVesselName],
          1,
          0.3,
        ]);
      } else {
        map.setPaintProperty("vessels", "circle-radius", 4.5);
        map.setPaintProperty("vessels", "circle-opacity", 1);
        map.setPaintProperty("vessels", "circle-stroke-opacity", 1);
      }
    }

    if (map.getLayer("trajectories")) {
      if (selectedVesselName) {
        map.setPaintProperty("trajectories", "line-width", [
          "case",
          ["==", ["get", "name"], selectedVesselName],
          3,
          1,
        ]);
        map.setPaintProperty("trajectories", "line-opacity", [
          "case",
          ["==", ["get", "name"], selectedVesselName],
          1,
          0.2,
        ]);
      } else {
        map.setPaintProperty("trajectories", "line-width", 1.5);
        map.setPaintProperty("trajectories", "line-opacity", 0.6);
      }
    }

    if (map.getLayer("oil-spill-fill")) {
      const baseOpacity = selectedSpillId !== null ? 0.3 : 0.12;
      const temporalFactor = selectedTimeOffset !== 0 ? (selectedTimeOffset > 0 ? 0.05 : -0.02) : 0;
      map.setPaintProperty("oil-spill-fill", "fill-opacity", Math.max(0.08, baseOpacity + temporalFactor));
    }

    if (map.getLayer("oil-spill-outline")) {
      if (selectedSpillId !== null) {
        map.setPaintProperty("oil-spill-outline", "line-width", 2.5);
      } else {
        map.setPaintProperty("oil-spill-outline", "line-width", 1.5);
      }
    }
  };

  useEffect(() => {
    applySelectionStyles();
  }, [selectedVesselMmsi, selectedSpillId, selectedTimeOffset, caseData]);

  // VIEW TRACK: fly the camera to the requested vessel's marker.
  // Re-fires on every new token (even for the same vessel), but never
  // touches layers/sources, so repeated clicks can't duplicate anything.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToRequest) return;

    const flyToVessel = () => {
      const vesselName = caseData?.vessels?.find((v) => v.mmsi === flyToRequest.mmsi)?.name;
      if (!vesselName) return;

      const coords = vesselCoordsRef.current[vesselName];
      if (!coords) return;

      map.flyTo({
        center: coords,
        zoom: Math.max(map.getZoom(), 8.5),
        essential: true,
        duration: 1200,
      });
    };

    if (map.isStyleLoaded()) {
      flyToVessel();
    } else {
      map.once("load", flyToVessel);
    }
  }, [flyToRequest, caseData]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
      center: [70.082, 19.534],
      zoom: 5.8,
      minZoom: 3,
      maxZoom: 12,
    });

    mapRef.current = map;

    map.addControl(
      new NavigationControl({
        showCompass: true,
        showZoom: true,
      }),
      "bottom-right"
    );

    map.on("error", (e) => {
      console.error("MapLibre GL Error:", e);
    });

    map.on("load", () => {
      try {
        if (map.getLayer("background")) map.setPaintProperty("background", "background-color", "#061419");
        if (map.getLayer("water")) map.setPaintProperty("water", "fill-color", "#061419");
      } catch (e) {
        console.warn("Could not override basemap colors", e);
      }

      const gridFeatures: Feature<LineString>[] = [];
      for (let lng = 50; lng <= 90; lng += 1) {
        gridFeatures.push({ type: "Feature", geometry: { type: "LineString", coordinates: [[lng, 0], [lng, 40]] }, properties: {} });
      }
      for (let lat = 0; lat <= 40; lat += 1) {
        gridFeatures.push({ type: "Feature", geometry: { type: "LineString", coordinates: [[50, lat], [90, lat]] }, properties: {} });
      }

      map.addSource("tech-grid", {
        type: "geojson",
        data: { type: "FeatureCollection", features: gridFeatures },
      });

      map.addLayer({
        id: "tech-grid-layer",
        type: "line",
        source: "tech-grid",
        paint: {
          "line-color": "#102A31",
          "line-width": 1,
          "line-opacity": 0.3,
        },
      });

      const oilSpillData: Feature<Polygon> = {
        type: "Feature",
        id: 1,
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [69.55, 19.25],
              [69.72, 19.55],
              [70.05, 19.72],
              [70.35, 19.62],
              [70.28, 19.30],
              [69.90, 19.12],
              [69.55, 19.25],
            ],
          ],
        },
        properties: { id: 1, area_km2: 42.7 },
      };

      map.addSource("oil-spill", {
        type: "geojson",
        data: oilSpillData,
      });

      map.addLayer({
        id: "oil-spill-fill",
        type: "fill",
        source: "oil-spill",
        paint: {
          "fill-color": "#D6A94A",
          "fill-opacity": 0.12,
        },
      });

      map.addLayer({
        id: "oil-spill-outline",
        type: "line",
        source: "oil-spill",
        paint: {
          "line-color": "#D6A94A",
          "line-width": 1.5,
          "line-opacity": 0.7,
        },
      });

      const sourcePointData: Feature<Point> = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [70.082, 19.534],
        },
        properties: {
          name: "PROBABLE SOURCE",
          confidence: "87%",
        },
      };

      map.addSource("source-point", {
        type: "geojson",
        data: sourcePointData,
      });

      map.addLayer({
        id: "source-radius",
        type: "circle",
        source: "source-point",
        paint: {
          "circle-radius": 45,
          "circle-color": "transparent",
          "circle-stroke-color": "#D83B8C",
          "circle-stroke-width": 1.5,
          "circle-stroke-opacity": 0.6,
        },
      });

      map.addLayer({
        id: "source-point",
        type: "circle",
        source: "source-point",
        paint: {
          "circle-radius": 4,
          "circle-color": "#D83B8C",
          "circle-stroke-color": "#061419",
          "circle-stroke-width": 1,
        },
      });

      const vesselsData: FeatureCollection<Point> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [69.82, 19.67] },
            properties: { name: "OCEAN STAR", rank: 1, confidence: "92%" },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [69.45, 19.35] },
            properties: { name: "BLUE HORIZON", rank: 2, confidence: "81%" },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [70.25, 19.72] },
            properties: { name: "SEA QUEST", rank: 3, confidence: "68%" },
          },
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [70.12, 19.12] },
            properties: { name: "EASTERN WIND", rank: 4, confidence: "54%" },
          },
        ],
      };

      map.addSource("vessels", {
        type: "geojson",
        data: vesselsData,
      });

      // Capture real marker coordinates for VIEW TRACK flyTo lookups.
      vesselsData.features.forEach((f) => {
        const name = f.properties?.name as string | undefined;
        if (name && f.geometry.type === "Point") {
          vesselCoordsRef.current[name] = f.geometry.coordinates as [number, number];
        }
      });

      map.addLayer({
        id: "vessels",
        type: "circle",
        source: "vessels",
        paint: {
          "circle-radius": 4.5,
          "circle-color": "#69B7D1",
          "circle-stroke-color": "#08242C",
          "circle-stroke-width": 1.5,
        },
      });

      const trajectoriesData: FeatureCollection<LineString> = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [69.55, 19.88],
                [69.65, 19.82],
                [69.72, 19.76],
                [69.82, 19.67],
              ],
            },
            properties: { name: "OCEAN STAR" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [69.20, 19.15],
                [69.28, 19.22],
                [69.36, 19.28],
                [69.45, 19.35],
              ],
            },
            properties: { name: "BLUE HORIZON" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [70.05, 19.95],
                [70.14, 19.87],
                [70.20, 19.79],
                [70.25, 19.72],
              ],
            },
            properties: { name: "SEA QUEST" },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [69.85, 18.85],
                [69.95, 18.95],
                [70.04, 19.03],
                [70.12, 19.12],
              ],
            },
            properties: { name: "EASTERN WIND" },
          },
        ],
      };

      map.addSource("trajectories", {
        type: "geojson",
        data: trajectoriesData,
      });

      map.addLayer({
        id: "trajectories",
        type: "line",
        source: "trajectories",
        paint: {
          "line-color": "#69B7D1",
          "line-width": 1.5,
          "line-opacity": 0.6,
          "line-dasharray": [3, 3],
        },
      });

      // WHAT-IF SIMULATOR SOURCE AND LAYER
      map.addSource("sim-trajectory", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: "sim-trajectory-layer",
        type: "line",
        source: "sim-trajectory",
        paint: {
          "line-color": "#FF6B6B",
          "line-width": 2.5,
          "line-opacity": 0.9,
          "line-dasharray": [2, 2],
        },
      });

      map.addLayer({
        id: "vessel-labels",
        type: "symbol",
        source: "vessels",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 10,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#9DD7E8",
          "text-halo-color": "#061419",
          "text-halo-width": 1.5,
        },
      });

      map.addLayer({
        id: "source-label",
        type: "symbol",
        source: "source-point",
        layout: {
          "text-field": "PROBABLE SOURCE\nCONFIDENCE 87%",
          "text-size": 10,
          "text-offset": [1.2, 0],
          "text-anchor": "left",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#D83B8C",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      map.addLayer({
        id: "spill-label",
        type: "symbol",
        source: "oil-spill",
        layout: {
          "text-field": "OIL SLICK DETECTED\n42.7 km² · 91% CONFIDENCE",
          "text-size": 10,
          "text-anchor": "center",
          "text-font": ["Metropolis Regular", "sans-serif"],
        },
        paint: {
          "text-color": "#D6A94A",
          "text-halo-color": "#061419",
          "text-halo-width": 2,
        },
      });

      // Interactive Events
      map.on("click", "vessels", (e: MapLayerMouseEvent) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];

        if (feature.geometry.type === "Point") {
          const coordinates = (feature.geometry.coordinates as [number, number]).slice() as [
            number,
            number
          ];
          const props = feature.properties;

          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
          }

          new Popup({ closeButton: true, closeOnClick: true, className: "custom-map-popup" })
            .setLngLat(coordinates)
            .setHTML(
              `<div style="font-family: 'JetBrains Mono', monospace; padding: 2px;">` +
                `<div style="font-size: 11px; font-weight: 700; color: #D8E4E8; margin-bottom: 4px; letter-spacing: 0.05em;">${props?.name}</div>` +
                `<div style="font-size: 9px; color: #D6A94A; margin-bottom: 6px;">RANK #${props?.rank}</div>` +
                `<div style="font-size: 8px; color: #7C9AA3;">ATTRIBUTION CONFIDENCE: <span style="color: #9DD7E8">${props?.confidence}</span></div>` +
              `</div>`
            )
            .addTo(map);

          const vesselName = props?.name;
          const matchedVessel = caseData?.vessels?.find((v) => v.name === vesselName);
          const mmsi = matchedVessel ? matchedVessel.mmsi : null;

          if (onVesselSelectRef.current) {
            onVesselSelectRef.current(mmsi);
          }
        }
      });

      map.on("click", "oil-spill-fill", (e: MapLayerMouseEvent) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const spillId = typeof feature.properties?.id === "number" ? feature.properties.id : 1;
        if (onSpillSelectRef.current) {
          onSpillSelectRef.current(spillId);
        }
      });

      map.on("mouseenter", "vessels", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "vessels", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", "oil-spill-fill", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "oil-spill-fill", () => {
        map.getCanvas().style.cursor = "";
      });

      applySelectionStyles();
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Simulator Trajectory on demand safely
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource("sim-trajectory") as GeoJSONSource | undefined;
    if (source) {
      if (simulatedTrajectory && simulatedTrajectory.length > 0) {
        source.setData({
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: simulatedTrajectory,
              },
              properties: {},
            },
          ],
        });
      } else {
        source.setData({ type: "FeatureCollection", features: [] });
      }
    }
  }, [simulatedTrajectory]);

  const lat = caseData?.sourceRegion?.latitude?.toFixed?.(3) ?? "19.534";
  const lng = caseData?.sourceRegion?.longitude?.toFixed?.(3) ?? "70.082";

  return (
    <div className="map-wrapper">
      <div className="map-overlay-title">
        <span className="title-muted">MAP / COMMON OPERATING PICTURE</span>
        <strong className="title-highlight">ARABIAN SEA</strong>
      </div>

      <div className="map-coordinates">
        {lat}° N {lng}° E
      </div>

      <div ref={mapContainer} className="map-container" />

      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#D6A94A" }}></span>
          <span>OBSERVED / MEASURED</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#D83B8C" }}></span>
          <span>INFERRED / MODELLED</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#69B7D1" }}></span>
          <span>AIS VESSEL</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: "#FF6B6B" }}></span>
          <span>SIMULATOR (WHAT-IF)</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;