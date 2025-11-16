// services/geocoding.js

// --- 1. ADD THE nodeFetch HELPER ---
// (Copied from your working gmail.js file)
async function nodeFetch(url, options) {
  if (typeof fetch === 'function') {
    return fetch(url, options);
  }
  const mod = await import('node-fetch');
  const nf = mod && (mod.default || mod);
  return nf(url, options);
}

// --- 2. YOUR ORIGINAL FUNCTION (with logging) ---
async function geocodeLocation(location_input) {
  if (!location_input) {
    console.warn('🌍 Geocoding: No location input provided');
    return null;
  }
  
  console.log(`🌍 Geocoding: Requesting geocode for "${location_input}"`);
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location_input)}&format=json&limit=1&addressdetails=1&accept-language=en`;
    console.log(`🌍 Geocoding URL: ${url}`);
    
    const geoResponse = await nodeFetch(url, { 
      headers: { 
        'User-Agent': 'TravelApp/1.0 (NodeApp)' 
      } 
    });

    console.log(`🌍 Geocoding response status: ${geoResponse.status}`);
    
    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      console.log(`🌍 Geocoding response data:`, geoData);
      
      if (geoData && geoData.length > 0) {
        const topResult = geoData[0];
        const result = {
          location_display_name: topResult.display_name,
          latitude: parseFloat(topResult.lat),
          longitude: parseFloat(topResult.lon)
        };
        console.log(`✅ Geocoding SUCCESS:`, result);
        return result;
      } else {
        console.warn(`🌍 Geocoding: No results returned for "${location_input}"`);
      }
    } else {
      console.error(`🌍 Geocoding API error: HTTP ${geoResponse.status}`);
    }
    return null;
  } catch (error) {
    console.error('❌ Geocoding failed:', error);
    return null;
  }
}module.exports = geocodeLocation;