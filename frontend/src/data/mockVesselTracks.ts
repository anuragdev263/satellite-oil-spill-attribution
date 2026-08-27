import type { Feature, FeatureCollection, Point, LineString } from "geojson";

/**
 * TEMPORARY mock AIS + probable-source data.
 *
 * Per WORKFLOW - NEXT, this will be replaced by real AIS vessel
 * positions/trajectories and a real source-estimation output. Everything in
 * this file is shaped like the eventual real payload so that MapView.tsx
 * will not need to change - only the values loaded here will.
 */

export const probableSource: Feature<Point, { name: string; confidence: string }> = {
  type: "Feature",
  geometry: { type: "Point", coordinates: [70.082, 19.534] },
  properties: { name: "PROBABLE SOURCE", confidence: "87%" },
};

export const mockVessels: FeatureCollection<
  Point,
  { name: string; rank: number; confidence: string }
> = {
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

export const mockTrajectories: FeatureCollection<LineString, { name: string }> = {
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
          [69.2, 19.15],
          [69.28, 19.22],
          [69.36, 19.28],
          [69.45, 19.35],
        ],
      },
      properties: { name: "BLUE HORIZON" },
    },
  ],
};