/**
 * Service Registry Client
 * Client-side utilities for service discovery and URL resolution
 * 
 * This module provides:
 * - Service URL resolution based on environment
 * - Caching of service information
 * - Fallback to static configuration
 * - Auto-detection of Codespaces environment
 */

import { apiClient } from './api-client';

export interface ServiceInfo {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  baseUrl: string;
  localUrl?: string;
  devUrl?: string;
  prodUrl?: string;
  activeUrl: string;
  port: number;
  healthPath: string;
  version: string;
  status: 'HEALTHY' | 'UNHEALTHY' | 'STARTING' | 'STOPPING';
  lastHeartbeat?: string;
  currentEnvironment: 'local' | 'codespaces' | 'production';
}

// Static fallback configuration
const STATIC_SERVICES: Record<string, Partial<ServiceInfo>> = {
  main: {
    name: 'main',
    displayName: 'Main Application',
    port: 8888,
    healthPath: '/api/health',
  },
  workspace: {
    name: 'workspace',
    displayName: 'Workspace Editor',
    port: 3000,
    healthPath: '/api/health',
  },
};

// Cache for service info
const serviceCache: Map<string, { data: ServiceInfo; timestamp: number }> = new Map();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Detect current environment from browser context
 */
export function detectEnvironment(): 'local' | 'codespaces' | 'production' {
  if (typeof window === 'undefined') {
    return 'local';
  }

  const hostname = window.location.hostname;

  // GitHub Codespaces detection
  if (hostname.includes('.app.github.dev') || hostname.includes('.preview.app.github.dev')) {
    return 'codespaces';
  }

  // Production detection (customize based on your domain)
  if (hostname.includes('ideahub.com') || hostname.includes('netlify.app')) {
    return 'production';
  }

  return 'local';
}

/**
 * Build service URL for Codespaces environment
 */
function buildCodespacesUrl(port: number): string {
  const currentUrl = window.location.origin;
  // Pattern: https://<codespace-name>-<port>.<domain>
  // Extract and replace the port
  const match = currentUrl.match(/^(https?:\/\/[^-]+-)\d+(.+)$/);
  if (match) {
    return `${match[1]}${port}${match[2]}`;
  }
  return currentUrl.replace(/-\d+\./, `-${port}.`);
}

/**
 * Build service URL based on current environment
 */
export function buildServiceUrl(port: number): string {
  const env = detectEnvironment();

  if (env === 'codespaces') {
    return buildCodespacesUrl(port);
  }

  if (env === 'production') {
    // In production, use the main domain with path routing or subdomains
    // This should be configured based on your production setup
    return window.location.origin;
  }

  return `http://localhost:${port}`;
}

/**
 * Get service information from registry
 */
export async function getService(name: string): Promise<ServiceInfo | null> {
  // Check cache first
  const cached = serviceCache.get(name);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const response = await apiClient.get<{
      data: ServiceInfo;
      success: boolean;
    }>(`/registry?name=${name}`);

    if (response.success && response.data) {
      serviceCache.set(name, { data: response.data, timestamp: Date.now() });
      return response.data;
    }
  } catch (error) {
    console.warn(`Failed to fetch service ${name} from registry, using fallback`, error);
  }

  // Fallback to static configuration
  return getFallbackService(name);
}

/**
 * Get fallback service info when registry is unavailable
 */
function getFallbackService(name: string): ServiceInfo | null {
  const staticConfig = STATIC_SERVICES[name];
  if (!staticConfig || !staticConfig.port) {
    return null;
  }

  const env = detectEnvironment();
  const activeUrl = buildServiceUrl(staticConfig.port);

  return {
    id: `fallback-${name}`,
    name: staticConfig.name || name,
    displayName: staticConfig.displayName || name,
    description: staticConfig.description,
    baseUrl: activeUrl,
    localUrl: `http://localhost:${staticConfig.port}`,
    devUrl: env === 'codespaces' ? activeUrl : undefined,
    activeUrl,
    port: staticConfig.port,
    healthPath: staticConfig.healthPath || '/api/health',
    version: '1.0.0',
    status: 'HEALTHY',
    currentEnvironment: env,
  };
}

/**
 * Get all registered services
 */
export async function getAllServices(): Promise<ServiceInfo[]> {
  try {
    const response = await apiClient.get<{
      data: ServiceInfo[];
      success: boolean;
    }>('/registry');

    if (response.success && response.data) {
      // Update cache
      response.data.forEach(service => {
        serviceCache.set(service.name, { data: service, timestamp: Date.now() });
      });
      return response.data;
    }
  } catch (error) {
    console.warn('Failed to fetch services from registry, using fallback', error);
  }

  // Return fallback services
  return Object.keys(STATIC_SERVICES)
    .map(name => getFallbackService(name))
    .filter((s): s is ServiceInfo => s !== null);
}

/**
 * Get the URL for a specific service
 * This is the main function to use when you need a service URL
 */
export async function getServiceUrl(serviceName: string): Promise<string> {
  const service = await getService(serviceName);
  if (service) {
    return service.activeUrl;
  }

  // Ultimate fallback - construct URL from static config
  const staticConfig = STATIC_SERVICES[serviceName];
  if (staticConfig?.port) {
    return buildServiceUrl(staticConfig.port);
  }

  throw new Error(`Unknown service: ${serviceName}`);
}

/**
 * Get workspace service URL - convenience method
 */
export async function getWorkspaceUrl(): Promise<string> {
  return getServiceUrl('workspace');
}

/**
 * Synchronous version using cached data or fallback
 * Use this when you need immediate URL without waiting for API
 */
export function getServiceUrlSync(serviceName: string): string {
  // Check cache first
  const cached = serviceCache.get(serviceName);
  if (cached) {
    return cached.data.activeUrl;
  }

  // Use fallback
  const staticConfig = STATIC_SERVICES[serviceName];
  if (staticConfig?.port) {
    return buildServiceUrl(staticConfig.port);
  }

  throw new Error(`Unknown service: ${serviceName}`);
}

/**
 * Preload service information (call this on app startup)
 */
export async function preloadServices(): Promise<void> {
  try {
    await getAllServices();
  } catch (error) {
    console.warn('Failed to preload services:', error);
  }
}

/**
 * Clear service cache
 */
export function clearServiceCache(): void {
  serviceCache.clear();
}

/**
 * Register a service (typically called by the service itself on startup)
 */
export async function registerService(config: {
  name: string;
  displayName?: string;
  description?: string;
  port: number;
  healthPath?: string;
  version?: string;
  prodUrl?: string;
}): Promise<ServiceInfo | null> {
  try {
    const response = await apiClient.post<{
      data: ServiceInfo;
      success: boolean;
    }>('/registry', config);

    if (response.success && response.data) {
      serviceCache.set(config.name, { data: response.data, timestamp: Date.now() });
      return response.data;
    }
  } catch (error) {
    console.error('Failed to register service:', error);
  }

  return null;
}

/**
 * Send heartbeat for a service
 */
export async function sendHeartbeat(serviceName: string): Promise<boolean> {
  try {
    const response = await apiClient.post<{
      success: boolean;
    }>('/registry?action=heartbeat', { name: serviceName });

    return response.success;
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
    return false;
  }
}
