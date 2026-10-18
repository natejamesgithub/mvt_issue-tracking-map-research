/**
 * Dependencies:
 *   npm install leaflet react-leaflet
 *   npm install -D @types/leaflet
 *
 * This example uses OpenStreetMap's public raster tile endpoint for a lightweight demo.
 * Use a production-ready tile provider or self-hosted tiles before shipping at scale.
 *
 * Integration note:
 * Replace MOCK_TRELLO_CARDS with the output from the project's existing Trello fetch function.
 */

import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

type LatLng = [number, number];

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

const TRAIL_CENTER: LatLng = [39.0007, -76.9228];

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
    position: [card.lat, card.lng],
    beforePhotoUrl: card.beforePhotoUrl,
    afterPhotoUrl: card.afterPhotoUrl,
    beforePhotoPosition:
      card.beforePhotoLat != null && card.beforePhotoLng != null
        ? [card.beforePhotoLat, card.beforePhotoLng]
        : undefined,
  };
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const earthRadius = 6_371_000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const [lat1Degrees, lng1Degrees] = a;
  const [lat2Degrees, lng2Degrees] = b;

  const lat1 = toRadians(lat1Degrees);
  const lat2 = toRadians(lat2Degrees);
  const dLat = toRadians(lat2Degrees - lat1Degrees);
  const dLng = toRadians(lng2Degrees - lng1Degrees);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

function FlyToLocation({ position }: { position: LatLng | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, Math.max(map.getZoom(), 16));
    }
  }, [map, position]);

  return null;
}

export default function TrailMapLeaflet() {
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

  const events = useMemo(
    () =>
      Array.from(
        new Map(issues.map((issue) => [issue.eventId, issue.eventName])).entries(),
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
        setCurrentLocation([coords.latitude, coords.longitude]);
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

  return (
    <main style={{ fontFamily: "system-ui", padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ marginBottom: 6 }}>Trail Work Map — React Leaflet</h1>
        <p style={{ marginTop: 0 }}>
          Lightweight prototype using OpenStreetMap tiles and simple React
          components.
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
          gap: 16,
        }}
      >
        <MapContainer
          center={TRAIL_CENTER}
          zoom={15}
          scrollWheelZoom
          style={{ height: 560, width: "100%", borderRadius: 10 }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FlyToLocation position={currentLocation} />

          {visibleIssues.map((issue) => (
            <CircleMarker
              key={issue.id}
              center={issue.position}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: issue.afterPhotoUrl ? "#2f855a" : "#c05621",
                fillOpacity: 1,
              }}
              eventHandlers={{
                click: () => setSelectedIssue(issue),
              }}
            >
              <Popup>
                <strong>{issue.title}</strong>
                <br />
                {issue.eventName}
              </Popup>
            </CircleMarker>
          ))}

          {currentLocation && (
            <CircleMarker
              center={currentLocation}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#2563eb",
                fillOpacity: 1,
              }}
            >
              <Popup>You are here.</Popup>
            </CircleMarker>
          )}
        </MapContainer>

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
                  {selectedIssue.beforePhotoPosition[0].toFixed(5)},{" "}
                  {selectedIssue.beforePhotoPosition[1].toFixed(5)}
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