// src/components/MapBox.jsx
import React, { useEffect } from 'react';
import { Card } from 'react-bootstrap';
// Import Circle instead of Rectangle/Polygon
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';


// This helper component will automatically zoom to show the circle
function FitCircle({ center, radius }) {
  const map = useMap();
  useEffect(() => {
    if (center && radius) {
      // Compute an approximate bounding box (in degrees) for the circle so we can call fitBounds
      // 1 deg latitude ~= 111,320 meters
      const lat = Number(center[0]);
      const lng = Number(center[1]);
      const latDelta = radius / 111320; // roughly meters -> degrees
      // Adjust longitude degrees by latitude (cosine) to get approximate degree width
      const lngDelta = radius / (111320 * Math.cos((lat * Math.PI) / 180) || 1);

      const southWest = [lat - latDelta, lng - lngDelta];
      const northEast = [lat + latDelta, lng + lngDelta];
      map.fitBounds([southWest, northEast], { padding: [20, 20] });
    }
  }, [center, radius, map]);
  return null;
}

export default function MapBox({ trip, events = [] }) { 
  
  // Check if we have valid coordinates for the circle
  const hasLocation = trip && trip.latitude != null && trip.longitude != null;
  
  // Create center point and set radius (in meters)
  const centerPoint = hasLocation ? [Number(trip.latitude), Number(trip.longitude)] : null;
  const radius = 500000; // 5km radius - adjust this value as needed

  // 5. Set a default position (for when there are no bounds)
  const defaultPosition = (trip && trip.latitude != null && trip.longitude != null)
    ? [Number(trip.latitude), Number(trip.longitude)]
    : [51.505, -0.09]; // Default to London

  // 6. Define our brand color for the outline
  const brandColor = '#4e73df';

  const mapStyles = {
    height: '300px',
    width: '100%',
    borderRadius: '0.25rem'
  };

  const eventsWithCoords = events.filter(ev => ev.latitude != null && ev.longitude != null);

  return (
    <Card className="shadow mb-4">
      <Card.Header className="py-3">
        <h6 className="m-0 font-weight-bold text-primary">Map</h6>
      </Card.Header>
      <Card.Body>
        <MapContainer center={defaultPosition} zoom={13} style={mapStyles}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Render the circle zone */}
          {centerPoint && (
  <Circle 
    center={centerPoint}
    radius={radius}
    pathOptions={{ 
      color: brandColor,
      weight: 2,
      fillColor: brandColor,
      fillOpacity: 0.15
    }} 
  />
)}

{centerPoint && radius && <FitCircle center={centerPoint} radius={radius} />}

          {/* 9. Render a STANDARD pin for EACH event */}
          {eventsWithCoords.map(event => (
            <Marker 
              key={event.event_id ?? event.id} 
              position={[Number(event.latitude), Number(event.longitude)]}
              // We removed the 'icon' prop to use the default pin
            >
              <Popup>
                <strong>{event.type || 'Event'}:</strong> {event.title}<br />
                {event.location_display_name || event.location_input}
              </Popup>
            </Marker>
          ))}
          
        </MapContainer>
      </Card.Body>
    </Card>
  );
}