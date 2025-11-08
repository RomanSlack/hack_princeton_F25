import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { TicketmasterClient } from './client.js';
import { searchToolDefinition, handleSearchTool } from './tools/index.js';

/**
 * Main server class for Ticketmaster MCP integration
 * @class TicketmasterServer
 */
export class TicketmasterServer {
    private client: TicketmasterClient;
    private server: Server;

    /**
     * Creates a new TicketmasterServer instance
     * @param {string} apiKey - Ticketmaster API key for authentication
     */
    constructor(apiKey: string) {
        this.client = new TicketmasterClient(apiKey);
        this.server = new Server(
            {
                name: 'ticketmaster',
                version: '0.1.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
        this.setupErrorHandling();
    }

    /**
     * Sets up MCP request handlers for tools
     * @private
     */
    private setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [searchToolDefinition],
        }));

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'search_ticketmaster') {
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${request.params.name}`
                );
            }

            return handleSearchTool(this.client, request.params.arguments);
        });
    }

    /**
     * Configures error handling and graceful shutdown
     * @private
     */
    private setupErrorHandling(): void {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    /**
     * Returns the underlying MCP server instance
     * @returns {Server} MCP server instance
     */
    getServer(): Server {
        return this.server;
    }
}

/**
 * Factory function for creating standalone server instances
 * Used by HTTP transport for session-based connections
 * @param {string} apiKey - Ticketmaster API key for authentication
 * @returns {Server} Configured MCP server instance
 */
export function createStandaloneServer(apiKey: string): Server {
    const server = new Server(
        {
            name: "ticketmaster-discovery",
            version: "0.1.0",
        },
        {
            capabilities: {
                tools: {},
            },
        },
    );

    const client = new TicketmasterClient(apiKey);

    // Set up handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [searchToolDefinition],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (request.params.name !== 'search_ticketmaster') {
            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
            );
        }

        return handleSearchTool(client, request.params.arguments);
    });

    return server;
}
