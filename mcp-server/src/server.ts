import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    CallToolRequestSchema,
    ErrorCode,
    ListToolsRequestSchema,
    McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { planToolDefinition, handlePlanTool } from './tools/index.js';

/**
 * Main server class for AI Planning MCP integration
 * @class PlanningServer
 */
export class PlanningServer {
    private server: Server;

    /**
     * Creates a new PlanningServer instance
     */
    constructor() {
        this.server = new Server(
            {
                name: 'ai-planning',
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
            tools: [planToolDefinition],
        }));

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            if (request.params.name !== 'plan') {
                throw new McpError(
                    ErrorCode.MethodNotFound,
                    `Unknown tool: ${request.params.name}`
                );
            }

            return handlePlanTool(request.params.arguments);
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
 * @returns {Server} Configured MCP server instance
 */
export function createStandaloneServer(): Server {
    const server = new Server(
        {
            name: "ai-planning",
            version: "0.1.0",
        },
        {
            capabilities: {
                tools: {},
            },
        },
    );

    // Set up handlers
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [planToolDefinition],
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (request.params.name !== 'plan') {
            throw new McpError(
                ErrorCode.MethodNotFound,
                `Unknown tool: ${request.params.name}`
            );
        }

        return handlePlanTool(request.params.arguments);
    });

    return server;
}
