/**
 * Service Registry Client for Next.js Workspace Service
 * 
 * This module provides service discovery utilities for the workspace service.
 * It handles:
 * - Self-registration with the main app's registry
 * - URL resolution for communicating with other services
 * - Environment detection (local, Codespaces, production)
 */

// Service configuration
const SERVICE_CONFIG = {
  name: 'workspace',
  displayName: 'Workspace Editor',
  description: 'Canvas and document editor for ideas',
  port: 3000,
  healthPath: '/api/health',
  version: '1.0.0',
};

// Static fallback for other services
const STATIC_SERVICES: Record<string, { port: number; healthPath?: string }> = {
  main: { port: 8888, healthPath: '/api/health' },
  workspace: { port: 3000, healthPath: '/api/health' },
};

export interface ServiceInfo {
  name: string;
  displayName: string;
  activeUrl: string;
  port: number;
  status: string;
}

/**
 * Detect current environment
 */
export function detectEnvironment(): 'local' | 'codespaces' | 'production' {
  // Server-side detection
  if (typeof window === 'undefined') {
    if (process.env.CODESPACE_NAME) {
      return 'codespaces';
    }
    if (process.env.NODE_ENV === 'production') {
      return 'production';
    }
    return 'local';
  }

  // Client-side detection
  const hostname = window.location.hostname;

  if (hostname.includes('.app.github.dev') || hostname.includes('.preview.app.github.dev')) {
    return 'codespaces';
  }

  if (hostname.includes('ideahub.com') || hostname.includes('netlify.app')) {
    return 'production';
  }

  return 'local';
}

/**
 * Build URL for a service based on environment
 */
export function buildServiceUrl(port: number): string {
  const env = detectEnvironment();

  // Server-side URL building
  if (typeof window === 'undefined') {
    if (env === 'codespaces') {
      const codespaceName = process.env.CODESPACE_NAME;
      const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
      return `https://${codespaceName}-${port}.${domain}`;
    }
    return `http://localhost:${port}`;
  }

  // Client-side URL building
  if (env === 'codespaces') {
    const currentUrl = window.location.origin;
    // Replace port in Codespaces URL pattern
    return currentUrl.replace(/-\d+\./, `-${port}.`);
  }

  if (env === 'production') {
    // In production, services might use subdomains or path routing
    return window.location.origin;
  }

  return `http://localhost:${port}`;
}

/**
 * Get the main app URL
 */
export function getMainAppUrl(): string {
  return buildServiceUrl(STATIC_SERVICES.main.port);
}

/**
 * Get the API base URL (main app's Netlify functions)
 */
export function getApiBaseUrl(): string {
  return `${getMainAppUrl()}/.netlify/functions`;
}

/**
 * Get current service URL
 */
export function getCurrentServiceUrl(): string {
  return buildServiceUrl(SERVICE_CONFIG.port);
}

/**
 * Register this service with the registry
 * Call this on service startup
 */
export async function registerWithRegistry(): Promise<boolean> {
  try {
    const apiUrl = getApiBaseUrl();
    
    const response = await fetch(`${apiUrl}/registry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...SERVICE_CONFIG,
        devUrl: buildServiceUrl(SERVICE_CONFIG.port),
        localUrl: `http://localhost:${SERVICE_CONFIG.port}`,
      }),
    });

    if (response.ok) {
      console.log('[Service Registry] Successfully registered workspace service');
      return true;
    } else {
      console.warn('[Service Registry] Failed to register:', await response.text());
      return false;
    }
  } catch (error) {
    console.warn('[Service Registry] Registration failed:', error);
    return false;
  }
}

/**
 * Send heartbeat to registry
 */
export async function sendHeartbeat(): Promise<boolean> {
  try {
    const apiUrl = getApiBaseUrl();
    
    const response = await fetch(`${apiUrl}/registry?action=heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: SERVICE_CONFIG.name }),
    });

    return response.ok;
  } catch (error) {
    console.warn('[Service Registry] Heartbeat failed:', error);
    return false;
  }
}

/**
 * Start heartbeat interval
 */
let heartbeatInterval: NodeJS.Timeout | null = null;

export function startHeartbeat(intervalMs: number = 30000): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
  
  // Send initial heartbeat
  sendHeartbeat();
  
  // Set up interval
  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
  }, intervalMs);
}

export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

/**
 * Get service URL by name
 */
export async function getServiceUrl(serviceName: string): Promise<string> {
  try {
    const apiUrl = getApiBaseUrl();
    
    const response = await fetch(`${apiUrl}/registry?name=${serviceName}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.activeUrl) {
        return data.data.activeUrl;
      }
    }
  } catch (error) {
    console.warn(`[Service Registry] Failed to get ${serviceName} URL:`, error);
  }

  // Fallback to static config
  const staticConfig = STATIC_SERVICES[serviceName];
  if (staticConfig) {
    return buildServiceUrl(staticConfig.port);
  }

  throw new Error(`Unknown service: ${serviceName}`);
}
