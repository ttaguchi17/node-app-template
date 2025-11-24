// backend/mappers.js
function mapExtractedDataToEvent(extractedData) {
  const event = {
    title: '',
    type: extractedData.type === 'flight' ? 'Flight' : 'Hotel',
    start_time: null,
    end_time: null,
    location_input: '',
    location_display_name: '',
    latitude: null,
    longitude: null,
    details: {} // Store full extracted data + email body
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

    // Store all flight data in details
    event.details = {
      booking_reference: extractedData.booking_reference || null,
      airline: extractedData.airline || null,
      departure_airport: extractedData.departure_airport || null,
      arrival_airport: extractedData.arrival_airport || null,
      departure_date: extractedData.departure_date || null,
      price_usd: extractedData.price_usd || null,
      email_id: extractedData.id || null,
      email_subject: extractedData.title || null
    };

  } else if (extractedData.type === 'hotel') {
    event.title = extractedData.hotel_name || 'Hotel Reservation';
    event.location_input = extractedData.hotel_name || '';

    if (extractedData.check_in_date) {
      const checkIn = new Date(extractedData.check_in_date);
      if (!isNaN(checkIn)) {
        event.start_time = checkIn.toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    if (extractedData.check_out_date) {
      const checkOut = new Date(extractedData.check_out_date);
      if (!isNaN(checkOut)) {
        event.end_time = checkOut.toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    // Store all hotel data in details
    event.details = {
      booking_reference: extractedData.booking_reference || null,
      hotel_name: extractedData.hotel_name || null,
      address: extractedData.address || null,
      check_in_date: extractedData.check_in_date || null,
      check_out_date: extractedData.check_out_date || null,
      nights: extractedData.nights || null,
      price_usd: extractedData.price_usd || null,
      email_id: extractedData.id || null,
      email_subject: extractedData.title || null
    };
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
