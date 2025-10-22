# Workspace Integration Guide

This document explains the integration between the main IDEA_HUB app and the idea_workspace service.

## Architecture Overview

The integration follows these key principles:

1. **Shared Database**: Both the main app and workspace service connect to the same PostgreSQL database
2. **One Workspace per Idea**: Each idea has exactly one workspace (enforced at the database level)
3. **Workspace Schema**: The workspace model includes both document (EditorJS) and whiteboard (Excalidraw) content
4. **Access Control**: 
   - Public ideas can be viewed by anyone (read-only for non-collaborators)
   - Private ideas are only accessible to owners and collaborators
   - Non-collaborators can fork public ideas to edit them

## Database Schema

The `Workspace` model in the main Prisma schema:

```prisma
model Workspace {
  id          String   @id @default(uuid())
  name        String
  ideaId      String   @unique @map("idea_id")  // 1:1 relationship with Idea
  userId      String   @map("user_id")
  
  document    Json?    @default("{}") // EditorJS content
  whiteboard  Json?    @default("{\"elements\": [], \"appState\": {}}") // Excalidraw content
  
  thumbnail   String?  @db.Text
  isPublic    Boolean  @default(false) @map("is_public")
  archived    Boolean  @default(false)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  idea        Idea     @relation("IdeaWorkspace", fields: [ideaId], references: [id], onDelete: Cascade)
  owner       User     @relation("WorkspaceOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("workspaces")
}
```

## Setup Instructions

### 1. Database Configuration

Both services must use the same `DATABASE_URL` environment variable:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

Set this in:
- `/home/runner/work/IDEA_HUB/IDEA_HUB/.env` (main app)
- `/home/runner/work/IDEA_HUB/IDEA_HUB/idea_workspace/ideahubORM/.env` (workspace service)

### 2. Generate Prisma Clients

```bash
# Main app
cd /home/runner/work/IDEA_HUB/IDEA_HUB
npx prisma generate

# Workspace service
cd /home/runner/work/IDEA_HUB/IDEA_HUB/idea_workspace/ideahubORM
npx prisma generate
```

### 3. Run Database Migrations

Run migrations from the main app (only once):

```bash
cd /home/runner/work/IDEA_HUB/IDEA_HUB
npx prisma migrate dev
```

### 4. Start the Services

```bash
# Terminal 1: Main app (React + Vite)
cd /home/runner/work/IDEA_HUB/IDEA_HUB
npm run dev

# Terminal 2: Workspace service (Next.js)
cd /home/runner/work/IDEA_HUB/IDEA_HUB/idea_workspace/ideahubORM
npm run dev
```

### 5. Configure Workspace Service URL

Set the workspace service URL in the main app's environment:

```env
REACT_APP_WORKSPACE_SERVICE_URL=http://localhost:3001
```

## User Flow

### Creating an Idea with Workspace

1. User clicks "Create Idea" or navigates to `/ideas/new`
2. A dialog prompts for:
   - Title (required)
   - Description (required)
   - Category (required)
   - Tags (optional)
   - Visibility (PUBLIC or PRIVATE)
3. On submit:
   - An `Idea` is created in the database
   - A `Workspace` with the same title is automatically created
   - The workspace is linked to the idea via `ideaId`
   - User is redirected to `/ideas/{id}` which shows the workspace editor

### Viewing/Editing an Idea

1. User navigates to `/ideas/{id}`
2. The `IdeaWorkspacePage` component:
   - Fetches the idea details
   - Fetches the associated workspace
   - Determines if the user can edit based on:
     - Is the user the owner?
     - Is the user a collaborator with EDITOR or OWNER role?
     - Is the idea public? (view-only for non-collaborators)
3. The workspace editor is embedded in an iframe pointing to:
   - `{WORKSPACE_SERVICE_URL}/workspace/{workspaceId}?readonly={true/false}`

### Forking a Public Idea

1. Non-collaborator views a public idea in read-only mode
2. A "Fork to Edit" button is displayed
3. On click:
   - A new `Idea` is created as a fork (with `isFork=true` and `forkedFrom` set)
   - A new `Workspace` is created with a copy of the original workspace content
   - The fork counter on the original idea is incremented
   - A notification is sent to the original author
   - User is redirected to their forked idea's workspace

## API Endpoints

### Main App (Netlify Functions)

- `POST /.netlify/functions/ideas-create` - Creates idea + workspace atomically
- `POST /.netlify/functions/ideas-fork` - Forks idea + creates new workspace
- `GET /.netlify/functions/workspaces-get?id={id}` - Gets workspace by ID
- `GET /.netlify/functions/workspaces-by-idea?ideaId={id}` - Gets workspace by idea ID
- `PUT /.netlify/functions/workspaces-update` - Updates workspace (only if user has edit permission)

### Workspace Service (Next.js API Routes)

- `POST /api/workspace` - Creates workspace (internal use only)
- `GET /api/workspace` - Lists workspaces
- `GET /api/workspace/{id}` - Gets workspace by ID
- `PATCH /api/workspace/{id}` - Updates workspace content
- `DELETE /api/workspace/{id}` - Deletes workspace

## Access Control

### Permissions Matrix

| User Type | Public Idea | Private Idea |
|-----------|-------------|--------------|
| Owner | View & Edit | View & Edit |
| Collaborator (EDITOR) | View & Edit | View & Edit |
| Collaborator (VIEWER) | View only | View only |
| Authenticated User | View only (can fork) | No access |
| Anonymous User | View only | No access |

### Implementation

Access control is implemented in:
- `/src/lib/authorization.ts` - Permission checking functions
- Workspace API routes check permissions before allowing updates
- Frontend components disable editing based on permissions
- Workspace editor supports a `readonly` query parameter

## Workspace Editor Features

### Read-only Mode

When `readonly=true`:
- EditorJS is set to read-only mode
- Excalidraw is set to view mode (`viewModeEnabled={true}`)
- Save operations are disabled
- Local caching is disabled
- A banner shows "Viewing in read-only mode"
- Edit controls in the header are hidden

### Content Storage

- **Document**: Stored as JSON in the `document` field (EditorJS format)
- **Whiteboard**: Stored as JSON in the `whiteboard` field (Excalidraw format)
- Auto-save is enabled with debouncing (1.5s for document, 3.5s for whiteboard)
- Local caching for unsaved changes

## Troubleshooting

### Workspace not loading

1. Check that both services are running
2. Verify `REACT_APP_WORKSPACE_SERVICE_URL` is set correctly
3. Check browser console for CORS errors
4. Verify workspace exists in database

### Permission denied errors

1. Check that the user is authenticated
2. Verify the user has appropriate collaborator role
3. Check idea visibility settings
4. Review access control logs in browser console

### Database connection issues

1. Verify `DATABASE_URL` is set in both `.env` files
2. Check that the database is accessible
3. Run `npx prisma db push` to sync schema
4. Check Prisma client generation

## Security Considerations

1. **Authentication**: All workspace operations require authentication (except viewing public workspaces)
2. **Authorization**: Permissions are checked on both frontend and backend
3. **Input Validation**: All user inputs are validated before database operations
4. **SQL Injection**: Using Prisma ORM prevents SQL injection
5. **XSS**: Content is sanitized when rendering
6. **CSRF**: API uses token-based authentication

## Future Enhancements

1. Real-time collaboration using WebSockets
2. Version history for workspaces
3. Comments and annotations on workspace elements
4. Export workspace to various formats
5. Templates for common workspace types
6. Workspace sharing via link with expiry
