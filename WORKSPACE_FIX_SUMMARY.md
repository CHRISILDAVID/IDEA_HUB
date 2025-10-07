# Workspace Integration Fix Summary

## Issue Fixed
The workspace integration was failing because the workspace Next.js app (ideahubORM) was using a different database schema than the main app.

## Root Cause
- **Main App**: Uses `Workspace` model with fields: `id`, `name`, `ideaId`, `userId`, `document`, `whiteboard`, etc.
- **Workspace App**: Was using `File` model with different fields
- **Problem**: The workspace iframe was trying to fetch from `/api/workspace/{workspaceId}` which was querying the wrong table

## Changes Made

### 1. Updated Workspace App Schema (`idea_workspace/ideahubORM/prisma/schema.prisma`)
- Replaced `File` model with `Workspace` model
- Added `User` and `Idea` models for relations
- Now uses the same database schema as the main app

### 2. Updated API Routes
- **`app/api/workspace/[id]/route.ts`**: Changed from `prisma.file` to `prisma.workspace`
- **`app/api/workspace/route.ts`**: Changed from `prisma.file` to `prisma.workspace`
- Both routes now map workspace data to maintain backward compatibility with the frontend

### 3. Database Integration
- Both apps now use the same `DATABASE_URL` environment variable
- Workspace app connects to the same `workspaces` table as the main app
- Prisma client generated with correct schema

## Testing the Fix

### Prerequisites
1. **Database Setup**: Ensure PostgreSQL database is running with the `ideahub` database created
2. **Environment Variables**: Both `.env` files should have the same `DATABASE_URL`

### Setup Steps

#### 1. Main App Setup
```bash
cd /home/runner/work/IDEA_HUB/IDEA_HUB
cp .env.example .env
# Edit .env and set your DATABASE_URL
npx prisma generate
npx prisma migrate dev
npm install
npm run dev  # Runs on http://localhost:3000
```

#### 2. Workspace App Setup
```bash
cd /home/runner/work/IDEA_HUB/IDEA_HUB/idea_workspace/ideahubORM
# Create .env file with same DATABASE_URL as main app
echo 'DATABASE_URL="your-database-url"' > .env
echo 'NEXT_PUBLIC_APP_URL="http://localhost:3001"' >> .env
npx prisma generate
npm install
npm run dev  # Runs on http://localhost:3001
```

### Test Flow

1. **Create an Idea**:
   - Navigate to http://localhost:3000
   - Login/Register
   - Click "Create Idea" or navigate to `/create`
   - The app should create an idea and workspace in a transaction
   - You'll be redirected to `/{username}/idea/workspace/{ideaId}`

2. **Verify Workspace Loads**:
   - The WorkspaceIframe component should load the Next.js app
   - URL format: `http://localhost:3001/workspace/{workspaceId}?mode=edit&token=...`
   - The workspace should fetch from `/api/workspace/{workspaceId}`
   - Data should load from the `workspaces` table

3. **Test Editing**:
   - Try editing the document (left panel)
   - Try drawing on the canvas (right panel)
   - Both should auto-save to the database
   - Check browser console for `WORKSPACE_LOADED` and `SAVE_SUCCESS` messages

### Verify in Database

```sql
-- Check that idea and workspace were created
SELECT i.id, i.title, w.id as workspace_id, w.name 
FROM ideas i 
JOIN workspaces w ON w.idea_id = i.id 
ORDER BY i.created_at DESC 
LIMIT 5;

-- Check workspace content
SELECT id, name, document, whiteboard 
FROM workspaces 
ORDER BY created_at DESC 
LIMIT 1;
```

## API Endpoints

### Main App (Netlify Functions)
- `POST /.netlify/functions/ideas-create` - Creates idea + workspace
- `GET /.netlify/functions/workspace-permissions?ideaId={id}` - Get permissions
- `PATCH /.netlify/functions/workspaces-update` - Update workspace

### Workspace App (Next.js API)
- `GET /api/workspace/{id}` - Get workspace by ID
- `PATCH /api/workspace/{id}` - Update workspace content
- `POST /api/workspace` - Create workspace (legacy)
- `GET /api/workspace` - List workspaces (legacy)

## Important Notes

1. **Environment Variables**: 
   - Main app uses `VITE_WORKSPACE_APP_URL` to point to workspace app
   - Default: `http://localhost:3001`
   - In production, update to actual workspace URL

2. **Authentication**: 
   - JWT token passed via query parameter to workspace iframe
   - Token stored in localStorage as `auth_token`

3. **Database Migration**:
   - Main app has migrations in `prisma/migrations/`
   - Run `npx prisma migrate dev` to apply all migrations
   - Workspace app uses same database, no separate migrations needed

4. **Prisma Client Generation**:
   - Main app: `npx prisma generate` (outputs to default location)
   - Workspace app: `npx prisma generate` (outputs to `app/generated/prisma`)
   - Both must be regenerated after schema changes

## Troubleshooting

### Issue: "Workspace not found"
- Check that the workspace was created with the idea
- Verify DATABASE_URL is correct in workspace app
- Check that workspaceId in URL matches database

### Issue: "Failed to fetch workspace permissions"
- Check that auth token is present in localStorage
- Verify JWT_SECRET matches in both apps
- Check network tab for API errors

### Issue: "Prisma client errors"
- Run `npx prisma generate` in both app directories
- Ensure DATABASE_URL is set correctly
- Check that all migrations have been applied

### Issue: Iframe not loading
- Check that workspace app is running on port 3001
- Verify VITE_WORKSPACE_APP_URL is set correctly
- Check browser console for CORS or iframe errors

## Architecture

```
Main App (React + Vite)                    Workspace App (Next.js)
├── Routes                                 ├── API Routes
│   ├── /create                            │   ├── /api/workspace/[id]
│   ├── /ideas/:id                         │   └── /api/workspace
│   └── /:username/idea/workspace/:ideaId  │
├── Components                             ├── Pages
│   ├── WorkspaceViewPage                  │   └── /workspace/[fileId]
│   └── WorkspaceIframe                    │
└── API (Netlify Functions)                └── Components
    ├── ideas-create                           ├── Editor (EditorJS)
    ├── workspace-permissions                  └── Canvas (Excalidraw)
    └── workspaces-update
                    
         Both connect to same PostgreSQL database
                   (workspaces table)
```

## Success Criteria

- [x] Workspace app schema matches main app schema
- [x] API routes updated to query `workspaces` table
- [x] Prisma client generated successfully
- [x] TypeScript compilation passes
- [ ] Manual test: Create idea and verify workspace loads
- [ ] Manual test: Edit workspace and verify save
- [ ] Manual test: View workspace in read-only mode
- [ ] Manual test: Fork workspace and verify copy

## Related Files

- Main schema: `prisma/schema.prisma`
- Workspace schema: `idea_workspace/ideahubORM/prisma/schema.prisma`
- Workspace page: `src/pages/WorkspaceViewPage.tsx`
- Iframe component: `src/components/Workspace/WorkspaceIframe.tsx`
- Integration guide: `INTEGRATION_COMPLETION_SUMMARY.md`
- Setup guide: `SETUP_GUIDE.md`
