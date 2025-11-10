function mapExtractedDataToEvent(extractedData) {
  const event = {
    title: '',
    type: extractedData.type === 'flight' ? 'Flight' : 'Hotel',
    start_time: null,
    end_time: null,
    location_input: '',
    location_display_name: '',
    latitude: null,
    longitude: null
  };

  if (extractedData.type === 'flight') {
    event.title = `Flight ${extractedData.airline || ''} ${extractedData.booking_reference || ''}`.trim();
    if (extractedData.departure_airport && extractedData.arrival_airport) {
      event.title = `Flight ${extractedData.departure_airport} → ${extractedData.arrival_airport}`;
    }
    
    if (extractedData.departure_date) {
      const date = new Date(extractedData.departure_date);
      if (!isNaN(date)) {
        event.start_time = date.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    event.location_input = extractedData.departure_airport || '';
    event.location_display_name = `${extractedData.departure_airport || 'Unknown'} → ${extractedData.arrival_airport || 'Unknown'}`;
    
  } else if (extractedData.type === 'hotel') {
    event.title = extractedData.hotel_name || 'Hotel Reservation';
    event.location_input = extractedData.hotel_name || '';
    
    if (extractedData.check_in) {
      const checkIn = new Date(extractedData.check_in);
      if (!isNaN(checkIn)) {
        event.start_time = checkIn.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
    
    if (extractedData.check_out) {
      const checkOut = new Date(extractedData.check_out);
      if (!isNaN(checkOut)) {
        event.end_time = checkOut.toISOString().slice(0, 19).replace('T', ' ');
      }
    }
  }

  return event;
}

function mapToItineraryEventPreview(extractedData) {
  const event = mapExtractedDataToEvent(extractedData);
  return {
    title: event.title,
    type: event.type,
    start_time: event.start_time,
    end_time: event.end_time,
    location: event.location_input
  };
}

module.exports = {
  mapExtractedDataToEvent,
  mapToItineraryEventPreview
};