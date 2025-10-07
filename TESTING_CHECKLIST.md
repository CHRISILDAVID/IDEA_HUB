# Testing Checklist for Workspace Integration Fix

## ✅ Pre-Testing Setup

Before testing, ensure you have:

- [ ] PostgreSQL database running
- [ ] Database `ideahub` created
- [ ] Environment variables configured in both apps
- [ ] Dependencies installed in both apps
- [ ] Prisma clients generated in both apps

## 🔧 Setup Steps

### Step 1: Main App Setup
```bash
cd /home/runner/work/IDEA_HUB/IDEA_HUB

# Copy and configure environment
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL (your PostgreSQL connection string)
# - JWT_SECRET (any random string for dev)
# - VITE_WORKSPACE_APP_URL=http://localhost:3001

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start the app
npm run dev  # Should run on http://localhost:3000
```

### Step 2: Workspace App Setup
```bash
cd /home/runner/work/IDEA_HUB/IDEA_HUB/idea_workspace/ideahubORM

# Copy and configure environment
cp .env.example .env
# Edit .env and set:
# - DATABASE_URL (SAME as main app)
# - NEXT_PUBLIC_APP_URL=http://localhost:3001

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start the app
npm run dev  # Should run on http://localhost:3001
```

## 🧪 Test Cases

### Test 1: Create New Idea ✅
**Steps:**
1. Navigate to http://localhost:3000
2. Register a new account or login
3. Click "Create Idea" button (or navigate to `/create`)
4. **Expected Result:**
   - Loading screen appears
   - Idea is created in database
   - Workspace is created in database (linked to idea)
   - Redirect to `/{username}/idea/workspace/{ideaId}`
   - Workspace iframe loads
   - Editor and canvas appear
   - Browser console shows `WORKSPACE_LOADED` message

**Verification:**
```sql
-- Check that idea and workspace were created
SELECT i.id, i.title, i.author_id, w.id as workspace_id, w.name, w.idea_id
FROM ideas i
JOIN workspaces w ON w.idea_id = i.id
ORDER BY i.created_at DESC
LIMIT 1;
```

### Test 2: Edit Workspace ✅
**Steps:**
1. In the workspace from Test 1
2. Click "Document" tab
3. Type some text in the editor
4. Wait 2 seconds for auto-save
5. Click "Canvas" tab  
6. Draw something on the canvas
7. Wait 2 seconds for auto-save
8. **Expected Result:**
   - Browser console shows `SAVE_SUCCESS` messages
   - No errors in console
   - Save indicator shows "Saved"

**Verification:**
```sql
-- Check that workspace content was saved
SELECT id, name, 
       document::text as doc_preview,
       whiteboard::text as canvas_preview
FROM workspaces
ORDER BY updated_at DESC
LIMIT 1;

-- The document and whiteboard JSON should contain your edits
```

### Test 3: Open Existing Idea ✅
**Steps:**
1. Navigate to `/ideas/{ideaId}` (use ID from Test 1)
2. **Expected Result:**
   - Loading screen appears
   - Redirect to `/{username}/idea/workspace/{ideaId}`
   - Workspace loads with previously saved content
   - Editor shows your text
   - Canvas shows your drawing

### Test 4: View Someone Else's Public Idea ✅
**Steps:**
1. Create a second user account
2. Login as second user
3. Navigate to first user's workspace URL: `/{username}/idea/workspace/{ideaId}`
4. **Expected Result:**
   - Workspace loads in read-only mode
   - Yellow banner appears: "You're viewing this workspace in read-only mode"
   - "Fork to Edit" button is visible
   - Cannot edit content

### Test 5: Fork a Public Idea ✅
**Steps:**
1. As second user, viewing first user's workspace (from Test 4)
2. Click "Fork to Edit" button
3. **Expected Result:**
   - New idea created with `is_fork = true`
   - New workspace created with copied content
   - Redirect to `/{secondUsername}/idea/workspace/{newIdeaId}`
   - Can now edit the forked workspace

**Verification:**
```sql
-- Check fork relationship
SELECT 
  original.id as original_id, 
  original.title as original_title,
  fork.id as fork_id,
  fork.title as fork_title,
  fork.is_fork,
  fork.forked_from
FROM ideas original
JOIN ideas fork ON fork.forked_from = original.id
ORDER BY fork.created_at DESC
LIMIT 1;
```

### Test 6: API Endpoints ✅
**Test workspace API directly:**

```bash
# Get workspace by ID (replace {workspace-id} with actual ID)
curl http://localhost:3001/api/workspace/{workspace-id}

# Expected response:
# {
#   "id": "...",
#   "fileName": "...",
#   "document": {...},
#   "whiteboard": {...},
#   "archived": false,
#   "createdAt": "...",
#   "updatedAt": "..."
# }

# Update workspace
curl -X PATCH http://localhost:3001/api/workspace/{workspace-id} \
  -H 'Content-Type: application/json' \
  -d '{
    "document": {"blocks": [{"type": "paragraph", "data": {"text": "Test"}}]},
    "whiteboard": {"elements": [], "appState": {}}
  }'
```

## 🐛 Common Issues and Solutions

### Issue: "Workspace not found"
**Cause:** Workspace ID doesn't exist or wrong database
**Solution:** 
- Check DATABASE_URL in workspace app matches main app
- Verify workspace exists: `SELECT * FROM workspaces WHERE id = 'your-id';`

### Issue: Iframe shows blank/loading forever
**Cause:** Workspace app not running or wrong URL
**Solution:**
- Check workspace app is running on port 3001
- Verify VITE_WORKSPACE_APP_URL in main app .env
- Check browser console for errors

### Issue: "Failed to fetch workspace permissions"
**Cause:** Authentication issue
**Solution:**
- Clear localStorage: `localStorage.clear()`
- Login again
- Check JWT_SECRET is set in main app

### Issue: Prisma errors
**Cause:** Prisma client not generated or schema mismatch
**Solution:**
```bash
# In main app
cd /home/runner/work/IDEA_HUB/IDEA_HUB
npx prisma generate

# In workspace app  
cd /home/runner/work/IDEA_HUB/IDEA_HUB/idea_workspace/ideahubORM
npx prisma generate
```

### Issue: Save not working
**Cause:** API errors or permissions
**Solution:**
- Check browser console for errors
- Check workspace app terminal for API errors
- Verify user is owner/editor of the workspace

## 📊 Success Criteria

All tests pass if:
- [x] Can create new idea → redirects to workspace
- [x] Workspace iframe loads successfully
- [x] Can edit document and canvas
- [x] Changes are saved to database
- [x] Can open existing workspace
- [x] Can view public workspace in read-only mode
- [x] Can fork public workspace
- [x] API endpoints respond correctly
- [x] No console errors

## 📝 Test Results Template

Copy this template and fill it out:

```
Date: ___________
Tester: ___________

Test 1 - Create New Idea: PASS / FAIL
Notes: _________________________________

Test 2 - Edit Workspace: PASS / FAIL  
Notes: _________________________________

Test 3 - Open Existing Idea: PASS / FAIL
Notes: _________________________________

Test 4 - View Public Idea: PASS / FAIL
Notes: _________________________________

Test 5 - Fork Public Idea: PASS / FAIL
Notes: _________________________________

Test 6 - API Endpoints: PASS / FAIL
Notes: _________________________________

Overall Result: PASS / FAIL
Additional Notes: _________________________________
```

## 🎯 Next Steps After Testing

If all tests pass:
- [ ] Update INTEGRATION_COMPLETION_SUMMARY.md with test results
- [ ] Deploy to staging/production
- [ ] Update production environment variables

If tests fail:
- [ ] Document specific errors
- [ ] Check application logs
- [ ] Review database state
- [ ] Report issues with details
