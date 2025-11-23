// frontend/src/components/MapBox.jsx
import React, { useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { buildKml, downloadKmlFile } from './exportBookmarks.jsx';

function FitCircle({ center, radius }) {
  const map = useMap();
  useEffect(() => {
    if (center && radius) {
      const lat = Number(center[0]);
      const lng = Number(center[1]);
      const latDelta = radius / 111320;
      const lngDelta = radius / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
      const southWest = [lat - latDelta, lng - lngDelta];
      const northEast = [lat + latDelta, lng + lngDelta];
      map.fitBounds([southWest, northEast], { padding: [20, 20] });
    }
  }, [center, radius, map]);
  return null;
}

export default function MapBox({ trip, events = [] }) {
  const hasLocation = trip && trip.latitude != null && trip.longitude != null;
  const centerPoint = hasLocation ? [Number(trip.latitude), Number(trip.longitude)] : null;
  const radius = 5000;
  const defaultPosition = centerPoint || [51.505, -0.09];
  const brandColor = '#4e73df';
  const mapStyles = { height: '250px', width: '100%', borderRadius: '0.25rem' };

  const eventsWithCoords = events.filter(ev => ev.latitude != null && ev.longitude != null);

  const makeFilename = () => {
    const safeTitle = (trip && trip.title) ? trip.title.replace(/[^a-z0-9_\- ]/gi, '') : 'trip';
    return `${safeTitle || 'trip'}-bookmarks.kml`;
  };

  const handleDownload = () => {
    const kml = buildKml({ trip, events: eventsWithCoords });
    const filename = makeFilename(); // ensures .kml
    downloadKmlFile(kml, filename);
  };

  const getGoogleMapsPinsLink = () => {
    const points = [];
    if (eventsWithCoords.length > 0) {
      eventsWithCoords.forEach(ev => points.push(`${Number(ev.latitude)},${Number(ev.longitude)}`));
    } else if (hasLocation) {
      points.push(`${Number(trip.latitude)},${Number(trip.longitude)}`);
    } else return null;

    if (points.length === 1) {
      return `https://www.google.com/maps?q=${encodeURIComponent(points[0])}&z=12`;
    }

    const origin = points[0];
    const destination = points[points.length - 1];
    const middlePoints = points.slice(1, -1);
    const MAX_WAYPOINTS = 8;
    const waypoints = middlePoints.slice(0, MAX_WAYPOINTS).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
    url += `&travelmode=driving`;
    return url;
  };

  const handleOpenGoogleMaps = () => {
    const url = getGoogleMapsPinsLink();
    if (!url) {
      alert('No location data available to open in Google Maps.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3">
        <h6 className="m-0 font-weight-bold text-primary">Map</h6>
      </Card.Header>
      <Card.Body style={{ overflow: 'visible' }}>
        <MapContainer center={defaultPosition} zoom={13} style={mapStyles}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {centerPoint && (
            <Circle
              center={centerPoint}
              radius={radius}
              pathOptions={{ color: brandColor, weight: 2, fillColor: brandColor, fillOpacity: 0.15 }}
            />
          )}

          {centerPoint && radius && <FitCircle center={centerPoint} radius={radius} />}

          {eventsWithCoords.map(event => (
            <Marker
              key={event.event_id ?? event.id ?? `${event.latitude}-${event.longitude}`}
              position={[Number(event.latitude), Number(event.longitude)]}
            >
              <Popup>
                <strong>{event.type || 'Event'}:</strong> {event.title}<br />
                {event.location_display_name || event.location_input}
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <div className="d-flex gap-2 mt-3">
          <Button variant="primary" onClick={handleDownload}>
            Download bookmarks (.kml)
          </Button>

          <Button variant="success" onClick={handleOpenGoogleMaps} disabled={eventsWithCoords.length === 0 && !hasLocation}>
            Open in Google Maps
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
