export type SearchType = 'event' | 'venue' | 'attraction';

export interface TicketmasterEvent {
    id: string;
    name: string;
    type: string;
    url: string;
    locale: string;
    dates: {
        start: {
            localDate: string;
            localTime: string;
            dateTime: string;
        };
        timezone?: string;
        status: {
            code: string;
        };
    };
    priceRanges?: Array<{
        type: string;
        currency: string;
        min: number;
        max: number;
    }>;
    images: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
    }>;
    _embedded?: {
        venues?: TicketmasterVenue[];
        attractions?: TicketmasterAttraction[];
    };
}

export interface TicketmasterVenue {
    id: string;
    name: string;
    type: string;
    url?: string;
    locale: string;
    postalCode?: string;
    timezone?: string;
    city: {
        name: string;
    };
    state: {
        name: string;
        stateCode: string;
    };
    country: {
        name: string;
        countryCode: string;
    };
    address: {
        line1: string;
    };
    location?: {
        longitude: string;
        latitude: string;
    };
}

export interface TicketmasterAttraction {
    id: string;
    name: string;
    type: string;
    url?: string;
    locale: string;
    images?: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
    }>;
    classifications?: Array<{
        primary: boolean;
        segment: {
            id: string;
            name: string;
        };
        genre: {
            id: string;
            name: string;
        };
    }>;
}

export interface TicketmasterResponse {
    _embedded?: {
        events?: TicketmasterEvent[];
        venues?: TicketmasterVenue[];
        attractions?: TicketmasterAttraction[];
    };
    page: {
        size: number;
        totalElements: number;
        totalPages: number;
        number: number;
    };
}

export interface TicketmasterError {
    fault: {
        faultstring: string;
        detail: {
            errorcode: string;
        };
    };
}

export class TicketmasterApiError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly status?: number
    ) {
        super(message);
        this.name = 'TicketmasterApiError';
    }
}
