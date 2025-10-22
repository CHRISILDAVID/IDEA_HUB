# Workspace Integration Testing Checklist

Use this checklist to verify that the workspace integration is working correctly.

## Pre-Testing Setup

- [ ] Main app is running on `http://localhost:5173` (or configured port)
- [ ] Workspace service is running on `http://localhost:3001` (or configured port)
- [ ] Both services are connected to the same database
- [ ] Database has been migrated with latest schema
- [ ] User is registered and logged in

## Test 1: Create New Idea with Workspace

**Objective**: Verify that creating an idea automatically creates a workspace

Steps:
1. [ ] Navigate to `/ideas/new` or click "Create" button
2. [ ] Verify dialog appears with fields for:
   - Title
   - Description
   - Category
   - Tags
   - Visibility (PUBLIC/PRIVATE)
3. [ ] Fill in all required fields
4. [ ] Click "Create & Open Workspace"
5. [ ] Verify:
   - [ ] Dialog closes
   - [ ] Redirected to `/ideas/{id}`
   - [ ] Workspace editor loads in iframe
   - [ ] Can edit document (left panel)
   - [ ] Can edit whiteboard (right panel)
6. [ ] Check database:
   - [ ] New record in `ideas` table
   - [ ] New record in `workspaces` table
   - [ ] `workspace.ideaId` matches `idea.id`

## Test 2: View Existing Idea as Owner

**Objective**: Verify owner can edit their own idea

Steps:
1. [ ] Navigate to an existing idea you own
2. [ ] Verify:
   - [ ] Workspace editor loads
   - [ ] Can edit document
   - [ ] Can edit whiteboard
   - [ ] Changes auto-save (check "Saved" indicator)
   - [ ] No "Fork to Edit" button visible

## Test 3: View Public Idea as Non-Owner

**Objective**: Verify non-owners see read-only mode for public ideas

Steps:
1. [ ] Log out and log in as different user (or use incognito)
2. [ ] Navigate to a public idea you don't own
3. [ ] Verify:
   - [ ] Yellow banner shows "Viewing in read-only mode"
   - [ ] "Fork to Edit" button is visible
   - [ ] Document editor is read-only
   - [ ] Whiteboard is in view mode (cannot edit)
   - [ ] Header shows "(Read-only)" label
   - [ ] No save operations occur

## Test 4: Fork Public Idea

**Objective**: Verify forking creates a new editable workspace

Steps:
1. [ ] While viewing public idea as non-owner (from Test 3)
2. [ ] Click "Fork to Edit" button
3. [ ] Verify:
   - [ ] Redirected to new idea URL `/ideas/{new-id}`
   - [ ] New idea title includes "(fork)"
   - [ ] Can now edit document
   - [ ] Can now edit whiteboard
   - [ ] Workspace content matches original
4. [ ] Check database:
   - [ ] New idea with `isFork=true` and `forkedFrom` set
   - [ ] New workspace with copied content
   - [ ] Original idea's `forks` count incremented
   - [ ] Notification created for original author

## Test 5: View Private Idea as Non-Collaborator

**Objective**: Verify private ideas are not accessible

Steps:
1. [ ] Create a private idea as user A
2. [ ] Log in as user B (non-collaborator)
3. [ ] Try to navigate to private idea URL
4. [ ] Verify:
   - [ ] Access denied message or redirect
   - [ ] Workspace does not load

## Test 6: Add Collaborator to Private Idea

**Objective**: Verify collaborators can access private ideas

Steps:
1. [ ] As owner, navigate to a private idea
2. [ ] Add user B as collaborator with EDITOR role
3. [ ] Log in as user B
4. [ ] Navigate to the private idea
5. [ ] Verify:
   - [ ] Can access the workspace
   - [ ] Can edit (if EDITOR role)
   - [ ] Cannot edit (if VIEWER role)

## Test 7: Workspace Auto-Save

**Objective**: Verify changes are automatically saved

Steps:
1. [ ] Open any editable workspace
2. [ ] Make changes to document
3. [ ] Wait for 1.5 seconds
4. [ ] Verify "Saving..." then "Saved" indicator appears
5. [ ] Make changes to whiteboard
6. [ ] Wait for 3.5 seconds
7. [ ] Verify "Saving..." then "Saved" indicator appears
8. [ ] Refresh page
9. [ ] Verify:
   - [ ] Changes persisted
   - [ ] Document shows latest content
   - [ ] Whiteboard shows latest content

## Test 8: Workspace Persistence Across Sessions

**Objective**: Verify workspace state persists

Steps:
1. [ ] Edit a workspace
2. [ ] Close browser tab
3. [ ] Reopen the same idea
4. [ ] Verify:
   - [ ] All content restored
   - [ ] Document matches last edit
   - [ ] Whiteboard matches last edit

## Test 9: Multiple Ideas Per User

**Objective**: Verify users can have multiple ideas/workspaces

Steps:
1. [ ] Create idea #1
2. [ ] Create idea #2
3. [ ] Create idea #3
4. [ ] Navigate to each idea
5. [ ] Verify:
   - [ ] Each has its own workspace
   - [ ] Workspaces don't interfere with each other
   - [ ] Content is isolated per workspace

## Test 10: Visibility Toggle

**Objective**: Verify changing idea visibility updates workspace access

Steps:
1. [ ] Create a public idea
2. [ ] Verify non-owners can view it
3. [ ] Change idea to private
4. [ ] Verify:
   - [ ] Non-owners can no longer access
   - [ ] Workspace access restricted
5. [ ] Change back to public
6. [ ] Verify non-owners can view again

## Test 11: Collaborator Permissions

**Objective**: Verify different collaborator roles work correctly

Steps:
1. [ ] Add collaborator as VIEWER
2. [ ] Log in as that collaborator
3. [ ] Verify:
   - [ ] Can view workspace
   - [ ] Cannot edit (read-only mode)
4. [ ] Owner changes role to EDITOR
5. [ ] Refresh page
6. [ ] Verify:
   - [ ] Can now edit workspace

## Test 12: Delete Idea (Cascading Delete)

**Objective**: Verify workspace is deleted with idea

Steps:
1. [ ] Note the workspace ID for an idea
2. [ ] Delete the idea
3. [ ] Check database:
   - [ ] Idea record deleted
   - [ ] Workspace record also deleted (cascade)

## Browser Compatibility Tests

Test in multiple browsers:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Verify:
- [ ] Workspace editor loads correctly
- [ ] Iframe embedding works
- [ ] Auto-save functions
- [ ] Local storage works

## Performance Tests

- [ ] Load time for workspace editor < 3 seconds
- [ ] Auto-save completes < 1 second
- [ ] Large documents (>100 blocks) render smoothly
- [ ] Large whiteboards (>50 elements) render smoothly

## Error Handling Tests

- [ ] Network error during save shows error message
- [ ] Invalid workspace ID shows 404
- [ ] Unauthorized access shows appropriate error
- [ ] Missing required fields show validation errors

## Regression Tests

Ensure existing functionality still works:
- [ ] User registration
- [ ] User login
- [ ] Browse ideas
- [ ] Star ideas
- [ ] Comment on ideas
- [ ] Follow users
- [ ] Notifications
- [ ] Search

## Security Tests

- [ ] Cannot access private ideas without permission
- [ ] Cannot edit public ideas without forking (as non-owner)
- [ ] Cannot bypass readonly mode
- [ ] XSS attempts are sanitized
- [ ] CSRF protection works

## Issues Found

Document any issues found during testing:

| Test # | Issue Description | Severity | Status |
|--------|------------------|----------|--------|
|        |                  |          |        |

## Sign-off

- [ ] All critical tests pass
- [ ] No blocking issues found
- [ ] Documentation reviewed
- [ ] Ready for deployment

Tested by: ________________
Date: ________________
