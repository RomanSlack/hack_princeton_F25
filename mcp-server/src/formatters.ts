import { TicketmasterEvent, TicketmasterVenue, TicketmasterAttraction } from './types.js';

export function formatEvent(event: TicketmasterEvent, structured = true): string {
    const date = new Date(event.dates.start.dateTime);
    
    if (!structured) {
        return `${event.name} - ${date.toLocaleDateString()}`;
    }

    const venue = event._embedded?.venues?.[0];
    const price = event.priceRanges?.[0];
    
    return [
        `${event.name}`,
        `Date: ${date.toLocaleDateString()} at ${event.dates.start.localTime}`,
        venue ? `Venue: ${venue.name} - ${venue.city.name}, ${venue.state.stateCode}` : '',
        price ? `Price: ${price.currency} ${price.min}-${price.max}` : 'Price: TBA',
        `Status: ${event.dates.status.code}`,
        `More info: ${event.url}`,
    ].filter(Boolean).join('\n');
}

export function formatVenue(venue: TicketmasterVenue, structured = true): string {
    if (!structured) {
        return venue.name;
    }
    
    return [
        `${venue.name}`,
        `Location: ${venue.address.line1}`,
        `${venue.city.name}, ${venue.state.stateCode} ${venue.postalCode}`,
        `${venue.country.name}`,
        venue.url ? `More info: ${venue.url}` : '',
    ].filter(Boolean).join('\n');
}

export function formatAttraction(attraction: TicketmasterAttraction, structured = true): string {
    if (!structured) {
        return attraction.name;
    }
    
    const classification = attraction.classifications?.[0];
    
    return [
        `${attraction.name}`,
        classification ? `Type: ${classification.segment.name} - ${classification.genre.name}` : '',
        attraction.url ? `More info: ${attraction.url}` : '',
    ].filter(Boolean).join('\n');
}

export function formatResults(
    type: 'event' | 'venue' | 'attraction',
    results: Array<TicketmasterEvent | TicketmasterVenue | TicketmasterAttraction>,
    structured = true
): string {
    if (results.length === 0) {
        return 'No results found.';
    }

    const formatters = {
        event: formatEvent,
        venue: formatVenue,
        attraction: formatAttraction,
    };

    const formatter = formatters[type];
    return results.map(item => formatter(item as any, structured)).join('\n\n');
}
