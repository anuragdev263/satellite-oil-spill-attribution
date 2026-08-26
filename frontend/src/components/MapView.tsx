import React, { useEffect, useRef } from "react";
import { Map, NavigationControl, Popup, setWorkerUrl } from "maplibre-gl";
import type { MapLayerMouseEvent } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { FeatureCollection, Feature, Polygon, Point, LineString } from "geojson";

setWorkerUrl(workerUrl);

interface MapViewProps {
  caseData?: any;
}

export const MapView: React.FC<MapViewProps> = ({ caseData }) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new Map({
      container: mapContainer.current,
      // Using a standard dark base map to get muted landmasses
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
      // 0. Force Carto base map ocean/background to exact match #061419
      try {
        if (map.getLayer("background")) map.setPaintProperty("background", "background-color", "#061419");
        if (map.getLayer("water")) map.setPaintProperty("water", "fill-color", "#061419");
      } catch (e) {
        console.warn("Could not override basemap colors", e);
      }

      // 1. Technical Grid Overlay
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

      // 2. Oil Spill Source & Layers (OBSERVED - GOLD)
      const oilSpillData: Feature<Polygon> = {
        type: "Feature",
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
        properties: {},
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

      // 3. Probable Source Point & Layers (INFERRED - MAGENTA)
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

      // 4. AIS Vessels Source & Layer (MEASURED - CYAN)
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

      // 5. Vessel Trajectories Source & Layer
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

      // 6. Labels
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
        }
      });

      map.on("mouseenter", "vessels", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "vessels", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

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
      </div>
    </div>
  );
};

export default MapView;