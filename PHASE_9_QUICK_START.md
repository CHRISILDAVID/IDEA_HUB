# Phase 9 Workspace Migration - Quick Start Guide

**Created:** October 5, 2025  
**Phase:** 9 of 12  
**Status:** Ready for Implementation  

---

## 📖 Overview

This phase migrates the fully functional Next.js workspace component from `ideahubORM` into the main `IDEA_HUB` project, creating a unified application with embedded workspace functionality.

---

## 🎯 What's Changing?

### Before
```
IDEA_HUB (React SPA)
  - Dummy Workspace model
  - Basic workspace UI (incomplete)
  - Separate database

ideahubORM (Next.js)
  - Working Canvas + Document editor
  - File model with document/whiteboard
  - Separate database
```

### After
```
IDEA_HUB (Unified)
  - React SPA for navigation, ideas, social features
  - Embedded Next.js workspace module
  - Enhanced Workspace model (document + whiteboard)
  - Single Prisma Postgres database
  - Full access control & permissions
```

---

## 🔑 Key Decisions Made

### ✅ Approach 3: Hybrid Architecture
- **Why:** Next.js workspace components already work perfectly
- **How:** Embed Next.js workspace module within React SPA
- **Benefit:** Preserve working code, avoid rewrite, faster migration

### ✅ Single Database Schema
- **Enhancement:** Add `document` and `whiteboard` JSON fields to Workspace
- **Constraint:** Keep Idea ↔ Workspace 1:1 relationship
- **Migration:** Copy canvas data to new structure

### ✅ Permission Matrix Implementation
- Public ideas → View-only for non-owners
- Edit requires owner or EDITOR role
- Max 3 collaborators enforced
- Fork creates editable copy

---

## 📋 Implementation Checklist Summary

### Priority 1: CRITICAL (Do First)
1. **Schema Migration** (9.1)
   - Add `document Json?` and `whiteboard Json?` to Workspace
   - Run `npx prisma migrate dev`
   - Migrate existing canvas data

2. **Access Control** (9.4)
   - Create `src/lib/workspace-permissions.ts`
   - Implement permission matrix
   - Update all endpoints with checks

3. **Backend Updates** (9.2)
   - Update workspace endpoints
   - Handle document/whiteboard saves
   - Enforce edit permissions

### Priority 2: HIGH (Core Features)
4. **Component Migration** (9.3)
   - Copy workspace components from ideahubORM
   - Install dependencies (@blocknote, @excalidraw)
   - Update imports and configs

5. **Routing** (9.5)
   - Add `/workspace/:ideaId` route
   - Implement view/edit mode switching
   - Add fork flow

6. **Idea Creation** (9.6)
   - Create modal UI
   - Implement atomic Idea + Workspace creation
   - Auto-redirect to workspace

### Priority 3: MEDIUM (Polish)
7. **Fork Mechanism** (9.7)
8. **View/Edit Modes** (9.8)
9. **Collaborator UI** (9.9)

### Priority 4: LOW (Finalize)
10. **Testing** (9.10)
11. **Cleanup** (9.11)

---

## 🗂️ File Structure Changes

```
IDEA_HUB/
├── prisma/
│   └── schema.prisma              ← UPDATED: Enhanced Workspace model
├── src/
│   ├── components/
│   │   └── Workspace/             ← NEW: Migrated from ideahubORM
│   │       ├── Canvas/
│   │       ├── Editor/
│   │       ├── WorkspaceViewer/
│   │       └── CollaboratorManager/
│   ├── lib/
│   │   └── workspace-permissions.ts ← NEW: Permission utilities
│   ├── pages/
│   │   ├── WorkspaceEditorPage.tsx  ← UPDATED: New implementation
│   │   └── IdeaDetailsPage.tsx      ← UPDATED: Add view mode
│   └── services/
│       └── workspaces.ts            ← UPDATED: Handle new fields
├── netlify/functions/
│   ├── workspaces-get.ts            ← UPDATED: Return document/whiteboard
│   ├── workspaces-update.ts         ← UPDATED: Save document/whiteboard
│   └── ideas-fork.ts                ← UPDATED: Copy workspace data
└── PHASE_9_WORKSPACE_MIGRATION.md   ← NEW: Full implementation guide
```

---

## 🔐 Permission Matrix (Quick Reference)

| User | Public Idea | Private Idea | Fork? |
|------|-------------|--------------|-------|
| Anonymous | View Only | ❌ No Access | ❌ |
| Non-owner | View Only | ❌ No Access | ✅ |
| Collaborator (VIEWER) | View Only | View Only | ✅ |
| Collaborator (EDITOR) | ✏️ Edit | ✏️ Edit | ✅ |
| Owner | ✏️ Edit + Manage | ✏️ Edit + Manage | N/A |

---

## 🚀 Getting Started

### Step 1: Read Full Guide
📄 **Read:** `PHASE_9_WORKSPACE_MIGRATION.md` for complete details

### Step 2: Update Schema
```bash
cd /home/ciju/ideahubv4/IDEA_HUB

# Edit prisma/schema.prisma (see guide section 9.1.1)
# Then run:
npx prisma migrate dev --name add_workspace_document_whiteboard_fields
npx prisma generate
```

### Step 3: Install Dependencies
```bash
npm install @blocknote/core @blocknote/react
npm install @excalidraw/excalidraw
```

### Step 4: Follow Checklist
Work through sections 9.1 → 9.11 in order

---

## 📊 Schema Changes Summary

### Workspace Model (Enhanced)

```prisma
model Workspace {
  id         String   @id @default(uuid())
  name       String
  ideaId     String   @unique
  userId     String
  
  // ✨ NEW FIELDS
  document   Json?    @db.JsonB  // BlockNote editor
  whiteboard Json?    @db.JsonB  // Excalidraw canvas
  archived   Boolean  @default(false)
  
  // Existing fields
  thumbnail  String?  @db.Text
  isPublic   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  idea  Idea @relation(...)
  owner User @relation(...)
}
```

### Idea Model (Cleanup)

```prisma
model Idea {
  // Remove this field (moved to Workspace.whiteboard):
  // canvasData String? @map("canvas_data") @db.Text  ← DELETE
  
  // Keep everything else the same
  workspace Workspace? @relation("IdeaWorkspace")
}
```

---

## 🧪 Testing Strategy

### Manual Tests
1. ✅ Create idea → workspace auto-created
2. ✅ Edit workspace as owner → saves
3. ✅ View public idea as visitor → read-only
4. ✅ Fork public idea → creates copy
5. ✅ Add 3 collaborators → 4th rejected
6. ✅ Private idea → unauthorized access denied

### Automated Tests
- Unit tests for permission utility
- Integration tests for API endpoints
- E2E tests for user flows

---

## ⚠️ Important Notes

### DO:
✅ Follow the implementation order (9.1 → 9.11)  
✅ Test each section before moving to next  
✅ Keep ideahubORM folder intact during migration  
✅ Use transactions for Idea + Workspace creation  
✅ Enforce max 3 collaborators in backend  

### DON'T:
❌ Delete ideahubORM folder until migration complete  
❌ Skip permission checks in endpoints  
❌ Allow more than 3 collaborators  
❌ Modify Idea-Workspace relationship (keep 1:1)  
❌ Deploy to production until Phase 9 complete  

---

## 📞 Support & Resources

- **Full Guide:** `PHASE_9_WORKSPACE_MIGRATION.md`
- **Migration Notes:** `MIGRATION_AGENT_NOTES.md`
- **Schema Reference:** `prisma/schema.prisma`
- **ideahubORM Source:** `ideahubORM/app/(routes)/workspace/`

---

## ✨ Success Criteria

Phase 9 is complete when:
- ✅ Schema migrated with document/whiteboard fields
- ✅ Workspace components rendering correctly
- ✅ Access control enforcing permissions
- ✅ Idea creation auto-creates workspace
- ✅ Fork mechanism copies workspace data
- ✅ Public ideas show read-only view
- ✅ Max 3 collaborators enforced
- ✅ All tests passing
- ✅ No dummy workspace code remains

---

**Next Phase:** Phase 10 - Environment & Configuration

---

*Created: October 5, 2025*  
*For: IdeaHub Migration - Phase 9*
