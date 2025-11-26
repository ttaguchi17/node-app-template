// frontend/src/components/exportBookmarks.jsx

/**
 * downloadKmlFile(kmlString, filename)
 * Utility to trigger download of a KML string as a .kml file.
 */
export function downloadKmlFile(kmlString, filename = 'trip-bookmarks.kml') {
  try {
    if (!kmlString || typeof kmlString !== 'string') {
      console.error('[exportBookmarks] downloadKmlFile called with invalid kmlString', kmlString);
      return;
    }

    if (!filename.toLowerCase().endsWith('.kml')) {
      filename = filename + '.kml';
    }

    const blob = new Blob([kmlString], { type: 'application/vnd.google-earth.kml+xml;charset=utf-8' });

    // msSaveOrOpenBlob (IE/old Edge)
    if (typeof navigator !== 'undefined' && navigator.msSaveOrOpenBlob) {
      console.log('[exportBookmarks] using msSaveOrOpenBlob fallback');
      return navigator.msSaveOrOpenBlob(blob, filename);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // For Safari, anchor must be in DOM for click to work reliably
    document.body.appendChild(a);

    console.log('[exportBookmarks] trigger download', { filename, url });

    // Attempt to click the anchor
    a.click();

    // Remove anchor and revoke URL shortly after
    a.remove();

    // Safari fallback: some WebKit builds ignore download attribute — open in new tab
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isSafari) {
      // Give the browser a short moment then open the object URL as a fallback
      setTimeout(() => {
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
          console.log('[exportBookmarks] Safari fallback opened object URL');
        } catch (e) {
          console.warn('[exportBookmarks] Safari fallback failed to open object URL', e);
        }
      }, 250);
    }

    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
        console.log('[exportBookmarks] revoked object URL');
      } catch (e) {
        console.warn('[exportBookmarks] revokeObjectURL failed', e);
      }
    }, 1500);
  } catch (err) {
    console.error('[exportBookmarks] downloadKmlFile error', err);
    alert('Download failed: ' + (err && err.message ? err.message : String(err)));
  }
}

/**
 * buildKml(bookmarks = [], options = {})
 *
 * Produces a KML string from an array of bookmark objects.
 * Each bookmark may have the shape:
 *   { name, lat, lng, description }
 * The function is defensive: it accepts `latitude`/`longitude`, `title`, etc.
 *
 * Returns: string (KML XML)
 */
export function buildKml(bookmarks = [], options = {}) {
  if (!Array.isArray(bookmarks)) bookmarks = [];

  const escapeXml = (s = '') => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c])
    );
  };

  const buildPlacemark = (b) => {
    // Normalize field names
    const name = escapeXml(b.name || b.title || 'Bookmark');
    const description = escapeXml(b.description || b.desc || b.notes || '');
    const lat =
      typeof b.lat === 'number'
        ? b.lat
        : typeof b.latitude === 'number'
          ? b.latitude
          : (b.lat ? Number(b.lat) : NaN);
    const lng =
      typeof b.lng === 'number'
        ? b.lng
        : typeof b.longitude === 'number'
          ? b.longitude
          : (b.lng ? Number(b.lng) : NaN);

    // If lat/lng are missing or invalid, skip coordinates but still include placemark (optional)
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return `
  <Placemark>
    <name>${name}</name>
    ${description ? `<description>${description}</description>` : ''}
    <Point><coordinates>${lng},${lat},0</coordinates></Point>
  </Placemark>`;
    } else {
      // Provide a placemark without Point if no coordinates available
      return `
  <Placemark>
    <name>${name}</name>
    ${description ? `<description>${description}</description>` : ''}
  </Placemark>`;
    }
  };

  const placemarks = bookmarks.map(buildPlacemark).join('\n');

  const docName = escapeXml(options.documentName || 'Bookmarks');
  const docDesc = escapeXml(options.documentDescription || '');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${docName}</name>
    ${docDesc ? `<description>${docDesc}</description>` : ''}
    ${placemarks}
  </Document>
</kml>`;
}
