# IdeaHub Workspace App

Workspace editor powered by Next.js 14, Prisma, and PostgreSQL. Integrated with the main IdeaHub app via iframe.

Features:
- **Document Editor**: EditorJS-based rich text editor
- **Canvas**: Excalidraw whiteboard for visual collaboration
- **Auto-save**: Changes automatically saved to PostgreSQL
- **Read-only Mode**: View-only access for non-owners

## Architecture

This app runs as an embedded iframe within the main IdeaHub application. It provides the workspace editing experience while the main app handles:
- User authentication
- Idea management
- Permissions and access control
- Social features (stars, forks, comments)

## Setup

### Prerequisites
- PostgreSQL database running
- Same database as main IdeaHub app (shares the `workspaces` table)

### Installation

1. **Copy environment file**:
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables**:
   Edit `.env` and set:
   - `DATABASE_URL`: **Must be the same as main app** (points to shared database)
   - `NEXT_PUBLIC_APP_URL`: Workspace app URL (default: `http://localhost:3001`)

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

   > **Note**: Do NOT run `prisma migrate` or `prisma db push` from this app.
   > Database migrations are managed by the main IdeaHub app.

5. **Start development server**:
   ```bash
   npm run dev
   ```

   The app will run on http://localhost:3001

## Integration with Main App

### How it Works

1. **User creates/opens an idea** in the main app
2. **Main app redirects** to `/:username/idea/workspace/:ideaId`
3. **WorkspaceViewPage fetches permissions** from API
4. **WorkspaceIframe component** embeds this Next.js app with URL:
   ```
   http://localhost:3001/workspace/{workspaceId}?mode=edit&token=JWT_TOKEN
   ```
5. **This app loads** the workspace from the database
6. **User edits** document and/or canvas
7. **Changes auto-save** to the `workspaces` table

### API Endpoints

- `GET /api/workspace/{id}` - Fetch workspace by ID
- `PATCH /api/workspace/{id}` - Update workspace (document/whiteboard)
- `GET /api/workspace` - List all workspaces
- `POST /api/workspace` - Create workspace (legacy, use main app instead)

### Database Schema

Uses the `Workspace` model from the main app schema:
- `id` - UUID primary key
- `name` - Workspace name
- `ideaId` - Foreign key to `ideas` table
- `userId` - Foreign key to `users` table
- `document` - JSON (EditorJS blocks)
- `whiteboard` - JSON (Excalidraw elements)
- `archived` - Boolean (soft delete)

## Development

### Running Standalone (for testing)

While this app is designed to run embedded in the main app, you can test it standalone:

1. Create a test workspace in the database
2. Navigate to: `http://localhost:3001/workspace/{workspace-id}`
3. Optionally add query params: `?mode=edit&token=your-jwt-token`

### Building for Production

```bash
npm run build
npm start
```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string (shared with main app)
- `NEXT_PUBLIC_APP_URL` - Public URL of this workspace app

## Troubleshooting

### "Workspace not found"
- Ensure the workspace ID exists in the database
- Check that `DATABASE_URL` points to the correct database
- Verify the workspace hasn't been archived

### "Failed to fetch workspace"
- Check that the Prisma client has been generated: `npx prisma generate`
- Verify database connection is working
- Check API logs in the terminal

### Prisma Client errors
- Regenerate client: `npx prisma generate`
- Ensure schema is synced with main app
- Check that migrations have been applied (from main app)

## Integration Documentation

For complete integration details, see:
- **Main Repo**: `WORKSPACE_FIX_SUMMARY.md` - Fix documentation
- **Main Repo**: `INTEGRATION_COMPLETION_SUMMARY.md` - Integration overview
- **Main Repo**: `SETUP_GUIDE.md` - Complete setup guide

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Prisma** - Database ORM
- **PostgreSQL** - Database (shared with main app)
- **EditorJS** - Rich text editor
- **Excalidraw** - Canvas/whiteboard
- **TailwindCSS** - Styling
- **Radix UI** - UI components
