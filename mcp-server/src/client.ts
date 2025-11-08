import axios, { AxiosError } from 'axios';
import {
    SearchType,
    TicketmasterApiError,
    TicketmasterAttraction,
    TicketmasterError,
    TicketmasterEvent,
    TicketmasterResponse,
    TicketmasterVenue
} from './types.js';

/**
 * Client for interacting with the Ticketmaster Discovery API
 */
export class TicketmasterClient {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://app.ticketmaster.com/discovery/v2';

    constructor(apiKey: string) {
        if (!apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = apiKey;
    }

    /**
     * Formats a date range for the Ticketmaster API
     * @param startDate Start of the date range
     * @param endDate End of the date range
     * @returns Formatted date range string
     */
    formatDateRange(startDate: Date, endDate: Date): string {
        // Set start time to beginning of day in UTC
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);

        // Set end time to end of day in UTC
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);

        return `${start.toISOString().split('.')[0]}Z,${end.toISOString().split('.')[0]}Z`;
    }

    /**
     * Search for events, venues, or attractions
     * @param type Type of search (event, venue, attraction)
     * @param query Search query parameters
     * @returns Array of matching items
     */
    async search<T extends TicketmasterEvent | TicketmasterVenue | TicketmasterAttraction>(
        type: SearchType,
        query: {
            keyword?: string;
            startDateTime?: Date;
            endDateTime?: Date;
            city?: string;
            stateCode?: string;
            countryCode?: string;
            venueId?: string;
            attractionId?: string;
            classificationName?: string;
            size?: number;
        } = {}
    ): Promise<T[]> {
        try {
            const endpoint = `${this.baseUrl}/${type}s`;
            const params: Record<string, string | number> = {
                apikey: this.apiKey,
                size: query.size || 20
            };

            if (query.keyword) {
                params.keyword = query.keyword;
            }

            if (query.startDateTime && query.endDateTime) {
                const dateRange = this.formatDateRange(query.startDateTime, query.endDateTime);
                params.startDateTime = dateRange.split(',')[0];
                params.endDateTime = dateRange.split(',')[1];
            }

            if (query.city) {
                params.city = query.city;
            }

            if (query.stateCode) {
                params.stateCode = query.stateCode;
            }

            if (query.countryCode) {
                params.countryCode = query.countryCode;
            }

            if (query.venueId) {
                params.venueId = query.venueId;
            }

            if (query.attractionId) {
                params.attractionId = query.attractionId;
            }

            if (query.classificationName) {
                params.classificationName = query.classificationName;
            }

            const response = await axios.get<TicketmasterResponse>(endpoint, { params });

            const items = response.data._embedded?.[`${type}s` as keyof typeof response.data._embedded] as T[] || [];
            return items;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<TicketmasterError>;
                const apiError = axiosError.response?.data?.fault;
                
                throw new TicketmasterApiError(
                    apiError?.faultstring || 'Failed to fetch results',
                    apiError?.detail?.errorcode,
                    axiosError.response?.status
                );
            }
            
            throw error;
        }
    }

    /**
     * Search for events
     */
    async searchEvents(query: Parameters<typeof this.search>[1] = {}): Promise<TicketmasterEvent[]> {
        return this.search<TicketmasterEvent>('event', query);
    }

    /**
     * Search for venues
     */
    async searchVenues(query: Parameters<typeof this.search>[1] = {}): Promise<TicketmasterVenue[]> {
        return this.search<TicketmasterVenue>('venue', query);
    }

    /**
     * Search for attractions
     */
    async searchAttractions(query: Parameters<typeof this.search>[1] = {}): Promise<TicketmasterAttraction[]> {
        return this.search<TicketmasterAttraction>('attraction', query);
    }
}
