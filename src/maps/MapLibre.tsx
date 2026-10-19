/**
 * Dependency:
 *   npm install maplibre-gl
 *
 * This example uses MapLibre's public demo style only for demonstration.
 * Use an approved/self-hosted production tile/style provider before shipping.
 *
 * Integration note:
 * Replace MOCK_TRELLO_CARDS with the output from the project's existing Trello fetch function.
 */

import { useEffect, useMemo, useRef, useState } from "react";

import {
  GeolocateControl,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";

import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

import "maplibre-gl/dist/maplibre-gl.css";

setWorkerUrl(workerUrl);

type TrelloTrailCard = {
  id: string;
  name: string;
  url: string;
  eventId: string;
  eventName: string;
  area: string;
  lat: number;
  lng: number;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
};

type TrailIssue = {
  id: string;
  title: string;
  trelloUrl: string;
  eventId: string;
  eventName: string;
  area: string;
  lat: number;
  lng: number;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
};

const TRAIL_CENTER: [number, number] = [-76.9228, 39.0007];

// Illustrative routes only. Replace with surveyed/approved trail GeoJSON.
const SAMPLE_TRAILS = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: { name: "Sample main trail" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-76.9248, 38.9983],
          [-76.9242, 38.9989],
          [-76.924, 38.9991],
          [-76.9237, 39.0001],
          [-76.9234, 39.0012],
          [-76.9229, 39.002],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Sample creek connector" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-76.9237, 39.0001],
          [-76.9228, 39.0003],
          [-76.9219, 38.9998],
          [-76.921, 38.9996],
        ],
      },
    },
    {
      type: "Feature" as const,
      properties: { name: "Sample east trail", color: "#9333ea" },
      geometry: {
        type: "LineString" as const,
        coordinates: [
          [-76.92, 39.0005],
          [-76.9195, 39.001],
          [-76.9198, 39.0016],
          [-76.9191, 39.0021],
          [-76.9185, 39.0025],
        ],
      },
    },
  ],
};

const MOCK_TRELLO_CARDS: TrelloTrailCard[] = [
  {
    id: "card-1",
    name: "Downed branch blocking trail",
    url: "https://trello.com/c/example1",
    eventId: "event-fall-cleanup",
    eventName: "Fall Trail Cleanup",
    area: "North Section",
    lat: 39.0012,
    lng: -76.9234,
    beforePhotoUrl: "https://placehold.co/320x180?text=Before+Photo",
    afterPhotoUrl: "https://placehold.co/320x180?text=After+Photo",
  },
  {
    id: "card-2",
    name: "Erosion near creek crossing",
    url: "https://trello.com/c/example2",
    eventId: "event-fall-cleanup",
    eventName: "Fall Trail Cleanup",
    area: "Creek Section",
    lat: 38.9998,
    lng: -76.9219,
    beforePhotoUrl: "https://placehold.co/320x180?text=Before+Photo",
  },
  {
    id: "card-3",
    name: "Missing trail marker",
    url: "https://trello.com/c/example3",
    eventId: "event-summer-maintenance",
    eventName: "Summer Maintenance",
    area: "South Section",
    lat: 38.9989,
    lng: -76.9242,
    beforePhotoUrl: "https://placehold.co/320x180?text=Before+Photo",
    afterPhotoUrl: "https://placehold.co/320x180?text=After+Photo",
  },
  {
    id: "card-4",
    name: "Litter pickup location",
    url: "https://trello.com/c/example4",
    eventId: "event-summer-maintenance",
    eventName: "Summer Maintenance",
    area: "South Section",
    lat: 38.9991,
    lng: -76.924,
    beforePhotoUrl: "https://placehold.co/320x180?text=Before+Photo",
  },
];

function trelloCardToTrailIssue(card: TrelloTrailCard): TrailIssue {
  return {
    id: card.id,
    title: card.name,
    trelloUrl: card.url,
    eventId: card.eventId,
    eventName: card.eventName,
    area: card.area,
    lat: card.lat,
    lng: card.lng,
    beforePhotoUrl: card.beforePhotoUrl,
    afterPhotoUrl: card.afterPhotoUrl,
  };
}

function toGeoJSON(issues: TrailIssue[]) {
  return {
    type: "FeatureCollection" as const,
    features: issues.map((issue) => ({
      type: "Feature" as const,
      properties: {
        issueId: issue.id,
        title: issue.title,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [issue.lng, issue.lat],
      },
    })),
  };
}

export default function TrailMapMapLibre() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const issues = useMemo(
    () => MOCK_TRELLO_CARDS.map(trelloCardToTrailIssue),
    [],
  );

  const [eventFilter, setEventFilter] = useState("all");
  const [showTrails, setShowTrails] = useState(true);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const events = useMemo(
    () =>
      Array.from(
        new globalThis.Map(
          issues.map((issue) => [issue.eventId, issue.eventName]),
        ).entries(),
      ),
    [issues],
  );

  const visibleIssues =
    eventFilter === "all"
      ? issues
      : issues.filter((issue) => issue.eventId === eventFilter);

  const selectedIssue =
    issues.find((issue) => issue.id === selectedIssueId) ?? null;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: TRAIL_CENTER,
      zoom: 14,
    });

    map.addControl(new NavigationControl(), "top-right");
    map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      }),
      "top-right",
    );

    map.on("load", () => {
      map.addSource("trail-routes", { type: "geojson", data: SAMPLE_TRAILS });
      map.addLayer({
        id: "trail-route-outline",
        type: "line",
        source: "trail-routes",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 8 },
      });
      map.addLayer({
        id: "trail-route-lines",
        type: "line",
        source: "trail-routes",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["coalesce", ["get", "color"], "#d97706"],
          "line-width": 4,
        },
      });

      map.addSource("trail-issues", {
        type: "geojson",
        data: toGeoJSON(issues),
        cluster: true,
        clusterMaxZoom: 16,
        clusterRadius: 50,
      });

      map.addLayer({
        id: "issue-clusters",
        type: "circle",
        source: "trail-issues",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#2563eb",
          "circle-radius": 20,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "trail-issues",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: "issue-pins",
        type: "circle",
        source: "trail-issues",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#2f855a",
          "circle-radius": 8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.on("click", "issue-pins", (event) => {
        const feature = event.features?.[0];
        const issueId = feature?.properties?.issueId;

        if (issueId) {
          setSelectedIssueId(String(issueId));
        }
      });

      map.on("click", "issue-clusters", async (event) => {
        const feature = map.queryRenderedFeatures(event.point, {
          layers: ["issue-clusters"],
        })[0];

        if (!feature || feature.geometry.type !== "Point") return;

        const clusterId = Number(feature.properties?.cluster_id);
        const source = map.getSource("trail-issues") as GeoJSONSource;
        const zoom = await source.getClusterExpansionZoom(clusterId);

        map.easeTo({
          center: feature.geometry.coordinates as [number, number],
          zoom,
        });
      });

      map.on("mouseenter", "issue-pins", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "issue-pins", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [issues]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const updateVisibility = () => {
      for (const layer of ["trail-route-outline", "trail-route-lines"]) {
        if (map.getLayer(layer)) {
          map.setLayoutProperty(
            layer,
            "visibility",
            showTrails ? "visible" : "none",
          );
        }
      }
    };
    updateVisibility();
    map.on("load", updateVisibility);
    return () => {
      map.off("load", updateVisibility);
    };
  }, [showTrails]);

  useEffect(() => {
    const source = mapRef.current?.getSource("trail-issues") as
      | GeoJSONSource
      | undefined;

    if (source) {
      void source.setData(toGeoJSON(visibleIssues));
    }
  }, [visibleIssues]);

  return (
    <main style={{ fontFamily: "system-ui", padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ marginBottom: 6 }}>Trail Work Map — MapLibre</h1>
        <p style={{ marginTop: 0 }}>
          Open-source map rendering with built-in clustering, zoom controls, and
          browser geolocation.
        </p>
      </header>

      <section style={{ marginBottom: 12 }}>
        <label>
          Event:{" "}
          <select
            value={eventFilter}
            onChange={(event) => setEventFilter(event.target.value)}
          >
            <option value="all">All events</option>
            {events.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label style={{ marginLeft: 16 }}>
          <input
            type="checkbox"
            checked={showTrails}
            onChange={(event) => setShowTrails(event.target.checked)}
          />{" "}
          Show sample trails
        </label>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 16,
        }}
      >
        <div
          ref={containerRef}
          style={{
            height: 560,
            minWidth: 0,
            borderRadius: 10,
            overflow: "hidden",
          }}
        />

        <aside
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: 14,
          }}
        >
          {!selectedIssue ? (
            <p>Select a pin to inspect a trail issue.</p>
          ) : (
            <>
              <h2>{selectedIssue.title}</h2>
              <p>
                <strong>Event:</strong> {selectedIssue.eventName}
                <br />
                <strong>Area:</strong> {selectedIssue.area}
              </p>

              <a
                href={selectedIssue.trelloUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open Trello card
              </a>

              <h3>Before</h3>
              {selectedIssue.beforePhotoUrl ? (
                <img
                  src={selectedIssue.beforePhotoUrl}
                  alt={`Before: ${selectedIssue.title}`}
                  style={{ width: "100%", borderRadius: 8 }}
                />
              ) : (
                <p>No before photo.</p>
              )}

              <h3>After</h3>
              {selectedIssue.afterPhotoUrl ? (
                <img
                  src={selectedIssue.afterPhotoUrl}
                  alt={`After: ${selectedIssue.title}`}
                  style={{ width: "100%", borderRadius: 8 }}
                />
              ) : (
                <p>No after photo yet.</p>
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
