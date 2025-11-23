// backend/routes/mapsExport.js
const express = require('express');
const router = express.Router();

function buildKmlServer({ trip = null, events = [] } = {}) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n<name>Trip Export</name>\n`;
  const footer = `</Document>\n</kml>`;
  const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const placemark = (id, name, desc, lat, lon) => {
    if (lat == null || lon == null) return '';
    return `<Placemark id="${esc(id)}"><name>${esc(name)}</name><description>${esc(desc)}</description>` +
           `<Point><coordinates>${Number(lon)},${Number(lat)},0</coordinates></Point></Placemark>\n`;
  };

  let body = '';
  if (trip && trip.latitude != null && trip.longitude != null) {
    body += placemark('trip-center', trip.title || 'Trip center', trip.location_display_name || '', trip.latitude, trip.longitude);
  }

  events.forEach((ev, i) => {
    body += placemark(ev.event_id || `e${i}`, `${ev.type || 'Event'}: ${ev.title || ''}`, ev.location_display_name || '', ev.latitude, ev.longitude);
  });

  return header + body + footer;
}

// GET /maps/export?payload=<urlencoded JSON>
// Example: /maps/export?payload={"trip":{...},"events":[...]}
router.get('/export', (req, res) => {
  try {
    const payload = req.query.payload ? JSON.parse(req.query.payload) : null;
    if (!payload) return res.status(400).send('payload query param required (JSON with trip and events)');
    const kml = buildKmlServer(payload);
    res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
    res.setHeader('Content-Disposition', 'attachment; filename="trip-bookmarks.kml"');
    res.send(kml);
  } catch (err) {
    console.error('KML export error', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
