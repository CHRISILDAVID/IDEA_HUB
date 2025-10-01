# IDEA HUB - Migration to Next.js and Prisma ORM

This document outlines the migration from Supabase to Prisma ORM and from React (Vite) to Next.js.

## Migration Overview

### What Changed

1. **Database Layer**: Migrated from Supabase client library to Prisma ORM
2. **Frontend Framework**: Migrated from React with Vite to Next.js 14 (App Router)
3. **Service Layer**: Completely refactored to use Prisma instead of Supabase queries
4. **Project Structure**: Reorganized to follow Next.js conventions

### Migration Components

#### 1. Prisma Schema (`prisma/schema.prisma`)

All database tables have been converted to Prisma models:
- Users
- Ideas
- Comments
- Stars
- Follows
- Notifications
- IdeaCollaborators
- Workspaces
- WorkspaceCollaborators

#### 2. New Service Layer (`src/lib/services/`)

Service classes have been rewritten to use Prisma:
- `IdeasService` - CRUD operations for ideas
- `UsersService` - User management and relationships
- `AuthService` - Authentication (basic implementation)

#### 3. Next.js Structure

```
app/
├── layout.tsx          # Root layout
├── page.tsx           # Home page
├── globals.css        # Global styles
└── api/               # API routes
    ├── ideas/
    │   └── route.ts
    ├── users/
    └── auth/
```

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ideahub?schema=public"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

3. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

4. **Run database migrations**
   ```bash
   npm run prisma:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:3000`

## Database Migration

The Prisma schema (`prisma/schema.prisma`) contains all the models from the previous Supabase schema. To migrate your existing data:

1. **Option 1: Fresh Start**
   - Run `npx prisma migrate dev --name init` to create a new database
   - This will create all tables from scratch

2. **Option 2: Migrate Existing Data**
   - Export data from Supabase
   - Use Prisma's introspection: `npx prisma db pull`
   - Adjust the schema as needed
   - Generate migrations: `npx prisma migrate dev`

## Key Differences

### Service Layer

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('ideas')
  .select('*')
  .eq('author_id', userId);
```

**After (Prisma):**
```typescript
const ideas = await prisma.idea.findMany({
  where: { authorId: userId },
  include: { author: true }
});
```

### API Routes

Next.js uses file-based routing for API endpoints:
- `/app/api/ideas/route.ts` → `/api/ideas`
- Supports GET, POST, PUT, DELETE methods in the same file

### Authentication

The current implementation has a basic AuthService. For production, consider:
- Implementing NextAuth.js
- Adding JWT tokens
- Session management with cookies

## Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run Next.js linter
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

## Legacy Scripts (for reference)

- `npm run legacy:dev` - Run old Vite dev server
- `npm run legacy:build` - Build with Vite

## Next Steps

1. **Complete the migration of React components**
   - Convert pages from `src/pages` to Next.js app directory
   - Update routing from react-router to Next.js routing
   - Migrate context providers

2. **Implement proper authentication**
   - Set up NextAuth.js or custom auth solution
   - Add middleware for protected routes
   - Implement session management

3. **Add remaining API routes**
   - Comments API
   - Notifications API
   - Workspaces API
   - User management API

4. **Update client-side data fetching**
   - Replace Supabase client calls with fetch to Next.js API routes
   - Implement SWR or React Query for data fetching
   - Add loading and error states

5. **Testing**
   - Add unit tests for services
   - Add integration tests for API routes
   - Add E2E tests for critical flows

## Troubleshooting

### Prisma Client Not Found
```bash
npm run prisma:generate
```

### Database Connection Issues
- Check your DATABASE_URL in `.env`
- Ensure PostgreSQL is running
- Verify database credentials

### Type Errors
- Ensure Prisma client is generated: `npm run prisma:generate`
- Restart TypeScript server in your IDE

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
