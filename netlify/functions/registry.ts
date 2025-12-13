/**
 * Netlify Function: Service Registry
 * Microservice discovery and management endpoint
 * 
 * Endpoints:
 * - GET /.netlify/functions/registry - List all services or get specific service
 * - POST /.netlify/functions/registry - Register/update a service
 * - DELETE /.netlify/functions/registry - Deregister a service
 * - POST /.netlify/functions/registry?action=heartbeat - Update service heartbeat
 */

import type { Handler, HandlerEvent } from '@netlify/functions';
import prisma from '../../src/lib/prisma';

// Environment detection helper
function detectEnvironment(): 'local' | 'codespaces' | 'production' {
  const host = process.env.CODESPACE_NAME ? 'codespaces' : 
               process.env.NODE_ENV === 'production' ? 'production' : 'local';
  return host as 'local' | 'codespaces' | 'production';
}

// Build URL based on environment
function buildServiceUrl(port: number, env: 'local' | 'codespaces' | 'production'): string {
  if (env === 'codespaces') {
    const codespaceName = process.env.CODESPACE_NAME;
    const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
    return `https://${codespaceName}-${port}.${domain}`;
  }
  
  if (env === 'production') {
    // In production, services should register with their actual URLs
    return '';
  }
  
  return `http://localhost:${port}`;
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};

    // GET - List services or get specific service
    if (event.httpMethod === 'GET') {
      // Get specific service by name
      if (params.name) {
        const service = await prisma.service.findUnique({
          where: { name: params.name },
        });

        if (!service) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Service not found' }),
          };
        }

        // Return URL based on current environment
        const env = detectEnvironment();
        const activeUrl = env === 'codespaces' ? service.devUrl :
                         env === 'production' ? service.prodUrl :
                         service.localUrl;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            data: {
              ...service,
              activeUrl: activeUrl || service.baseUrl,
              currentEnvironment: env,
            },
            success: true,
          }),
        };
      }

      // List all services
      const services = await prisma.service.findMany({
        orderBy: { name: 'asc' },
      });

      const env = detectEnvironment();

      // Add active URL to each service
      const servicesWithActiveUrl = services.map(service => ({
        ...service,
        activeUrl: env === 'codespaces' ? service.devUrl :
                   env === 'production' ? service.prodUrl :
                   service.localUrl || service.baseUrl,
        currentEnvironment: env,
      }));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          data: servicesWithActiveUrl,
          environment: env,
          success: true,
        }),
      };
    }

    // POST - Register or update a service
    if (event.httpMethod === 'POST') {
      const action = params.action;

      // Heartbeat update
      if (action === 'heartbeat') {
        const { name } = JSON.parse(event.body || '{}');

        if (!name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Service name is required' }),
          };
        }

        const service = await prisma.service.update({
          where: { name },
          data: {
            lastHeartbeat: new Date(),
            status: 'HEALTHY',
          },
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            data: service,
            success: true,
            message: 'Heartbeat recorded',
          }),
        };
      }

      // Register/update service
      const {
        name,
        displayName,
        description,
        port,
        healthPath,
        version,
        localUrl,
        devUrl,
        prodUrl,
      } = JSON.parse(event.body || '{}');

      if (!name || !port) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Service name and port are required' }),
        };
      }

      const env = detectEnvironment();
      const autoDevUrl = buildServiceUrl(port, 'codespaces');
      const autoLocalUrl = buildServiceUrl(port, 'local');

      // Upsert service (create or update)
      const service = await prisma.service.upsert({
        where: { name },
        update: {
          displayName: displayName || name,
          description,
          port,
          healthPath: healthPath || '/api/health',
          version: version || '1.0.0',
          localUrl: localUrl || autoLocalUrl,
          devUrl: devUrl || autoDevUrl,
          prodUrl,
          baseUrl: env === 'codespaces' ? (devUrl || autoDevUrl) :
                   env === 'production' ? prodUrl :
                   (localUrl || autoLocalUrl),
          status: 'HEALTHY',
          lastHeartbeat: new Date(),
          environment: env,
        },
        create: {
          name,
          displayName: displayName || name,
          description,
          port,
          healthPath: healthPath || '/api/health',
          version: version || '1.0.0',
          localUrl: localUrl || autoLocalUrl,
          devUrl: devUrl || autoDevUrl,
          prodUrl,
          baseUrl: env === 'codespaces' ? (devUrl || autoDevUrl) :
                   env === 'production' ? prodUrl :
                   (localUrl || autoLocalUrl),
          status: 'HEALTHY',
          lastHeartbeat: new Date(),
          environment: env,
        },
      });

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          data: service,
          success: true,
          message: 'Service registered successfully',
        }),
      };
    }

    // DELETE - Deregister a service
    if (event.httpMethod === 'DELETE') {
      const { name } = JSON.parse(event.body || '{}');

      if (!name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Service name is required' }),
        };
      }

      await prisma.service.delete({
        where: { name },
      });

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'Service deregistered successfully',
        }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Registry error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
