/**
 * Configuration interface for the Ticketmaster MCP Server
 * @interface Config
 */
export interface Config {
    /** Ticketmaster API key for authentication */
    apiKey: string;
    /** Port number for HTTP server */
    port: number;
    /** Current environment mode */
    nodeEnv: 'development' | 'production';
    /** Convenience flag for production environment */
    isProduction: boolean;
}

/**
 * Loads and validates configuration from environment variables
 * @returns {Config} Validated configuration object
 * @throws {Error} If required environment variables are missing
 */
export function loadConfig(): Config {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    if (!apiKey) {
        throw new Error('TICKETMASTER_API_KEY environment variable is required');
    }

    const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const port = parseInt(process.env.PORT || '3001', 10);

    return {
        apiKey,
        port,
        nodeEnv,
        isProduction: nodeEnv === 'production',
    };
}