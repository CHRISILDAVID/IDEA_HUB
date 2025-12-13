# Service Registry Architecture

## Overview

The IdeaHub platform uses a **Service Registry** pattern for microservice discovery and management. This enables dynamic URL resolution across different environments (local development, GitHub Codespaces, and production) without hardcoding service locations.

## Problem Statement

IdeaHub consists of multiple services:
- **Main App (React/Vite)** - Port 8888 - Authentication, ideas CRUD, social features
- **Workspace Service (Next.js)** - Port 3000 - Canvas editor and rich text document editing

**The Challenge:**
- In local development: `http://localhost:3000`
- In GitHub Codespaces: `https://<codespace-name>-3000.app.github.dev`
- In production: `https://workspace.ideahub.com`

Hardcoding URLs doesn't work across environments. The service registry solves this by providing dynamic service discovery.

## Architecture Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        IDEA_HUB Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Service Registry (Netlify Function)            │   │
│  │              /.netlify/functions/registry                │   │
│  │                                                          │   │
│  │  Database: PostgreSQL (Prisma)                           │   │
│  │  • Service metadata (name, URLs, ports)                  │   │
│  │  • Health status tracking                                │   │
│  │  • Environment-aware URL resolution                      │   │
│  │  • Automatic Codespaces detection                        │   │
│  └───────────────────┬──────────────────────────────────────┘   │
│                      │                                          │
│       ┌──────────────┼──────────────────┐                       │
│       ▼              ▼                  ▼                       │
│  ┌──────────┐  ┌──────────┐      ┌──────────┐                  │
│  │   Main   │  │Workspace │      │  Future  │                  │
│  │   App    │  │ Service  │      │ Services │                  │
│  │          │  │          │      │          │                  │
│  │ Port     │  │ Port     │      │ Port     │                  │
│  │ 8888     │  │ 3000     │      │ XXXX     │                  │
│  │          │  │          │      │          │                  │
│  │ • Auth   │  │ • Canvas │      │ • AI Gen │                  │
│  │ • Ideas  │  │ • Editor │      │ • Export │                  │
│  │ • Social │  │ • Docs   │      │ • Media  │                  │
│  └──────────┘  └──────────┘      └──────────┘                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database Model (Prisma Schema)

**Location:** `prisma/schema.prisma`

```prisma
enum ServiceStatus {
  HEALTHY
  UNHEALTHY
  STARTING
  STOPPING
}

model Service {
  id            String        @id @default(uuid())
  name          String        @unique
  displayName   String        @map("display_name")
  description   String?
  
  // URL Configuration
  baseUrl       String        @map("base_url")
  localUrl      String?       @map("local_url")
  devUrl        String?       @map("dev_url")
  prodUrl       String?       @map("prod_url")
  
  // Service metadata
  version       String        @default("1.0.0")
  port          Int
  healthPath    String        @default("/api/health") @map("health_path")
  
  // Status tracking
  status        ServiceStatus @default(STARTING)
  lastHeartbeat DateTime?     @map("last_heartbeat")
  environment   String        @default("development")
  
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  
  @@map("services")
  @@index([name])
  @@index([status])
}
```

### 2. Registry API (Netlify Function)

**Location:** `netlify/functions/registry.ts`

#### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/registry` | List all services |
| `GET` | `/registry?name=workspace` | Get specific service |
| `POST` | `/registry` | Register/update a service |
| `POST` | `/registry?action=heartbeat` | Update service heartbeat |
| `DELETE` | `/registry` | Deregister a service |

#### Environment Detection

```typescript
function detectEnvironment(): 'local' | 'codespaces' | 'production' {
  if (process.env.CODESPACE_NAME) return 'codespaces';
  if (process.env.NODE_ENV === 'production') return 'production';
  return 'local';
}

function buildServiceUrl(port: number, env: string): string {
  if (env === 'codespaces') {
    const codespaceName = process.env.CODESPACE_NAME;
    const domain = process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || 'app.github.dev';
    return `https://${codespaceName}-${port}.${domain}`;
  }
  if (env === 'production') return ''; // Use registered prodUrl
  return `http://localhost:${port}`;
}
```

### 3. Client Library - React App

**Location:** `src/lib/service-registry.ts`

#### Main Functions

```typescript
// Get service URL with caching
async function getServiceUrl(serviceName: string): Promise<string>

// Get workspace service URL - convenience method
async function getWorkspaceUrl(): Promise<string>

// Synchronous version using cached data
function getServiceUrlSync(serviceName: string): string

// Preload services on app startup
async function preloadServices(): Promise<void>

// Register a service
async function registerService(config): Promise<ServiceInfo | null>

// Send heartbeat
async function sendHeartbeat(serviceName: string): Promise<boolean>
```

#### Features

- **Caching**: 1-minute TTL cache to reduce API calls
- **Fallback**: Static configuration when registry is unavailable
- **Auto-detection**: Detects Codespaces URLs from browser context
- **Environment-aware**: Returns correct URL based on current environment

### 4. Client Library - Next.js Workspace

**Location:** `idea_workspace/ideahubORM/lib/service-registry.ts`

#### Main Functions

```typescript
// Register this service on startup
async function registerWithRegistry(): Promise<boolean>

// Send heartbeat to registry
async function sendHeartbeat(): Promise<boolean>

// Start periodic heartbeat
function startHeartbeat(intervalMs?: number): void

// Get main app URL
function getMainAppUrl(): string

// Get API base URL
function getApiBaseUrl(): string
```

### 5. Health Check Endpoint

**Location:** `idea_workspace/ideahubORM/app/api/health/route.ts`

```typescript
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'workspace',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}
```

### 6. Static Configuration (Fallback)

**Location:** `services.config.json`

```json
{
  "services": {
    "main": {
      "name": "main",
      "displayName": "Main Application",
      "port": 8888,
      "urls": {
        "local": "http://localhost:8888",
        "production": "https://ideahub.netlify.app"
      }
    },
    "workspace": {
      "name": "workspace",
      "displayName": "Workspace Editor",
      "port": 3000,
      "urls": {
        "local": "http://localhost:3000",
        "production": "https://workspace.ideahub.com"
      }
    }
  }
}
```

### 7. Seed Script

**Location:** `scripts/seed-services.ts`

Initializes the service registry with default services:

```bash
npx tsx scripts/seed-services.ts
```

## Usage Flow

### Creating an Idea (Cross-Service Communication)

```
┌────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Create Idea" button                            │
│    → Navigate to /ideas/new                                    │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│ 2. CreateIdeaRedirect Component                                │
│    → Creates idea via IdeasService.createIdea()                │
│    → API returns idea + workspaceId                            │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│ 3. Service Discovery                                           │
│    → Call: await getWorkspaceUrl()                             │
│    → Registry checks cache (1min TTL)                          │
│    → If cached: return URL                                     │
│    → If not: fetch from /registry?name=workspace               │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│ 4. Environment Detection                                       │
│                                                                │
│    Local Dev:                                                  │
│    → http://localhost:3000                                     │
│                                                                │
│    GitHub Codespaces:                                          │
│    → https://obscure-space-orbit-xxx-3000.app.github.dev       │
│                                                                │
│    Production:                                                 │
│    → https://workspace.ideahub.com                             │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│ 5. Redirect to Workspace                                       │
│    → window.location.href = `${workspaceUrl}/workspace/${id}`  │
│    → User lands in the workspace editor                        │
└────────────────────────────────────────────────────────────────┘
```

### Workspace Service Startup

```
┌────────────────────────────────────────────────────────────────┐
│ 1. Next.js App Starts                                          │
│    → Port 3000                                                 │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│ 2. Self-Registration (Optional)                                │
│    → Call: await registerWithRegistry()                        │
│    → POST /registry with service config                        │
│    → Registry stores service info                              │
└───────────────────────────┬────────────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────────────┐
│ 3. Start Heartbeat                                             │
│    → startHeartbeat(30000) // Every 30 seconds                 │
│    → POST /registry?action=heartbeat                           │
│    → Updates lastHeartbeat timestamp                           │
│    → Status set to HEALTHY                                     │
└────────────────────────────────────────────────────────────────┘
```

## Environment Detection Logic

### Browser Context (Client-Side)

```typescript
function detectEnvironment(): 'local' | 'codespaces' | 'production' {
  const hostname = window.location.hostname;
  
  // GitHub Codespaces
  if (hostname.includes('.app.github.dev')) {
    return 'codespaces';
  }
  
  // Production (customize based on your domain)
  if (hostname.includes('ideahub.com') || hostname.includes('netlify.app')) {
    return 'production';
  }
  
  return 'local';
}
```

### Server Context (Server-Side)

```typescript
function detectEnvironment(): 'local' | 'codespaces' | 'production' {
  if (process.env.CODESPACE_NAME) {
    return 'codespaces';
  }
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  return 'local';
}
```

### Codespaces URL Construction

```typescript
function buildCodespacesUrl(port: number): string {
  const currentUrl = window.location.origin;
  // Pattern: https://<codespace-name>-<port>.<domain>
  // Replace the port in current URL
  return currentUrl.replace(/-\d+\./, `-${port}.`);
}

// Example:
// Current: https://obscure-space-orbit-xxx-8888.app.github.dev
// Port 3000: https://obscure-space-orbit-xxx-3000.app.github.dev
```

## Integration Examples

### Example 1: Get Workspace URL in React Component

```typescript
import { getWorkspaceUrl } from '@/lib/service-registry';

async function redirectToWorkspace(workspaceId: string) {
  const workspaceUrl = await getWorkspaceUrl();
  window.location.href = `${workspaceUrl}/workspace/${workspaceId}`;
}
```

### Example 2: Synchronous URL Resolution

```typescript
import { getServiceUrlSync } from '@/lib/service-registry';

// Use cached value or fallback (no async needed)
function getWorkspaceLink(workspaceId: string) {
  const workspaceUrl = getServiceUrlSync('workspace');
  return `${workspaceUrl}/workspace/${workspaceId}`;
}
```

### Example 3: Preload on App Startup

```typescript
// In App.tsx
import { preloadServices } from '@/lib/service-registry';

// Preload service registry on app initialization
preloadServices().catch(console.warn);

function App() {
  // ... rest of app
}
```

### Example 4: Register New Service

```typescript
import { registerService } from '@/lib/service-registry';

await registerService({
  name: 'ai-service',
  displayName: 'AI Generation Service',
  description: 'AI-powered idea generation and enhancement',
  port: 4000,
  healthPath: '/health',
  version: '1.0.0',
  prodUrl: 'https://ai.ideahub.com',
});
```

## Benefits

### 1. **Environment Agnostic**
Services work seamlessly across local, Codespaces, and production without configuration changes.

### 2. **Scalable**
Easy to add new services without modifying existing code. Just register the service and other services can discover it.

### 3. **Decoupled Architecture**
Services don't need to know about each other's locations. The registry handles discovery.

### 4. **Health Monitoring**
Built-in health checks and heartbeat tracking for service availability monitoring.

### 5. **Fallback Mechanism**
Static configuration ensures services work even if the registry is unavailable.

### 6. **Zero Configuration for Codespaces**
Automatically detects and constructs correct Codespaces URLs without manual setup.

## Testing

### Initialize the Registry

```bash
# Seed the database with default services
npx tsx scripts/seed-services.ts
```

### Start Services

```bash
# Terminal 1: Main App (port 8888)
npm run dev

# Terminal 2: Workspace Service (port 3000)
cd idea_workspace/ideahubORM
npm run dev
```

### Test Service Discovery

```bash
# Check registered services
curl http://localhost:8888/.netlify/functions/registry

# Get specific service
curl http://localhost:8888/.netlify/functions/registry?name=workspace

# Check workspace health
curl http://localhost:3000/api/health
```

### Test Idea Creation Flow

1. Navigate to `/ideas/new` in the main app
2. Component creates idea via API
3. Service registry resolves workspace URL
4. Redirects to workspace editor
5. Verify URL is correct for your environment

## Future Extensions

### Planned Services

- **AI Service** (Port 4000) - Idea generation, enhancement, analysis
- **Export Service** (Port 5000) - PDF, PNG, SVG export of ideas
- **Analytics Service** (Port 6000) - Usage analytics and insights
- **Media Service** (Port 7000) - Image uploads, processing, storage

### Potential Features

- **Load Balancing**: Multiple instances of same service
- **Service Mesh**: Advanced routing and traffic management
- **Circuit Breaker**: Automatic failover when services are unhealthy
- **Service Versioning**: Support multiple versions of same service
- **API Gateway**: Single entry point with path-based routing
- **Monitoring Dashboard**: Real-time service health visualization

## Troubleshooting

### Service Not Found

```typescript
// Check if service exists
const services = await getAllServices();
console.log(services);

// Clear cache and retry
clearServiceCache();
const url = await getServiceUrl('workspace');
```

### URL Construction Issues

```typescript
// Check environment detection
import { detectEnvironment, buildServiceUrl } from '@/lib/service-registry';

console.log('Environment:', detectEnvironment());
console.log('Workspace URL:', buildServiceUrl(3000));
```

### Registry API Not Responding

```typescript
// The client library automatically falls back to static config
// Verify fallback is working:
import { getServiceUrlSync } from '@/lib/service-registry';

const url = getServiceUrlSync('workspace'); // Uses fallback
console.log('Fallback URL:', url);
```

## Deployment Considerations

### Environment Variables

```env
# Development
DATABASE_URL=postgresql://...
NODE_ENV=development

# Production
DATABASE_URL=postgresql://...
NODE_ENV=production

# Codespaces (auto-detected)
CODESPACE_NAME=obscure-space-orbit-xxx
GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN=app.github.dev
```

### Production Setup

1. **Deploy Main App** to Netlify
   - Set production DATABASE_URL
   - Configure custom domain

2. **Deploy Workspace Service** to Vercel/Railway
   - Set production DATABASE_URL
   - Configure custom domain or subdomain

3. **Update Service Registry**
   ```bash
   # Register services with production URLs
   curl -X POST https://ideahub.netlify.app/.netlify/functions/registry \
     -H "Content-Type: application/json" \
     -d '{
       "name": "workspace",
       "port": 3000,
       "prodUrl": "https://workspace.ideahub.com"
     }'
   ```

## Security

### Registry Access

Currently, the registry is open for reads but should be protected in production:

```typescript
// Add authentication to registry endpoint
const authHeader = event.headers.authorization;
if (!authHeader && event.httpMethod === 'POST') {
  return { statusCode: 401, body: 'Unauthorized' };
}
```

### CORS Configuration

Registry allows CORS from all origins. In production, restrict to known domains:

```typescript
const allowedOrigins = [
  'https://ideahub.netlify.app',
  'https://workspace.ideahub.com',
];
```

## Documentation

- **API Documentation**: Swagger/OpenAPI spec can be generated for registry endpoints
- **Service Contracts**: Each service should document its API contract
- **Health Check Standard**: All services must implement `/api/health`

## Conclusion

The Service Registry architecture provides a robust, scalable foundation for IdeaHub's microservices platform. It solves the environment-specific URL problem while maintaining flexibility for future growth.

Key takeaway: **Services discover each other dynamically, making the platform portable across any environment.**
