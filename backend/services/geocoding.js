async function geocodeLocation(location_input) {
  if (!location_input) return null;
  
  try {
    const geoResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location_input)}&format=json&limit=1&addressdetails=1&accept-language=en`,
      { 
        headers: { 
          'User-Agent': 'TravelApp/1.0 (your-email@example.com)' 
        } 
      }
    );

    if (geoResponse.ok) {
      const geoData = await geoResponse.json();
      if (geoData && geoData.length > 0) {
        const topResult = geoData[0];
        return {
          location_display_name: topResult.display_name,
          latitude: parseFloat(topResult.lat),
          longitude: parseFloat(topResult.lon)
        };
      }
    }
    return null;
  } catch (error) {
    console.error('Geocoding failed:', error);
    return null;
  }
}

module.exports = geocodeLocation;