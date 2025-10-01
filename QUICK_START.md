# Quick Start Guide

Get IdeaHub running locally in 5 minutes!

## Prerequisites

- Node.js 18 or higher
- PostgreSQL database (local or remote)
- npm or yarn

## Setup Steps

### 1. Clone and Install

```bash
git clone https://github.com/CHRISILDAVID/IDEA_HUB.git
cd IDEA_HUB
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Required: PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/ideahub?schema=public"

# Required: NextAuth configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32
```

### 3. Set Up Database

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 4. Start Development Server

Choose your environment:

#### Option A: Next.js (New - Recommended)
```bash
npm run dev
```
Open http://localhost:3000

#### Option B: Vite + React (Legacy)
```bash
npm run dev:vite
```
Open http://localhost:5173

## Common Commands

### Development
```bash
npm run dev          # Start Next.js dev server
npm run dev:vite     # Start Vite dev server (legacy)
npm run lint         # Run linter
```

### Database
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio (database GUI)
```

### Production
```bash
npm run build        # Build Next.js app
npm run build:vite   # Build Vite app (legacy)
npm start            # Start Next.js production server
```

## Project Structure Overview

```
IDEA_HUB/
├── app/                    # Next.js app (new)
│   ├── api/               # API routes
│   └── page.tsx           # Home page
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── services/prisma/   # Database services (new)
│   ├── lib/prisma/        # Prisma client
│   └── components/        # React components
└── .env                   # Environment variables
```

## API Endpoints

### Public Endpoints
- `GET /api/ideas` - List all ideas
  - Query params: `?category=tech&search=ai&sortBy=stars`
- `GET /api/users?query=john` - Search users

### Protected Endpoints (Require Authentication)
- `POST /api/ideas` - Create new idea
- `GET /api/notifications` - Get user notifications
- `GET /api/workspaces` - Get user workspaces
- `POST /api/workspaces` - Create workspace

## Authentication

### Sign In
```typescript
import { signIn } from 'next-auth/react';

await signIn('credentials', {
  email: 'user@example.com',
  password: 'password',
  redirect: true,
  callbackUrl: '/dashboard'
});
```

### Get Current User
```typescript
import { useSession } from 'next-auth/react';

function Component() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <div>Loading...</div>;
  if (status === 'unauthenticated') return <div>Please sign in</div>;
  
  return <div>Hello, {session.user.name}!</div>;
}
```

### Protected Page
```typescript
import { requireAuth } from '@/src/lib/auth';

export default async function ProtectedPage() {
  const user = await requireAuth();
  return <div>Hello, {user.name}!</div>;
}
```

## Database Operations

### Using Prisma Services

```typescript
import { PrismaIdeasService } from '@/src/services/prisma';

// Get all ideas
const ideas = await PrismaIdeasService.getIdeas({
  category: 'technology',
  sortBy: 'stars'
});

// Create an idea
const newIdea = await PrismaIdeasService.createIdea({
  title: 'My Idea',
  description: 'Description',
  content: 'Content',
  category: 'technology',
  tags: ['ai', 'ml']
}, userId);

// Star an idea
await PrismaIdeasService.starIdea(ideaId, userId);
```

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Solution**: Check your `DATABASE_URL` in `.env` and ensure PostgreSQL is running.

### Prisma Client Not Generated
```
Error: Cannot find module '@prisma/client'
```
**Solution**: Run `npm run prisma:generate`

### Authentication Not Working
```
Error: NEXTAUTH_SECRET not set
```
**Solution**: Add `NEXTAUTH_SECRET` to your `.env` file:
```bash
openssl rand -base64 32
```

### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solution**: Kill the process or use a different port:
```bash
PORT=3001 npm run dev
```

## Next Steps

1. **Explore the Code**: Check out `/src/services/prisma/` to see how services work
2. **Read Documentation**: 
   - `README.md` - Project overview
   - `MIGRATION_GUIDE.md` - Migration details
   - `DEPLOYMENT_CHECKLIST.md` - Deploy to production
3. **Start Developing**: Add your own features!

## Sample Data

To add sample data for testing:

```bash
# Open Prisma Studio
npm run prisma:studio

# Or use the Prisma client directly
```

Create a user:
```typescript
import { prisma } from '@/src/lib/prisma/client';

await prisma.user.create({
  data: {
    username: 'testuser',
    email: 'test@example.com',
    fullName: 'Test User'
  }
});
```

## Getting Help

- Check `MIGRATION_STATUS.md` for current status
- Review `MIGRATION_GUIDE.md` for detailed migration info
- See `DEPLOYMENT_CHECKLIST.md` for deployment help
- Open an issue on GitHub

## Development Tips

### Hot Reload
Both Next.js and Vite support hot reload - your changes will appear instantly!

### Database Changes
After modifying `prisma/schema.prisma`:
```bash
npm run prisma:migrate dev --name your-change-description
npm run prisma:generate
```

### Type Safety
All database operations are type-safe thanks to Prisma:
```typescript
// TypeScript will autocomplete and validate!
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { ideas: true, followers: true }
});
```

### Debugging
Use Prisma Studio to inspect your database:
```bash
npm run prisma:studio
```

Happy coding! 🚀
