#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';

// Load environment variables
loadEnv();

import { loadConfig } from './config.js';
import { parseArgs } from './cli.js';
import { PlanningServer } from './server.js';
import { runStdioTransport, startHttpTransport } from './transport/index.js';

/**
 * Main entry point for the AI Planning MCP Server
 *
 * Transport selection logic:
 * 1. --stdio flag forces STDIO transport
 * 2. --port flag or PORT env var triggers HTTP transport
 * 3. Default: STDIO for local development
 */
async function main() {
    try {
        const config = loadConfig();
        const cliOptions = parseArgs();

        // Determine transport mode
        const shouldUseHttp = cliOptions.port || (process.env.PORT && !cliOptions.stdio);

        // Override port from CLI if provided
        if (cliOptions.port) {
            config.port = cliOptions.port;
        }

        if (shouldUseHttp) {
            // HTTP transport for production/cloud deployment
            startHttpTransport(config);
        } else {
            // STDIO transport for local development
            const server = new PlanningServer();
            await runStdioTransport(server.getServer());
        }
    } catch (error) {
        console.error("Fatal error running AI Planning server:", error);
        process.exit(1);
    }
}

// Run the server
main();