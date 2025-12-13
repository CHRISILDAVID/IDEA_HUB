/**
 * Service Registry Seed Script
 * Run this to initialize the service registry with default services
 * 
 * Usage: npx tsx scripts/seed-services.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SERVICES = [
  {
    name: 'main',
    displayName: 'Main Application',
    description: 'Core IdeaHub application - authentication, ideas management, social features',
    port: 8888,
    healthPath: '/api/health',
    version: '1.0.0',
    localUrl: 'http://localhost:8888',
    prodUrl: 'https://ideahub.netlify.app',
  },
  {
    name: 'workspace',
    displayName: 'Workspace Editor',
    description: 'Canvas and document editor service - Excalidraw whiteboard + rich text editor',
    port: 3000,
    healthPath: '/api/health',
    version: '1.0.0',
    localUrl: 'http://localhost:3000',
    prodUrl: 'https://workspace.ideahub.com',
  },
];

async function seedServices() {
  console.log('🌱 Seeding service registry...\n');

  for (const service of SERVICES) {
    try {
      const result = await prisma.service.upsert({
        where: { name: service.name },
        update: {
          ...service,
          baseUrl: service.localUrl,
          status: 'HEALTHY',
          lastHeartbeat: new Date(),
        },
        create: {
          ...service,
          baseUrl: service.localUrl,
          status: 'HEALTHY',
          lastHeartbeat: new Date(),
          environment: 'development',
        },
      });

      console.log(`✅ ${service.displayName} (${service.name})`);
      console.log(`   Port: ${service.port}`);
      console.log(`   Local: ${service.localUrl}`);
      console.log(`   ID: ${result.id}\n`);
    } catch (error) {
      console.error(`❌ Failed to seed ${service.name}:`, error);
    }
  }

  console.log('🎉 Service registry seeded successfully!');
}

seedServices()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
