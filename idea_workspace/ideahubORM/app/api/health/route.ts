/**
 * Health Check API Endpoint
 * GET /api/health
 * 
 * Used by the service registry to verify service availability
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'workspace',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
