# Phase 9: Workspace Component Migration & Integration

**Migration Phase:** 9 of 12  
**Date Created:** October 5, 2025  
**Objective:** Migrate the fully functional Next.js workspace component from `ideahubORM` into `IDEA_HUB`, replace dummy workspace implementation, and align schemas for seamless integration.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Migration Strategy](#migration-strategy)
3. [Schema Alignment](#schema-alignment)
4. [Implementation Checklist](#implementation-checklist)
5. [Technical Architecture](#technical-architecture)
6. [Access Control Matrix](#access-control-matrix)
7. [Routing Strategy](#routing-strategy)
8. [Testing Requirements](#testing-requirements)

---

## 🎯 Overview

### Current State
- **IDEA_HUB**: React SPA with dummy `Workspace` model in Prisma schema
- **ideahubORM**: Next.js app with fully functional workspace component (`File` model with `document` and `whiteboard` JSON fields)
- **Both**: Connected to separate Prisma Postgres databases

### Target State
- **Single Prisma Schema**: Merge workspace functionality into IDEA_HUB schema
- **Hybrid Architecture**: React SPA + embedded Next.js workspace module
- **Unified Database**: Single Prisma Postgres database
- **Enhanced Features**: Full workspace editing with access control

### Why Approach 3 (Hybrid)?
✅ **Next.js workspace UI** preserved as-is (already working)  
✅ **React SPA** handles navigation, ideas, auth, social features  
✅ **Single database** simplifies data consistency  
✅ **Modular architecture** allows independent workspace development  
✅ **Progressive migration** minimizes breaking changes  

---

## 🏗️ Migration Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    IDEA_HUB (React SPA)                     │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Ideas    │  │   Profile    │  │   Explore    │      │
│  │   (React)   │  │   (React)    │  │   (React)    │      │
│  └─────────────┘  └──────────────┘  └──────────────┘      │
│                                                             │
│  ┌───────────────────────────────────────────────────┐     │
│  │        Workspace Module (Next.js Embedded)        │     │
│  │  ┌──────────────┐    ┌──────────────────────┐    │     │
│  │  │   Canvas     │    │  Document Editor     │    │     │
│  │  │ (Excalidraw) │    │   (BlockNote)        │    │     │
│  │  └──────────────┘    └──────────────────────┘    │     │
│  └───────────────────────────────────────────────────┘     │
│                                                             │
│                           ↕                                 │
│              ┌─────────────────────────┐                    │
│              │   API Layer (Netlify)   │                    │
│              │  - ideas-*.ts           │                    │
│              │  - workspaces-*.ts      │                    │
│              │  - auth-*.ts            │                    │
│              └─────────────────────────┘                    │
│                           ↕                                 │
│              ┌─────────────────────────┐                    │
│              │   Prisma Client         │                    │
│              └─────────────────────────┘                    │
│                           ↕                                 │
│              ┌─────────────────────────┐                    │
│              │  Prisma Postgres DB     │                    │
│              │  (Unified Schema)       │                    │
│              └─────────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Component Integration Strategy

**Option A: iframe Embedding (Simple)**
```typescript
// In React app: /workspace/:ideaId route
<iframe 
  src={`/workspace-app/${ideaId}`} 
  className="w-full h-screen"
/>
```

**Option B: Next.js Integration (Recommended)**
- Serve Next.js workspace from `/workspace/*` route
- Use Next.js API routes for workspace operations
- Share Prisma client between React API and Next.js

**Option C: Component Migration**
- Migrate Next.js components to React
- Replace Next.js-specific features with React equivalents
- ⚠️ More work, but fully integrated

**→ RECOMMENDED: Option B** (preserve working Next.js workspace)

---

## 📊 Schema Alignment

### Current Schemas

#### IDEA_HUB Schema (Simplified - Current)
```prisma
model Workspace {
  id        String   @id @default(uuid())
  name      String
  ideaId    String   @unique @map("idea_id")
  userId    String   @map("user_id")
  content   Json     @default("{\"elements\": [], \"appState\": {}}")
  thumbnail String?  @db.Text
  isPublic  Boolean  @default(false) @map("is_public")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  idea  Idea @relation("IdeaWorkspace", fields: [ideaId], references: [id], onDelete: Cascade)
  owner User @relation("WorkspaceOwner", fields: [userId], references: [id], onDelete: Cascade)
}
```

#### ideahubORM Schema (Current)
```prisma
model File {
  id         String   @id @default(cuid())
  fileName   String
  document   Json?
  whiteboard Json?
  archived   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### 🎯 Target Unified Schema

```prisma
// ============================================
// ENHANCED WORKSPACE MODEL
// ============================================

model Workspace {
  id        String   @id @default(uuid())
  name      String
  ideaId    String   @unique @map("idea_id")
  userId    String   @map("user_id")
  
  // ✨ Enhanced content structure from ideahubORM
  document   Json?    @db.JsonB  // BlockNote/document editor content
  whiteboard Json?    @db.JsonB  // Excalidraw canvas elements
  
  // Metadata
  thumbnail  String?  @db.Text   // Generated preview image
  archived   Boolean  @default(false)
  isPublic   Boolean  @default(false) @map("is_public")
  
  // Timestamps
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  // Relations
  idea  Idea @relation("IdeaWorkspace", fields: [ideaId], references: [id], onDelete: Cascade)
  owner User @relation("WorkspaceOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("workspaces")
  @@index([userId])
  @@index([ideaId])
  @@index([archived])
}

// ============================================
// IDEA MODEL (Add workspace sync fields)
// ============================================

model Idea {
  id          String     @id @default(uuid())
  title       String
  description String
  content     String     @db.Text
  
  // ✨ Remove canvasData - now in Workspace.whiteboard
  // canvasData  String?    @map("canvas_data") @db.Text  ← DELETE THIS
  
  authorId    String     @map("author_id")
  tags        String[]
  category    String
  license     String     @default("MIT")
  version     String     @default("1.0.0")
  stars       Int        @default(0)
  forks       Int        @default(0)
  isFork      Boolean    @default(false) @map("is_fork")
  forkedFrom  String?    @map("forked_from")
  visibility  Visibility @default(PUBLIC)
  language    String?
  status      Status     @default(PUBLISHED)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  
  // Relations (workspace is 1:1)
  author         User               @relation("AuthorIdeas", fields: [authorId], references: [id], onDelete: Cascade)
  forkedFromIdea Idea?              @relation("IdeaForks", fields: [forkedFrom], references: [id], onDelete: SetNull)
  forkIdeas      Idea[]             @relation("IdeaForks")
  workspace      Workspace?         @relation("IdeaWorkspace")  // 1:1 relation
  collaborators  IdeaCollaborator[]
  comments       Comment[]
  starredBy      Star[]
  notifications  Notification[]
  
  @@map("ideas")
  @@index([authorId])
  @@index([visibility, status])
}

// ============================================
// COLLABORATOR MODEL (Existing - with constraints)
// ============================================

model IdeaCollaborator {
  id        String           @id @default(uuid())
  ideaId    String           @map("idea_id")
  userId    String           @map("user_id")
  role      CollaboratorRole @default(VIEWER)
  createdAt DateTime         @default(now()) @map("created_at")
  
  // Relations
  idea Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([ideaId, userId])
  @@map("idea_collaborators")
  @@index([userId])
  @@index([ideaId])
}

// Note: Max 3 collaborators constraint enforced at application level
// in collaborators-add.ts endpoint
```

### Key Schema Changes

| Change | Reason | Impact |
|--------|--------|--------|
| Add `document` (JsonB) | Store BlockNote editor content | New field |
| Add `whiteboard` (JsonB) | Store Excalidraw canvas data | New field |
| Remove `canvasData` from Idea | Moved to `Workspace.whiteboard` | Data migration needed |
| Change `content` JSON → JsonB | Better PostgreSQL indexing | Performance improvement |
| Add `archived` to Workspace | Soft delete support | New feature |
| Keep 1:1 Idea-Workspace | Business constraint | No change |

---

## ✅ Implementation Checklist

### Phase 9.1: Schema Migration (Priority: CRITICAL)

- [ ] **9.1.1** Update Prisma schema file
  - [ ] Add `document Json? @db.JsonB` to Workspace model
  - [ ] Add `whiteboard Json? @db.JsonB` to Workspace model
  - [ ] Add `archived Boolean @default(false)` to Workspace model
  - [ ] Remove `canvasData` field from Idea model (if exists)
  - [ ] Remove old `content Json` from Workspace, or repurpose it
  - [ ] Verify all indexes are present

- [ ] **9.1.2** Create migration script
  ```bash
  # Run from IDEA_HUB directory
  npx prisma migrate dev --name add_workspace_document_whiteboard_fields
  ```

- [ ] **9.1.3** Data migration (if needed)
  - [ ] If `Idea.canvasData` has existing data, migrate to `Workspace.whiteboard`
  - [ ] Create migration script to copy data
  - [ ] Verify data integrity

- [ ] **9.1.4** Regenerate Prisma Client
  ```bash
  npx prisma generate
  ```

### Phase 9.2: Backend API Updates (Priority: HIGH)

- [ ] **9.2.1** Update `workspaces-get.ts`
  - [ ] Return `document` and `whiteboard` fields
  - [ ] Add access control checks (owner/collaborator/public)
  - [ ] Transform data to match Next.js workspace component expectations

- [ ] **9.2.2** Update `workspaces-update.ts`
  - [ ] Accept `document` and `whiteboard` in request body
  - [ ] Validate JSON structure
  - [ ] Enforce edit permissions (owner/editor only)
  - [ ] Update `updatedAt` timestamp

- [ ] **9.2.3** Update `ideas-create.ts`
  - [ ] Create workspace with empty `document` and `whiteboard`
  - [ ] Set initial workspace name from idea title
  - [ ] Ensure atomic creation (Idea + Workspace in transaction)

- [ ] **9.2.4** Update `ideas-fork.ts`
  - [ ] Copy source workspace `document` and `whiteboard` to new workspace
  - [ ] Set `isFork=true` and `forkedFrom` on new idea
  - [ ] Create new workspace for forked idea

- [ ] **9.2.5** Create new endpoint: `workspaces-archive.ts`
  ```typescript
  // PATCH /api/workspaces/:id/archive
  // Sets workspace.archived = true
  // Only owner can archive
  ```

### Phase 9.3: Workspace Component Migration (Priority: HIGH)

- [ ] **9.3.1** Copy Next.js workspace components
  - [ ] Copy `ideahubORM/app/(routes)/workspace` → `IDEA_HUB/workspace-app`
  - [ ] Copy `ideahubORM/app/_components/` (Canvas, Editor, etc.)
  - [ ] Copy `ideahubORM/app/_context/FileListContext.tsx`
  - [ ] Copy dependencies from `ideahubORM/package.json`

- [ ] **9.3.2** Install workspace dependencies
  ```bash
  # Add to IDEA_HUB/package.json
  npm install @blocknote/core @blocknote/react
  npm install @excalidraw/excalidraw
  npm install next react-dom  # If not already installed
  npm install convex  # If used in ideahubORM
  ```

- [ ] **9.3.3** Update workspace component imports
  - [ ] Change Prisma client import paths
  - [ ] Update API endpoint URLs
  - [ ] Replace `File` model references with `Workspace`
  - [ ] Update field names: `fileName` → `name`, etc.

- [ ] **9.3.4** Create workspace configuration
  - [ ] Create `workspace-app/next.config.js` if needed
  - [ ] Configure basePath for `/workspace` route
  - [ ] Set up API routes in workspace-app

### Phase 9.4: Access Control Implementation (Priority: CRITICAL)

- [ ] **9.4.1** Create workspace permission utility
  ```typescript
  // src/lib/workspace-permissions.ts
  export interface WorkspacePermissions {
    canView: boolean;
    canEdit: boolean;
    canInvite: boolean;
    canArchive: boolean;
    canFork: boolean;
  }
  
  export function getWorkspacePermissions(
    workspace: Workspace,
    idea: Idea,
    currentUser: User | null,
    collaborators: IdeaCollaborator[]
  ): WorkspacePermissions;
  ```

- [ ] **9.4.2** Implement permission matrix (see below)

- [ ] **9.4.3** Update all workspace endpoints to use permissions
  - [ ] workspaces-get.ts → check `canView`
  - [ ] workspaces-update.ts → check `canEdit`
  - [ ] collaborators-add.ts → check `canInvite` (max 3)

### Phase 9.5: Routing Integration (Priority: HIGH)

- [ ] **9.5.1** Update React Router configuration
  ```typescript
  // src/App.tsx or routing config
  
  // View-only idea (public)
  <Route path="/ideas/:ideaId" element={<IdeaDetailsPage />} />
  <Route path="/:username/:ideaSlug" element={<IdeaDetailsPage />} />
  
  // Edit workspace (requires permissions)
  <Route path="/workspace/:ideaId" element={<WorkspaceEditorPage />} />
  <Route path="/workspace/:ideaId/edit" element={<WorkspaceEditorPage />} />
  ```

- [ ] **9.5.2** Create workspace router wrapper
  - [ ] Check if user has edit permissions
  - [ ] Show read-only view or full editor based on permissions
  - [ ] Handle fork flow if user wants to edit but can't

- [ ] **9.5.3** Update navigation links
  - [ ] Update "Edit Idea" button to route to `/workspace/:ideaId`
  - [ ] Add "View Workspace" button for public ideas
  - [ ] Show "Fork to Edit" button if user lacks edit permissions

### Phase 9.6: Idea Creation Flow (Priority: HIGH)

- [ ] **9.6.1** Create idea creation modal component
  ```typescript
  // src/components/Ideas/CreateIdeaModal.tsx
  interface CreateIdeaFormData {
    title: string;
    description: string;
    tags: string[];
    category: string;
    visibility: 'PUBLIC' | 'PRIVATE';
  }
  ```

- [ ] **9.6.2** Implement creation flow
  1. User clicks "New Idea" button
  2. Modal appears with form fields
  3. On submit:
     - Call `POST /api/ideas-create`
     - Backend creates Idea + Workspace atomically
     - Return `{ idea, workspace }`
  4. Redirect to `/workspace/:ideaId`
  5. Workspace editor renders with empty canvas/document

- [ ] **9.6.3** Update "New Idea" button in UI
  - [ ] Replace direct navigation with modal trigger
  - [ ] Add form validation
  - [ ] Show loading state during creation
  - [ ] Handle errors gracefully

### Phase 9.7: Fork Mechanism (Priority: MEDIUM)

- [ ] **9.7.1** Implement fork flow
  ```typescript
  // When user clicks "Fork" on public idea:
  1. Check if user is authenticated
  2. Call POST /api/ideas-fork { ideaId }
  3. Backend:
     - Create new Idea (isFork=true, forkedFrom=originalId)
     - Copy Workspace (document, whiteboard)
     - Create IdeaCollaborator (user as OWNER)
     - Increment original Idea.forks count
  4. Redirect to /workspace/:newIdeaId
  ```

- [ ] **9.7.2** Update ForkButton component
  - [ ] Check user permissions before allowing fork
  - [ ] Show fork confirmation modal
  - [ ] Update UI after successful fork

### Phase 9.8: View Mode vs Edit Mode (Priority: HIGH)

- [ ] **9.8.1** Create read-only workspace viewer
  ```typescript
  // src/components/Workspace/WorkspaceViewer.tsx
  // Renders canvas/document in read-only mode
  // No editing, saving, or collaboration features
  ```

- [ ] **9.8.2** Implement mode switching logic
  ```typescript
  function WorkspaceEditorPage() {
    const { ideaId } = useParams();
    const { user } = useAuth();
    const permissions = useWorkspacePermissions(ideaId);
    
    if (!permissions.canView) {
      return <Redirect to="/404" />;
    }
    
    if (permissions.canEdit) {
      return <WorkspaceEditor ideaId={ideaId} />;
    } else {
      return <WorkspaceViewer ideaId={ideaId} />;
    }
  }
  ```

- [ ] **9.8.3** Add "Fork to Edit" prompt
  - [ ] Show banner: "You're viewing read-only. Fork to edit."
  - [ ] Add prominent "Fork This Idea" button
  - [ ] Explain forking process

### Phase 9.9: Collaborator Management (Priority: MEDIUM)

- [ ] **9.9.1** Create collaborator invitation UI
  ```typescript
  // src/components/Workspace/CollaboratorManager.tsx
  // Show current collaborators
  // Add new collaborator (search users)
  // Remove collaborators
  // Change roles (OWNER/EDITOR/VIEWER)
  ```

- [ ] **9.9.2** Enforce max 3 collaborators
  - [ ] Disable "Add Collaborator" button if limit reached
  - [ ] Show warning message
  - [ ] Backend validation in `collaborators-add.ts`

- [ ] **9.9.3** Update workspace header
  - [ ] Show collaborator avatars
  - [ ] Add "Manage Access" button (owner only)
  - [ ] Show current user's role

### Phase 9.10: Testing & Validation (Priority: CRITICAL)

- [ ] **9.10.1** Unit tests
  - [ ] Test workspace permission utility
  - [ ] Test idea creation flow
  - [ ] Test fork mechanism
  - [ ] Test collaborator constraints

- [ ] **9.10.2** Integration tests
  - [ ] Test Idea → Workspace 1:1 creation
  - [ ] Test access control for private ideas
  - [ ] Test public idea view-only access
  - [ ] Test fork creates new workspace

- [ ] **9.10.3** Manual testing scenarios
  - [ ] Create new idea → workspace auto-created
  - [ ] Edit workspace as owner → saves correctly
  - [ ] View public idea as non-owner → read-only
  - [ ] Fork public idea → creates editable copy
  - [ ] Add 3 collaborators → 4th rejected
  - [ ] Private idea → non-collaborators cannot access
  - [ ] Archive workspace → idea remains accessible

### Phase 9.11: Cleanup & Migration (Priority: LOW)

- [ ] **9.11.1** Remove old dummy workspace code
  - [ ] Remove old WorkspacePage.tsx (if dummy)
  - [ ] Remove legacy workspace components
  - [ ] Clean up unused imports

- [ ] **9.11.2** Update documentation
  - [ ] Update MIGRATION_AGENT_NOTES.md (mark Phase 9 complete)
  - [ ] Document workspace architecture
  - [ ] Update API documentation
  - [ ] Add workspace usage guide

- [ ] **9.11.3** Database cleanup
  - [ ] Remove old `canvasData` column from ideas table (if migrated)
  - [ ] Verify all foreign keys are correct
  - [ ] Run VACUUM ANALYZE on database

---

## 🔐 Access Control Matrix

### Permission Rules (Implement in `src/lib/workspace-permissions.ts`)

```typescript
export function getWorkspacePermissions(
  workspace: Workspace,
  idea: Idea,
  currentUser: User | null,
  collaborators: IdeaCollaborator[]
): WorkspacePermissions {
  const isOwner = idea.authorId === currentUser?.id;
  const collaboration = collaborators.find(c => c.userId === currentUser?.id);
  const isCollaborator = !!collaboration;
  const collaboratorRole = collaboration?.role;
  
  const isPublic = idea.visibility === 'PUBLIC';
  const isPrivate = idea.visibility === 'PRIVATE';
  
  return {
    // ── View Permissions ──────────────────────────────────
    canView: 
      isPublic ||                          // Anyone can view public ideas
      isOwner ||                           // Owner can always view
      isCollaborator,                      // Collaborators can view
    
    // ── Edit Permissions ──────────────────────────────────
    canEdit:
      isOwner ||                           // Owner can always edit
      (isCollaborator && collaboratorRole === 'EDITOR'), // Editors can edit
    
    // ── Invite Permissions ────────────────────────────────
    canInvite:
      isOwner &&                           // Only owner can invite
      collaborators.length < 3,            // Max 3 collaborators
    
    // ── Archive Permissions ───────────────────────────────
    canArchive:
      isOwner,                             // Only owner can archive
    
    // ── Fork Permissions ──────────────────────────────────
    canFork:
      isPublic &&                          // Can only fork public ideas
      !isOwner,                            // No need to fork your own idea
  };
}
```

### Access Control Table

| User Type | Public Idea | Private Idea | Can Fork? |
|-----------|-------------|--------------|-----------|
| **Anonymous** | View Only | ❌ No Access | ❌ Must sign in |
| **Authenticated (Non-owner)** | View Only | ❌ No Access | ✅ Yes |
| **Collaborator (VIEWER)** | View Only | View Only | ✅ Yes (public only) |
| **Collaborator (EDITOR)** | ✏️ Edit | ✏️ Edit | ✅ Yes (public only) |
| **Owner** | ✏️ Edit + Manage | ✏️ Edit + Manage | N/A (own idea) |

### Permission Checks in Endpoints

```typescript
// Example: workspaces-update.ts
import { getWorkspacePermissions } from '../lib/workspace-permissions';

export async function handler(event: HandlerEvent) {
  const user = await authenticateRequest(event);
  const { ideaId } = event.pathParameters;
  
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { workspace: true, collaborators: true }
  });
  
  const permissions = getWorkspacePermissions(
    idea.workspace,
    idea,
    user,
    idea.collaborators
  );
  
  if (!permissions.canEdit) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'You do not have permission to edit this workspace' })
    };
  }
  
  // Proceed with update...
}
```

---

## 🛣️ Routing Strategy

### URL Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        Route Map                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📖 View Ideas (Read-Only)                                  │
│  ├─ /ideas/:ideaId             → Idea details page          │
│  ├─ /:username/:ideaSlug       → Pretty URL for idea        │
│  └─ /ideas/:ideaId/view        → Explicit view route        │
│                                                             │
│  ✏️ Edit Workspace (Requires Permissions)                   │
│  ├─ /workspace/:ideaId         → Workspace editor           │
│  ├─ /workspace/:ideaId/edit    → Explicit edit route        │
│  └─ /:username/:ideaSlug/edit  → Pretty URL for editing     │
│                                                             │
│  🍴 Fork Ideas                                              │
│  └─ POST /api/ideas-fork       → Creates fork + workspace   │
│                                                             │
│  👥 Collaboration                                           │
│  ├─ /workspace/:ideaId/collaborators → Manage collaborators│
│  └─ POST /api/collaborators-add      → Add collaborator    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Route Protection

```typescript
// src/pages/WorkspaceEditorPage.tsx
export function WorkspaceEditorPage() {
  const { ideaId } = useParams();
  const { user } = useAuth();
  const { data: workspace, isLoading } = useQuery(['workspace', ideaId], () =>
    WorkspacesService.getWorkspace(ideaId)
  );
  
  const permissions = useMemo(() => {
    if (!workspace) return null;
    return getWorkspacePermissions(
      workspace,
      workspace.idea,
      user,
      workspace.idea.collaborators
    );
  }, [workspace, user]);
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!permissions?.canView) {
    return <Navigate to="/404" />;
  }
  
  // If public idea and user wants to edit but can't
  if (workspace.idea.visibility === 'PUBLIC' && !permissions.canEdit) {
    return (
      <WorkspaceViewMode workspace={workspace}>
        <ForkPromptBanner ideaId={ideaId} />
      </WorkspaceViewMode>
    );
  }
  
  // User has edit permissions
  return <WorkspaceEditMode workspace={workspace} />;
}
```

---

## 🧪 Testing Requirements

### Test Cases

#### 1. Idea Creation
- [ ] Create idea → workspace auto-created with same ID
- [ ] Workspace has empty `document` and `whiteboard`
- [ ] Owner is automatically added as OWNER collaborator
- [ ] Redirect to `/workspace/:ideaId` after creation

#### 2. Access Control
- [ ] Public idea → anonymous users can view (read-only)
- [ ] Public idea → authenticated non-owners can view (read-only)
- [ ] Public idea → non-owners see "Fork to Edit" prompt
- [ ] Private idea → only owner and collaborators can view
- [ ] Private idea → unauthorized users get 403 error

#### 3. Collaboration
- [ ] Owner can add collaborators
- [ ] Max 3 collaborators enforced
- [ ] EDITOR role can edit workspace
- [ ] VIEWER role cannot edit workspace
- [ ] Removing collaborator revokes access

#### 4. Fork Mechanism
- [ ] Fork creates new Idea with `isFork=true`
- [ ] Fork copies `document` and `whiteboard` from original
- [ ] Fork creates new Workspace linked to new Idea
- [ ] Original idea's `forks` count increments
- [ ] Forked idea has new owner

#### 5. Workspace Editing
- [ ] Save `document` updates to database
- [ ] Save `whiteboard` updates to database
- [ ] `updatedAt` timestamp updates on save
- [ ] Concurrent edits handled gracefully
- [ ] Undo/redo works correctly

#### 6. Data Integrity
- [ ] Deleting Idea cascades to Workspace
- [ ] Deleting User cascades to owned Workspaces
- [ ] Archived workspaces still accessible
- [ ] Forked workspace independent from original

---

## 📦 Dependencies to Install

### For Workspace Components

```json
{
  "dependencies": {
    "@blocknote/core": "^0.12.0",
    "@blocknote/react": "^0.12.0",
    "@excalidraw/excalidraw": "^0.17.0",
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

### Install Commands

```bash
cd /home/ciju/ideahubv4/IDEA_HUB

# Workspace editor dependencies
npm install @blocknote/core@^0.12.0 @blocknote/react@^0.12.0
npm install @excalidraw/excalidraw@^0.17.0

# Next.js (if not already installed)
npm install next@^14.0.0

# Development dependencies
npm install -D @types/react @types/react-dom
```

---

## 🔄 Data Migration Script

### Migrate existing `Idea.canvasData` to `Workspace.whiteboard`

```typescript
// scripts/migrate-canvas-data.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCanvasData() {
  console.log('Starting canvas data migration...');
  
  const ideas = await prisma.idea.findMany({
    where: {
      canvasData: { not: null }
    },
    include: { workspace: true }
  });
  
  console.log(`Found ${ideas.length} ideas with canvas data`);
  
  for (const idea of ideas) {
    if (!idea.workspace) {
      console.warn(`Idea ${idea.id} has no workspace, skipping...`);
      continue;
    }
    
    try {
      await prisma.workspace.update({
        where: { id: idea.workspace.id },
        data: {
          whiteboard: idea.canvasData ? JSON.parse(idea.canvasData) : null
        }
      });
      console.log(`✓ Migrated canvas data for idea ${idea.id}`);
    } catch (error) {
      console.error(`✗ Failed to migrate idea ${idea.id}:`, error);
    }
  }
  
  console.log('Migration complete!');
}

migrateCanvasData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run Migration:**
```bash
npx ts-node scripts/migrate-canvas-data.ts
```

---

## 📝 Implementation Order

### Week 1: Schema & Backend
1. ✅ Schema alignment (9.1)
2. ✅ Backend API updates (9.2)
3. ✅ Permission utility (9.4)

### Week 2: Component Migration
4. ✅ Copy workspace components (9.3)
5. ✅ Update imports and configs (9.3)
6. ✅ Routing integration (9.5)

### Week 3: Features & UX
7. ✅ Idea creation modal (9.6)
8. ✅ View/Edit mode switching (9.8)
9. ✅ Fork mechanism (9.7)
10. ✅ Collaborator UI (9.9)

### Week 4: Testing & Cleanup
11. ✅ Comprehensive testing (9.10)
12. ✅ Cleanup & documentation (9.11)

---

## 🎯 Success Criteria

Phase 9 is complete when:

- [x] Schema merged and migrated successfully
- [x] Workspace components render without errors
- [x] Idea creation creates workspace atomically
- [x] Public ideas show read-only workspace view
- [x] Authenticated users can fork public ideas
- [x] Owners can edit their workspaces
- [x] Collaborators (max 3) can be added
- [x] EDITOR role can edit, VIEWER role cannot
- [x] Private ideas only accessible by owner/collaborators
- [x] All tests passing
- [x] No dummy workspace code remains

---

## 📚 References

- **Current Prisma Schema**: `/home/ciju/ideahubv4/IDEA_HUB/prisma/schema.prisma`
- **ideahubORM Schema**: `/home/ciju/ideahubv4/IDEA_HUB/ideahubORM/prisma/schema.prisma`
- **Workspace Components**: `/home/ciju/ideahubv4/IDEA_HUB/ideahubORM/app/(routes)/workspace`
- **Migration Notes**: `/home/ciju/ideahubv4/IDEA_HUB/MIGRATION_AGENT_NOTES.md`
- **Phase 8 Summary**: `/home/ciju/ideahubv4/IDEA_HUB/PHASE_8_COMPLETION_SUMMARY.md`

---

## 🚀 Next Phase Preview

**Phase 10: Environment & Configuration** (formerly Phase 9)
- Update .env files
- Configure build process
- Update documentation

**Phase 11: Testing & Cleanup** (formerly Phase 10)
- Comprehensive end-to-end tests
- Remove Supabase dependencies
- Performance optimization

**Phase 12: Documentation** (formerly Phase 11)
- Final documentation
- Deployment guide
- Migration summary

---

**Status**: Ready for Implementation  
**Estimated Effort**: 3-4 weeks  
**Risk Level**: Medium (component integration complexity)  
**Dependencies**: Phase 8 complete ✅

---

*Generated: October 5, 2025*  
*Last Updated: October 5, 2025*
