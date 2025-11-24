// frontend/src/components/exportBookmarks.jsx
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
    // Wait a tick and check if the document has become hidden (user took action) OR rely on isSafari heuristic
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
