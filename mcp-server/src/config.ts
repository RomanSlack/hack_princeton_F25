/**
 * Configuration interface for the AI Planning MCP Server
 * @interface Config
 */
export interface Config {
    /** Port number for HTTP server */
    port: number;
    /** Current environment mode */
    nodeEnv: 'development' | 'production';
    /** Convenience flag for production environment */
    isProduction: boolean;
}

/**
 * Loads configuration from environment variables
 * @returns {Config} Configuration object
 */
export function loadConfig(): Config {
    const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const port = parseInt(process.env.PORT || '3001', 10);

    return {
        port,
        nodeEnv,
        isProduction: nodeEnv === 'production',
    };
}