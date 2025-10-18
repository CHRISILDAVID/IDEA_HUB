# 🚀 Quick Start - Test the Workspace Integration Fix

## What Was Fixed?
The workspace integration now works! The route `/:username/idea/workspace/:ideaId` now correctly loads the workspace editor.

## Setup (5 minutes)

### 1. Main App
```bash
cd /home/runner/work/IDEA_HUB/IDEA_HUB

# Configure environment
cp .env.example .env
# Edit .env and set DATABASE_URL, JWT_SECRET, VITE_WORKSPACE_APP_URL

# Setup
npm install
npx prisma generate
npx prisma migrate dev

# Run
npm run dev  # → http://localhost:3000
```

### 2. Workspace App
```bash
cd /home/runner/work/IDEA_HUB/IDEA_HUB/idea_workspace/ideahubORM

# Configure environment  
cp .env.example .env
# Edit .env and set DATABASE_URL (SAME as main app)

# Setup
npm install
npx prisma generate

# Run
npm run dev  # → http://localhost:3001
```

## Test (2 minutes)

1. **Open** http://localhost:3000
2. **Register** a new account
3. **Click** "Create Idea" button
4. **Verify** workspace loads with editor and canvas ✅

## Expected Result

✅ Workspace loads in iframe
✅ Editor (left) and Canvas (right) appear
✅ Can type in editor
✅ Can draw on canvas
✅ Auto-save works (check console for "SAVE_SUCCESS")

## Need Help?

- **Setup Issues**: See `TESTING_CHECKLIST.md`
- **Technical Details**: See `WORKSPACE_FIX_SUMMARY.md`
- **Full Documentation**: See `FIX_IMPLEMENTATION_SUMMARY.md`

## Common Issues

### "Workspace not loading" or "Error message pops up"
**Solution**: Make sure BOTH apps are running:
1. Main app on `http://localhost:3000` (or 5173 with Vite, or 8888 with Netlify)
2. Workspace app on `http://localhost:3001` (see setup instructions above)

### "localhost:3000/api/workspace/workspaceid doesn't work"
**Wrong URL!** The `/api/workspace/{id}` endpoint is for API calls, not for viewing in browser.

**Correct approach:**
1. Navigate to the main app: `http://localhost:3000` (or 8888 with Netlify)
2. Create or open an idea
3. The app will automatically redirect to: `http://localhost:3000/:username/idea/workspace/:ideaId`
4. This page embeds the workspace app in an iframe

**Direct access (for testing only):**
- To test the workspace app directly: `http://localhost:3001/workspace/{workspaceId}`
- Note: You'll need a valid JWT token as a query parameter for authentication

### Port conflict errors
The workspace app MUST run on port 3001 (not 3000). This is now configured in `package.json`.

## Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                      Main App (React)                        │
│                    http://localhost:3000                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Route: /:username/idea/workspace/:ideaId                    │
│     ↓                                                         │
│  WorkspaceViewPage (fetches permissions)                     │
│     ↓                                                         │
│  WorkspaceIframe Component                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Embedded Workspace App (Next.js)               │ │
│  │       http://localhost:3001/workspace/{id}             │ │
│  │                                                          │ │
│  │  ┌──────────────────┐  ┌──────────────────┐           │ │
│  │  │   Editor         │  │   Canvas         │           │ │
│  │  │  (EditorJS)      │  │  (Excalidraw)    │           │ │
│  │  └──────────────────┘  └──────────────────┘           │ │
│  │                                                          │ │
│  │  API: GET/PATCH /api/workspace/{id}                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
                   ┌──────────────────────┐
                   │  PostgreSQL Database  │
                   │   (workspaces table)  │
                   └──────────────────────┘
```

## What Changed?

**Before (Broken):**
- Workspace app used `File` model
- API queried `files` table ❌
- Workspace wouldn't load ❌

**After (Fixed):**
- Workspace app uses `Workspace` model ✅
- API queries `workspaces` table ✅
- Workspace loads correctly ✅

## Files Modified
- ✅ `idea_workspace/ideahubORM/prisma/schema.prisma`
- ✅ `idea_workspace/ideahubORM/app/api/workspace/[id]/route.ts`
- ✅ `idea_workspace/ideahubORM/app/api/workspace/route.ts`
- ✅ Documentation (3 new files)

**Total: 389 lines added, 21 removed**

---

**Ready to test!** Follow the setup steps above. 🎉
