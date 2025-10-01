# Migration Guide: Supabase to Prisma ORM and React to Next.js

This document outlines the migration process from Supabase to Prisma ORM and from React (Vite) to Next.js for the IdeaHub project.

## Overview

The migration involves:
1. Database layer: Supabase Client → Prisma ORM
2. Frontend framework: React (Vite) → Next.js (App Router)
3. Authentication: Supabase Auth → NextAuth.js (or custom implementation)
4. API Layer: Supabase RPC → Next.js API Routes

## Completed Steps

### 1. Prisma Setup ✅
- Installed Prisma dependencies (`@prisma/client` and `prisma`)
- Created Prisma schema (`/prisma/schema.prisma`) with all tables:
  - Users
  - Ideas
  - Comments
  - Stars
  - Follows
  - IdeaCollaborators
  - Notifications
  - Workspaces
  - WorkspaceCollaborators

### 2. Next.js Setup ✅
- Installed Next.js and NextAuth
- Created Next.js configuration (`next.config.js`)
- Updated `tsconfig.json` for Next.js compatibility
- Created basic app directory structure (`/app`)
- Created root layout and home page

### 3. Prisma Services ✅
- Created Prisma client singleton (`/src/lib/prisma/client.ts`)
- Implemented Prisma services:
  - `PrismaUsersService` - User CRUD operations
  - `PrismaIdeasService` - Idea CRUD operations
- Services implement the same interface as Supabase services for easier migration

### 4. Next.js API Routes ✅
- Created API route structure under `/app/api`
- Implemented:
  - `/api/users` - User search and retrieval
  - `/api/ideas` - Idea listing and creation

### 5. Package Configuration ✅
- Updated `package.json` with Next.js scripts:
  - `dev` - Run Next.js development server
  - `build` - Build Next.js app (includes Prisma generation)
  - `prisma:generate` - Generate Prisma client
  - `prisma:migrate` - Run Prisma migrations
  - `prisma:studio` - Open Prisma Studio
- Added `postinstall` hook to generate Prisma client

## Remaining Steps

### Phase 1: Database Setup
- [ ] Set up PostgreSQL database
- [ ] Configure `DATABASE_URL` in `.env` file
- [ ] Run `npm run prisma:migrate` to create database schema
- [ ] Optionally, migrate existing Supabase data to new database

### Phase 2: Complete Prisma Services
- [ ] Implement remaining Prisma services:
  - Notifications service
  - Activities service
  - Stats service
  - Workspaces service
  - Comments service
- [ ] Add transaction support for complex operations
- [ ] Implement error handling and logging

### Phase 3: Authentication Migration
- [ ] Set up NextAuth.js
- [ ] Create authentication API routes (`/api/auth/[...nextauth]`)
- [ ] Implement sign-up, sign-in, and sign-out flows
- [ ] Create authentication context for client-side
- [ ] Update protected routes and middleware

### Phase 4: Complete API Routes
- [ ] Create API routes for all operations:
  - User operations (profile, follow/unfollow)
  - Idea operations (star, fork, update, delete)
  - Comment operations
  - Notification operations
  - Workspace operations
- [ ] Add authentication middleware
- [ ] Implement rate limiting and validation

### Phase 5: Frontend Migration
- [ ] Create Next.js pages from React components:
  - Home page
  - Explore page
  - Dashboard
  - Idea workspace
  - Settings
  - Profile pages
- [ ] Update navigation (React Router → Next.js navigation)
- [ ] Migrate React components to use Next.js patterns:
  - Client Components (`'use client'`)
  - Server Components (default)
  - Server Actions for mutations
- [ ] Update data fetching:
  - Replace Supabase client calls with API routes
  - Use SWR or React Query for client-side data fetching
  - Use Server Components for SSR data

### Phase 6: Remove Supabase Dependencies
- [ ] Remove Supabase packages:
  - `@supabase/supabase-js`
  - `@supabase/ssr`
- [ ] Delete Supabase configuration files:
  - `/src/lib/supabase.ts`
  - `/src/lib/supabase-browser.ts`
- [ ] Remove Supabase service files:
  - `/src/services/api/*.ts` (old Supabase services)
- [ ] Update all imports throughout the codebase

### Phase 7: Testing and Deployment
- [ ] Test all features thoroughly
- [ ] Set up environment variables for production
- [ ] Configure deployment (Vercel, Railway, etc.)
- [ ] Set up database hosting (Supabase PostgreSQL, Railway, etc.)
- [ ] Deploy application
- [ ] Monitor and fix any issues

## Database Schema Mapping

The Prisma schema maintains the same structure as the original Supabase schema:

| Supabase Table | Prisma Model | Notes |
|----------------|--------------|-------|
| users | User | Field names converted to camelCase |
| ideas | Idea | Added relations for forks, collaborators |
| comments | Comment | Self-referential relation for replies |
| stars | Star | Many-to-many relation between users and ideas |
| follows | Follow | Self-referential relation for user follows |
| idea_collaborators | IdeaCollaborator | Role-based access control |
| notifications | Notification | Polymorphic relations |
| workspaces | Workspace | Added from migration |
| workspace_collaborators | WorkspaceCollaborator | Unique constraint on workspace + user |

## Running the Project

### During Migration (Vite)
```bash
npm run dev:vite
npm run build:vite
```

### After Migration (Next.js)
```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Database management
npm run prisma:migrate
npm run prisma:studio
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ideahub?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Optional
NODE_ENV="development"
```

## Important Notes

1. **Gradual Migration**: The codebase currently supports both Vite (React) and Next.js. You can continue using Vite during development with `npm run dev:vite`.

2. **Database Connection**: Ensure your PostgreSQL database is accessible before running Prisma migrations.

3. **Prisma Client**: Run `npm run prisma:generate` after any schema changes.

4. **Authentication**: NextAuth.js is installed but not yet configured. You'll need to set up providers and session management.

5. **API Routes**: The API routes are basic implementations. Add proper authentication, validation, and error handling.

## Troubleshooting

### Prisma Client Generation Fails
- Ensure `DATABASE_URL` is set in `.env`
- Check network connectivity to Prisma binaries
- Try running `npx prisma generate` directly

### Next.js Build Errors
- Ensure all TypeScript errors are resolved
- Check that `tsconfig.json` is properly configured
- Verify all imports use correct paths

### Database Migration Issues
- Check PostgreSQL connection
- Ensure database user has necessary permissions
- Review migration files in `/prisma/migrations`

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
