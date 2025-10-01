# IdeaHub Architecture

This document describes the architecture of the migrated IdeaHub application using Next.js and Prisma.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                          │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  Server Pages   │  │ Client Components│  │   Static Pages  ││
│  │  (SSR/SSG)      │  │  ('use client')  │  │                 ││
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘│
│           │                    │                     │         │
└───────────┼────────────────────┼─────────────────────┼─────────┘
            │                    │                     │
            │         ┌──────────▼─────────────────┐   │
            │         │    Client-Side Fetching    │   │
            │         │    (fetch API routes)      │   │
            │         └──────────┬─────────────────┘   │
            │                    │                     │
┌───────────▼────────────────────▼─────────────────────▼─────────┐
│                        NEXT.JS SERVER                           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    App Router                            │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐  │  │
│  │  │   Pages    │ │  Layouts   │ │    Middleware      │  │  │
│  │  │            │ │            │ │  (Route Protection)│  │  │
│  │  └────────────┘ └────────────┘ └─────────┬──────────┘  │  │
│  └───────────────────────────────────────────┼─────────────┘  │
│                                              │                 │
│  ┌──────────────────────────────────────────▼─────────────┐  │
│  │                  API Routes                             │  │
│  │                                                          │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐ │  │
│  │  │   /users   │ │   /ideas   │ │  /notifications    │ │  │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────────────┘ │  │
│  │        │              │              │                 │  │
│  │  ┌─────▼──────┐ ┌─────▼──────┐ ┌─────▼──────────────┐ │  │
│  │  │/workspaces │ │   /auth    │ │    (more...)       │ │  │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────────────┘ │  │
│  └────────┼──────────────┼──────────────┼─────────────────┘  │
│           │              │              │                     │
│  ┌────────▼──────────────▼──────────────▼─────────────────┐  │
│  │              NextAuth.js Middleware                     │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐  │  │
│  │  │ Session Mgmt│ │ JWT Tokens  │ │  Callbacks      │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────┘  │  │
│  └───────────────────────────┬─────────────────────────────┘  │
│                              │                                 │
│  ┌───────────────────────────▼─────────────────────────────┐  │
│  │                  Service Layer                          │  │
│  │                                                          │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌───────────────┐  │  │
│  │  │    Users     │ │    Ideas     │ │  Notifications│  │  │
│  │  │   Service    │ │   Service    │ │    Service    │  │  │
│  │  └──────┬───────┘ └──────┬───────┘ └───────┬───────┘  │  │
│  │         │                │                 │           │  │
│  │  ┌──────▼───────┐ ┌──────▼───────┐ ┌───────▼───────┐  │  │
│  │  │  Workspaces  │ │   Comments   │ │     Stats     │  │  │
│  │  │   Service    │ │   Service    │ │    Service    │  │  │
│  │  └──────┬───────┘ └──────┬───────┘ └───────┬───────┘  │  │
│  │         │                │                 │           │  │
│  │         └────────────────┼─────────────────┘           │  │
│  └──────────────────────────┼─────────────────────────────┘  │
│                             │                                 │
│  ┌──────────────────────────▼─────────────────────────────┐  │
│  │                  Prisma Client                          │  │
│  │  ┌───────────────────────────────────────────────────┐ │  │
│  │  │  Type-safe Query Builder & ORM                    │ │  │
│  │  │  - Connection Pooling                             │ │  │
│  │  │  - Query Optimization                             │ │  │
│  │  │  - Type Generation                                │ │  │
│  │  └───────────────────────┬───────────────────────────┘ │  │
│  └──────────────────────────┼─────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                     PostgreSQL Database                      │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Users   │ │  Ideas   │ │ Comments │ │ Notifications│  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Stars   │ │ Follows  │ │Workspace │ │   (more...)  │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### 1. Client Layer (Browser)

#### Server Components (Default)
- Rendered on the server
- Direct database access via Prisma
- SEO-friendly
- No JavaScript sent to client
- Examples: Home page, idea listing

#### Client Components (`'use client'`)
- Interactive UI elements
- State management (React hooks)
- Event handlers
- Real-time updates
- Examples: Forms, modals, interactive widgets

#### Static Pages
- Pre-rendered at build time
- Cached and served from CDN
- Ultra-fast loading
- Examples: Marketing pages, documentation

### 2. Next.js Server Layer

#### App Router
- File-based routing
- Layouts and templates
- Loading and error states
- Parallel routes
- Intercepting routes

#### Middleware
- Runs before requests are completed
- Route protection
- Authentication checks
- Redirects
- Header manipulation

#### API Routes
REST endpoints for client-side operations:
- `GET /api/ideas` - List ideas
- `POST /api/ideas` - Create idea
- `GET /api/users?query=name` - Search users
- `GET /api/notifications` - User notifications
- `GET /api/workspaces` - User workspaces

### 3. Authentication Layer (NextAuth.js)

#### Session Management
```typescript
// Server-side
const session = await getServerSession(authOptions);

// Client-side
const { data: session } = useSession();
```

#### JWT Tokens
- Encrypted session tokens
- Stored in secure cookies
- Auto-refresh mechanism
- Custom claims support

#### Callbacks
- `jwt()` - Modify token
- `session()` - Modify session
- `signIn()` - Control sign-in
- `redirect()` - Custom redirects

### 4. Service Layer

#### Business Logic
All services follow the same pattern:
```typescript
class PrismaServiceName {
  static async operation(params): Promise<ApiResponse<T>> {
    try {
      const result = await prisma.model.operation(...);
      return {
        data: transform(result),
        message: 'Success',
        success: true
      };
    } catch (error) {
      handleError(error);
      throw error;
    }
  }
}
```

#### Services Overview

| Service | Responsibilities |
|---------|-----------------|
| UsersService | CRUD, follow/unfollow, search, profile |
| IdeasService | CRUD, star/unstar, fork, filters |
| NotificationsService | Create, read, mark as read |
| CommentsService | CRUD, threading, voting |
| WorkspacesService | CRUD, collaboration, permissions |
| StatsService | Analytics, statistics, trending |

### 5. Database Layer (Prisma)

#### Type Safety
```typescript
// Full autocomplete and type checking
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    ideas: true,
    followers: true,
  }
});
// TypeScript knows exact shape of 'user'
```

#### Query Optimization
- Automatic query batching
- N+1 query prevention
- Connection pooling
- Prepared statements

#### Migrations
```bash
# Create migration
prisma migrate dev --name add_feature

# Apply to production
prisma migrate deploy
```

## Data Flow Examples

### Example 1: User Creates an Idea

```
1. User fills form in Client Component
   ↓
2. Form submits to /api/ideas (POST)
   ↓
3. API route validates authentication
   ↓
4. Calls PrismaIdeasService.createIdea()
   ↓
5. Service uses Prisma client
   ↓
6. Prisma generates SQL and executes
   ↓
7. Database inserts record
   ↓
8. Prisma returns typed result
   ↓
9. Service transforms data
   ↓
10. API route returns JSON
    ↓
11. Client updates UI
```

### Example 2: Server-Side Page Render

```
1. User navigates to /ideas/[id]
   ↓
2. Next.js matches route
   ↓
3. Server Component renders
   ↓
4. Directly calls PrismaIdeasService.getIdea()
   ↓
5. Prisma fetches from database
   ↓
6. Component renders with data
   ↓
7. HTML sent to client
   ↓
8. Browser displays page
```

### Example 3: Protected Route Access

```
1. User navigates to /dashboard
   ↓
2. Middleware intercepts request
   ↓
3. Checks for valid session
   ↓
4. If no session → redirect to /login
   ↓
5. If session exists → allow access
   ↓
6. Page renders with user data
```

## Security Architecture

### Authentication Flow

```
┌──────────┐      1. Login      ┌─────────────┐
│  Client  │ ─────────────────> │ /api/auth   │
└──────────┘                     └──────┬──────┘
     ▲                                  │
     │                                  │ 2. Verify
     │                                  │ credentials
     │                                  ▼
     │                           ┌─────────────┐
     │                           │  Prisma     │
     │                           │  Users DB   │
     │                           └──────┬──────┘
     │                                  │
     │                                  │ 3. User found
     │                                  ▼
     │                           ┌─────────────┐
     │         4. JWT            │  NextAuth   │
     │         Token             │  Create     │
     │    ◄─────────────────────  Session     │
     │                           └─────────────┘
     │
     │ 5. Set Cookie
     └────────────
```

### Authorization Flow

```
Request → Middleware → Check Session → Allow/Deny
                           │
                           ├─ Valid Session → Continue
                           │
                           └─ Invalid/No Session → Redirect to Login
```

### Data Access Control

```typescript
// Service layer checks permissions
static async getWorkspace(id: string, userId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id,
      OR: [
        { userId },              // Owner
        { isPublic: true },      // Public
        {                        // Collaborator
          collaborators: {
            some: { userId }
          }
        }
      ]
    }
  });
  
  if (!workspace) throw new Error('Access denied');
  return workspace;
}
```

## Deployment Architecture

### Vercel Deployment

```
┌─────────────────────────────────────┐
│         Vercel Edge Network         │
│  ┌───────────────────────────────┐  │
│  │    Global CDN (Static Files)  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Serverless Functions        │  │
│  │   (API Routes)                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Next.js Server              │  │
│  │   (SSR/SSG)                   │  │
│  └───────────────────────────────┘  │
└──────────┬──────────────────────────┘
           │
           │ Prisma Connection
           ▼
┌─────────────────────────────────────┐
│   PostgreSQL Database               │
│   (Supabase/Railway/Neon)           │
└─────────────────────────────────────┘
```

### Railway Deployment

```
┌─────────────────────────────────────┐
│         Railway Platform            │
│  ┌───────────────────────────────┐  │
│  │   Next.js Application         │  │
│  │   (Single Container)          │  │
│  └─────────┬─────────────────────┘  │
│            │                         │
│  ┌─────────▼─────────────────────┐  │
│  │   PostgreSQL Container        │  │
│  │   (Internal Network)          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Performance Optimizations

### 1. Database Level
- Indexes on frequently queried fields
- Connection pooling (max 10 connections)
- Query optimization with Prisma

### 2. Application Level
- Server Components for SSR
- Client Components only where needed
- API route caching
- Edge caching for static content

### 3. Network Level
- CDN for static assets
- Gzip compression
- HTTP/2 support
- Image optimization (Next.js Image)

## Monitoring & Observability

```
┌──────────────┐
│  Application │
└──────┬───────┘
       │
       ├─────────────> Error Tracking (Sentry)
       │
       ├─────────────> Performance Monitoring (Vercel Analytics)
       │
       ├─────────────> Database Monitoring (Prisma Studio)
       │
       └─────────────> Logs (Console/Cloud Provider)
```

## Development Workflow

```
┌─────────────┐
│  Developer  │
└──────┬──────┘
       │
       │ 1. Edit Code
       ▼
┌─────────────────┐
│  Local Dev Env  │
│  (npm run dev)  │
└──────┬──────────┘
       │
       │ 2. Hot Reload
       ▼
┌─────────────────┐
│  Test Changes   │
└──────┬──────────┘
       │
       │ 3. Commit
       ▼
┌─────────────────┐
│   Git Push      │
└──────┬──────────┘
       │
       │ 4. Auto Deploy
       ▼
┌─────────────────┐
│  Production     │
└─────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
- Stateless API routes
- JWT-based auth (no session store)
- Database connection pooling
- CDN for static content

### Vertical Scaling
- Optimize queries
- Add database indexes
- Cache frequently accessed data
- Use Server Components

### Database Scaling
- Read replicas for queries
- Write to primary
- Connection pooling
- Query optimization

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 | React framework |
| Routing | App Router | File-based routing |
| API | Next.js API Routes | REST endpoints |
| Auth | NextAuth.js | Authentication |
| ORM | Prisma | Database abstraction |
| Database | PostgreSQL | Data persistence |
| Language | TypeScript | Type safety |
| Styling | TailwindCSS | UI styling |
| State | Redux Toolkit | Client state |

## Further Reading

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
