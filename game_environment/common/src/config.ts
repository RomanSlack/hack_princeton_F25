export interface ServerConfig {
    readonly hostname: string;
    readonly port: number;
    readonly maxConnectionsPerIP: number;
    readonly enableRateLimiting: boolean;
}

export interface ClientConfig {
    readonly serverAddress: string;
    readonly serverPort: number;
    readonly useSecureWebSocket: boolean;
}

// Default configurations
export const DefaultServerConfig: ServerConfig = {
    hostname: "0.0.0.0", // Bind to all network interfaces for external connections
    port: parseInt(process.env.PORT || "8000"), // Use Cloud Run's PORT env var if available
    maxConnectionsPerIP: 5, // Prevent single IP from spamming connections
    enableRateLimiting: true
};

// Client will auto-detect server address based on environment
export function getClientConfig(): ClientConfig {
    // Check if we're in production (served from actual server)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    // Get server address from environment variable or use auto-detection
    const serverHost = import.meta.env.VITE_SERVER_HOST || (isProduction ? window.location.hostname : 'localhost');
    const serverPort = import.meta.env.VITE_SERVER_PORT ? parseInt(import.meta.env.VITE_SERVER_PORT) : 8000;
    const useSecure = import.meta.env.VITE_USE_WSS === 'true' || window.location.protocol === 'https:';

    return {
        serverAddress: serverHost,
        serverPort: serverPort,
        useSecureWebSocket: useSecure
    };
}

export function getWebSocketURL(config: ClientConfig): string {
    const protocol = config.useSecureWebSocket ? 'wss' : 'ws';
    
    // Don't include port for standard ports (443 for wss, 80 for ws)
    const isStandardPort = (config.useSecureWebSocket && config.serverPort === 443) || 
                          (!config.useSecureWebSocket && config.serverPort === 80);
    
    if (isStandardPort) {
        return `${protocol}://${config.serverAddress}/play`;
    }
    
    return `${protocol}://${config.serverAddress}:${config.serverPort}/play`;
}
