/**
 * Dependency:
 *   npm install @vis.gl/react-google-maps @googlemaps/markerclusterer
 *
 * Environment variables:
 *   VITE_GOOGLE_MAPS_API_KEY=...
 *   VITE_GOOGLE_MAP_ID=...     // optional for a prototype; use a real Map ID in production
 *
 * Integration note:
 * Replace MOCK_TRELLO_CARDS with the output from the project's existing Trello fetch function.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import {
  APIProvider,
  AdvancedMarker,
  Map as GoogleMap,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps";

type LatLng = { lat: number; lng: number };

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
  beforePhotoLat?: number;
  beforePhotoLng?: number;
};

type TrailIssue = {
  id: string;
  title: string;
  trelloUrl: string;
  eventId: string;
  eventName: string;
  area: string;
  position: LatLng;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  beforePhotoPosition?: LatLng;
};

const TRAIL_CENTER: LatLng = { lat: 39.0007, lng: -76.9228 };

type IssueMarker = google.maps.marker.AdvancedMarkerElement;
type RegisterMarker = (id: string, marker: IssueMarker | null) => void;

function ClusteredIssuePin({
  issue,
  selected,
  registerMarker,
  onSelect,
}: {
  issue: TrailIssue;
  selected: boolean;
  registerMarker: RegisterMarker;
  onSelect: (issue: TrailIssue) => void;
}) {
  const markerRef = useCallback(
    (marker: IssueMarker | null) => {
      registerMarker(issue.id, marker);
    },
    [issue.id, registerMarker],
  );

  return (
    <AdvancedMarker
      ref={markerRef}
      position={issue.position}
      title={issue.title}
      onClick={() => onSelect(issue)}
    >
      <Pin
        background={selected ? "#ea4335" : issue.afterPhotoUrl ? "#2f855a" : "#9333ea"}
        borderColor={selected ? "#c5221f" : "#1a202c"}
        glyphColor={selected ? "#b31412" : "#ffffff"}
      />
    </AdvancedMarker>
  );
}

function ClusteredIssueMarkers({
  issues,
  selectedIssueId,
  onSelect,
}: {
  issues: TrailIssue[];
  selectedIssueId: string | null;
  onSelect: (issue: TrailIssue) => void;
}) {
  const map = useMap();
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const [markers, setMarkers] = useState<Record<string, IssueMarker>>({});

  const registerMarker = useCallback<RegisterMarker>((id, marker) => {
    setMarkers((previous) => {
      if (previous[id] === marker || (!marker && !previous[id]))
        return previous;
      const next = { ...previous };
      if (marker) next[id] = marker;
      else delete next[id];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!map) return;
    const clusterer = new MarkerClusterer({
      map,
      renderer: {
        render({ count, position }) {
          const circle = document.createElement("div");

          circle.textContent = String(count);
          Object.assign(circle.style, {
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "#2f855a",
            color: "white",
            border: "3px solid white",
            boxShadow: "0 2px 6px #0005",
            display: "grid",
            placeItems: "center",
            fontSize: "16px",
            fontWeight: "700",
          });

          return new google.maps.marker.AdvancedMarkerElement({
            position,
            content: circle,
            title: `${count} trail issues`,
            zIndex: 1000 + count,
          });
        },
      },
    });

    clustererRef.current = clusterer;
    return () => {
      clusterer.clearMarkers();
      clusterer.setMap(null);
      clustererRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const clusterer = clustererRef.current;
    if (!clusterer) return;
    clusterer.clearMarkers(true);
    clusterer.addMarkers(Object.values(markers));
  }, [map, markers]);

  return issues.map((issue) => (
    <ClusteredIssuePin
      key={issue.id}
      issue={issue}
      selected={issue.id === selectedIssueId}
      registerMarker={registerMarker}
      onSelect={onSelect}
    />
  ));
}

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
    beforePhotoLat: 39.00118,
    beforePhotoLng: -76.92336,
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
    beforePhotoLat: 38.99982,
    beforePhotoLng: -76.92194,
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
    beforePhotoLat: 38.99892,
    beforePhotoLng: -76.92418,
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
    position: { lat: card.lat, lng: card.lng },
    beforePhotoUrl: card.beforePhotoUrl,
    afterPhotoUrl: card.afterPhotoUrl,
    beforePhotoPosition:
      card.beforePhotoLat != null && card.beforePhotoLng != null
        ? { lat: card.beforePhotoLat, lng: card.beforePhotoLng }
        : undefined,
  };
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

export default function TrailMapGoogleMaps() {
  const issues = useMemo(
    () => MOCK_TRELLO_CARDS.map(trelloCardToTrailIssue),
    [],
  );

  const [eventFilter, setEventFilter] = useState("all");
  const [selectedIssue, setSelectedIssue] = useState<TrailIssue | null>(null);
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null);
  const [locationMessage, setLocationMessage] = useState(
    "Location has not been requested.",
  );

  const events = useMemo<[string, string][]>(
    () =>
      Array.from(
        new globalThis.Map<string, string>(
          issues.map((issue): [string, string] => [
            issue.eventId,
            issue.eventName,
          ]),
        ).entries(),
      ),
    [issues],
  );

  const visibleIssues =
    eventFilter === "all"
      ? issues
      : issues.filter((issue) => issue.eventId === eventFilter);

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Geolocation is not supported by this browser.");
      return;
    }

    setLocationMessage("Requesting location permission...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentLocation({
          lat: coords.latitude,
          lng: coords.longitude,
        });
        setLocationMessage("Current location found.");
      },
      (error) => {
        setLocationMessage(`Location unavailable: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  const beforePhotoDistance =
    selectedIssue?.beforePhotoPosition && currentLocation
      ? Math.round(
          distanceMeters(selectedIssue.beforePhotoPosition, currentLocation),
        )
      : null;

  type GoogleMapsEnv = {
    VITE_GOOGLE_MAPS_API_KEY?: string;
    VITE_GOOGLE_MAP_ID?: string;
  };

  const env = (import.meta as ImportMeta & { env?: GoogleMapsEnv }).env ?? {};

  const apiKey = env.VITE_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = env.VITE_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

  return (
    <main style={{ fontFamily: "system-ui", padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ marginBottom: 6 }}>Trail Work Map — Google Maps</h1>
        <p style={{ marginTop: 0 }}>
          Trello-linked issues, event filtering, before/after photos, and phone
          location checking.
        </p>
      </header>

      <section
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
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

        <button type="button" onClick={requestCurrentLocation}>
          Show my location
        </button>

        <span>{locationMessage}</span>
      </section>

      {!apiKey && (
        <p style={{ padding: 10, background: "#fff3cd" }}>
          Add VITE_GOOGLE_MAPS_API_KEY to run the map.
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 16,
        }}
      >
        <div style={{ height: 560, minWidth: 0 }}>
          <APIProvider apiKey={apiKey}>
            <GoogleMap
              defaultCenter={TRAIL_CENTER}
              defaultZoom={15}
              mapId={mapId}
              gestureHandling="greedy"
              style={{ width: "100%", height: "100%" }}
            >
              <ClusteredIssueMarkers
                issues={visibleIssues}
                selectedIssueId={selectedIssue?.id ?? null}
                onSelect={setSelectedIssue}
              />

              {currentLocation && (
                <AdvancedMarker
                  position={currentLocation}
                  title="Your current location"
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#2563eb",
                      border: "3px solid white",
                      boxShadow: "0 0 0 2px #2563eb",
                    }}
                  />
                </AdvancedMarker>
              )}
            </GoogleMap>
          </APIProvider>
        </div>

        <aside
          style={{
            border: "1px solid #d1d5db",
            borderRadius: 10,
            padding: 14,
            minHeight: 260,
          }}
        >
          {!selectedIssue ? (
            <p>Select a map pin to inspect a trail issue.</p>
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
              {selectedIssue.beforePhotoUrl && (
                <img
                  src={selectedIssue.beforePhotoUrl}
                  alt={`Before: ${selectedIssue.title}`}
                  style={{ width: "100%", borderRadius: 8 }}
                />
              )}

              {selectedIssue.beforePhotoPosition && (
                <p>
                  Photo location:{" "}
                  {selectedIssue.beforePhotoPosition.lat.toFixed(5)},{" "}
                  {selectedIssue.beforePhotoPosition.lng.toFixed(5)}
                </p>
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

              <button type="button" onClick={requestCurrentLocation}>
                Check location before taking after photo
              </button>

              {beforePhotoDistance != null && (
                <p>
                  You are approximately <strong>{beforePhotoDistance} m</strong>{" "}
                  from the original before-photo location.
                </p>
              )}
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
