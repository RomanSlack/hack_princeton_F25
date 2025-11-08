import { TicketmasterClient } from '../client.js';
import { SearchType } from '../types.js';
import { formatResults } from '../formatters.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

export const searchToolDefinition = {
    name: 'search_ticketmaster',
    description: 'Search for events, venues, or attractions on Ticketmaster',
    inputSchema: {
        type: 'object',
        properties: {
            type: {
                type: 'string',
                enum: ['event', 'venue', 'attraction'],
                description: 'Type of search to perform'
            },
            keyword: {
                type: 'string',
                description: 'Search keyword or term'
            },
            startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format'
            },
            endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format'
            },
            city: {
                type: 'string',
                description: 'City name'
            },
            stateCode: {
                type: 'string',
                description: 'State code (e.g., NY, CA)'
            },
            countryCode: {
                type: 'string',
                description: 'Country code (e.g., US, CA)'
            },
            venueId: {
                type: 'string',
                description: 'Specific venue ID to search'
            },
            attractionId: {
                type: 'string',
                description: 'Specific attraction ID to search'
            },
            classificationName: {
                type: 'string',
                description: 'Event classification/category (e.g., "Sports", "Music")'
            },
            format: {
                type: 'string',
                enum: ['json', 'text'],
                description: 'Output format (defaults to json)',
                default: 'json'
            }
        },
        required: ['type'],
    },
};

export async function handleSearchTool(
    client: TicketmasterClient,
    args: any
): Promise<{ content: Array<{ type: string; text: string }> }> {
    const {
        type,
        format = 'json',
        keyword,
        startDate,
        endDate,
        ...otherParams
    } = args as {
        type: SearchType;
        format?: 'json' | 'text';
        keyword?: string;
        startDate?: string;
        endDate?: string;
        city?: string;
        stateCode?: string;
        countryCode?: string;
        venueId?: string;
        attractionId?: string;
        classificationName?: string;
    };

    try {
        const query = {
            keyword,
            startDateTime: startDate ? new Date(startDate) : undefined,
            endDateTime: endDate ? new Date(endDate) : undefined,
            ...otherParams
        };

        let results;
        switch (type) {
            case 'event':
                results = await client.searchEvents(query);
                break;
            case 'venue':
                results = await client.searchVenues(query);
                break;
            case 'attraction':
                results = await client.searchAttractions(query);
                break;
            default:
                throw new McpError(
                    ErrorCode.InvalidParams,
                    `Invalid search type: ${type}`
                );
        }

        const content = format === 'json'
            ? JSON.stringify(results, null, 2)
            : formatResults(type, results, format !== 'text');

        return {
            content: [
                {
                    type: 'text',
                    text: content,
                },
            ],
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            } as any;
        }
        throw error;
    }
}
