# 🏗️ Workspace Integration Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         IDEA_HUB System                             │
│                                                                      │
│  ┌────────────────────────┐        ┌─────────────────────────┐     │
│  │   React SPA (Port 3000)│        │  Next.js App (Port 3001)│     │
│  │     IDEA_HUB Main      │◄──────►│   idea_workspace        │     │
│  │                         │ iframe  │                         │     │
│  │  - Browse Ideas         │postMsg │  - Editor.js (Document) │     │
│  │  - User Management      │        │  - Excalidraw (Canvas)  │     │
│  │  - Social Features      │        │  - Auto-save            │     │
│  │  - Permissions          │        │                         │     │
│  └────────────────────────┘        └─────────────────────────┘     │
│           │                                    │                    │
│           └────────────┬───────────────────────┘                    │
│                        │                                            │
│                        ▼                                            │
│           ┌────────────────────────┐                                │
│           │  Netlify Functions     │                                │
│           │  (Serverless APIs)     │                                │
│           │                        │                                │
│           │  - ideas-*             │                                │
│           │  - workspaces-*        │                                │
│           │  - auth-*              │                                │
│           │  - workspace-permissions│                               │
│           └────────────────────────┘                                │
│                        │                                            │
│                        ▼                                            │
│           ┌────────────────────────┐                                │
│           │   PostgreSQL Database  │                                │
│           │   (via Prisma ORM)     │                                │
│           │                        │                                │
│           │  Tables:               │                                │
│           │  - ideas               │                                │
│           │  - workspaces          │                                │
│           │  - users               │                                │
│           │  - idea_collaborators  │                                │
│           └────────────────────────┘                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Data Flow: Creating an Idea

```
┌─────────┐
│  User   │
│ Clicks  │
│ "Create"│
└────┬────┘
     │
     ▼
┌────────────────────────┐
│   IdeaWorkspacePage    │
│  (React Component)     │
└────┬───────────────────┘
     │ API Call: POST /ideas-create
     ▼
┌────────────────────────┐
│ ideas-create.ts        │
│ (Netlify Function)     │
│                        │
│ $transaction {         │
│   1. Create Idea       │
│   2. Create Workspace  │
│ }                      │
└────┬───────────────────┘
     │ Success
     ▼
┌────────────────────────┐
│  Navigate to:          │
│  /:username/idea/      │
│   workspace/:ideaId    │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  WorkspaceViewPage     │
│  (React Component)     │
│                        │
│  1. Fetch permissions  │
│  2. Render iframe      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  WorkspaceIframe       │
│  (React Component)     │
│                        │
│  URL: localhost:3001/  │
│    workspace/{id}?     │
│    mode=edit&          │
│    token=JWT           │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  Next.js Workspace     │
│  (idea_workspace)      │
│                        │
│  - Load workspace data │
│  - Render Editor       │
│  - Render Canvas       │
│  - Send WORKSPACE_     │
│    LOADED event        │
└────────────────────────┘
```

## Data Flow: Editing Workspace

```
┌─────────┐
│  User   │
│ Edits   │
│ Content │
└────┬────┘
     │
     ▼
┌────────────────────────┐
│  Editor or Canvas      │
│  (idea_workspace)      │
│                        │
│  Auto-save triggers    │
└────┬───────────────────┘
     │ API Call: PATCH /api/workspace/{id}
     ▼
┌────────────────────────┐
│ Next.js API Route      │
│ /api/workspace/[id]    │
│                        │
│ Update:                │
│  - document (EditorJS) │
│  - whiteboard (Canvas) │
└────┬───────────────────┘
     │ Update Database
     ▼
┌────────────────────────┐
│  PostgreSQL            │
│  workspaces table      │
│                        │
│  {                     │
│    document: {...}     │
│    whiteboard: {...}   │
│  }                     │
└────┬───────────────────┘
     │ Success
     ▼
┌────────────────────────┐
│ postMessage Event      │
│                        │
│ {                      │
│   type: 'SAVE_SUCCESS',│
│   source: 'workspace'  │
│ }                      │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│  WorkspaceIframe       │
│  (Parent Window)       │
│                        │
│  Receives event,       │
│  shows notification    │
└────────────────────────┘
```

## Data Flow: Forking an Idea

```
┌─────────┐
│  User   │
│ Views   │
│ Public  │
│  Idea   │
└────┬────┘
     │
     ▼
┌────────────────────────┐
│  WorkspaceViewPage     │
│                        │
│  Permission Check:     │
│  - canView: true       │
│  - canEdit: false      │
│  - canFork: true       │
│                        │
│  Show: "Fork to Edit"  │
└────┬───────────────────┘
     │ User clicks Fork
     ▼
┌────────────────────────┐
│  handleFork()          │
│                        │
│  API Call:             │
│  POST /ideas-fork      │
│  { ideaId: "..." }     │
└────┬───────────────────┘
     │
     ▼
┌────────────────────────┐
│ ideas-fork.ts          │
│ (Netlify Function)     │
│                        │
│ $transaction {         │
│   1. Get original      │
│      workspace         │
│   2. Create forked idea│
│   3. Copy workspace    │
│      - document        │
│      - whiteboard      │
│   4. Increment fork    │
│      count             │
│   5. Notify author     │
│ }                      │
└────┬───────────────────┘
     │ Success
     ▼
┌────────────────────────┐
│  Navigate to:          │
│  /:username/idea/      │
│   workspace/:newId     │
│                        │
│  User now owns copy    │
│  and can edit          │
└────────────────────────┘
```

## Permission Model

```
┌──────────────────────────────────────────────────────────┐
│                    Permission Matrix                      │
├──────────────┬──────────┬──────────┬──────────┬──────────┤
│   User Role  │ Can View │ Can Edit │ Can Fork │ Can      │
│              │          │          │          │ Manage   │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Owner        │    ✅    │    ✅    │    ❌    │    ✅    │
│              │          │          │   (own)  │          │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Collaborator │    ✅    │    ✅    │    ❌    │    ❌    │
│ (EDITOR)     │          │          │          │          │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Collaborator │    ✅    │    ❌    │    ❌    │    ❌    │
│ (VIEWER)     │          │          │          │          │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Other User   │    ✅    │    ❌    │    ✅    │    ❌    │
│ (Public Idea)│          │          │          │          │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Other User   │    ❌    │    ❌    │    ❌    │    ❌    │
│(Private Idea)│          │          │          │          │
├──────────────┼──────────┼──────────┼──────────┼──────────┤
│ Anonymous    │    ✅    │    ❌    │    ❌    │    ❌    │
│ (Public Idea)│          │          │          │          │
└──────────────┴──────────┴──────────┴──────────┴──────────┘

Notes:
- "Can Manage" = Change visibility, add/remove collaborators
- Forking creates a new copy under the forking user's ownership
- Max 3 collaborators per idea
```

## Database Schema Relationships

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │
│ username        │
│ email           │
│ ...             │
└────┬────────────┘
     │ 1:N
     │
     ▼
┌─────────────────┐       1:1        ┌─────────────────┐
│     ideas       │◄─────────────────►│   workspaces    │
│─────────────────│                   │─────────────────│
│ id (PK)         │                   │ id (PK)         │
│ title           │                   │ ideaId (FK,UNQ) │
│ description     │                   │ userId (FK)     │
│ authorId (FK)   │                   │ document        │
│ visibility      │                   │ whiteboard      │
│ isFork          │                   │ archived        │
│ forkedFrom (FK) │                   │ ...             │
│ ...             │                   └─────────────────┘
└────┬────────────┘
     │ 1:N
     │
     ▼
┌─────────────────────────┐
│  idea_collaborators     │
│─────────────────────────│
│ id (PK)                 │
│ ideaId (FK)             │
│ userId (FK)             │
│ role (OWNER/EDITOR/     │
│       VIEWER)           │
│ ...                     │
└─────────────────────────┘

Constraints:
- One workspace per idea (UNIQUE ideaId in workspaces)
- Max 3 collaborators per idea (enforced in API)
- Cascade delete: Delete idea → Delete workspace
```

## postMessage Communication

```
┌──────────────────────────────────────────────────────────┐
│              iframe ↔ Parent Communication               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  From Workspace (iframe) → Parent:                      │
│                                                          │
│  {                                                       │
│    type: 'WORKSPACE_LOADED',                             │
│    source: 'workspace'                                   │
│  }                                                       │
│                                                          │
│  {                                                       │
│    type: 'SAVE_SUCCESS',                                 │
│    payload: { timestamp, workspaceId },                  │
│    source: 'workspace'                                   │
│  }                                                       │
│                                                          │
│  {                                                       │
│    type: 'FORK_REQUEST',                                 │
│    payload: { ideaId },                                  │
│    source: 'workspace'                                   │
│  }                                                       │
│                                                          │
│  {                                                       │
│    type: 'ERROR',                                        │
│    payload: { message },                                 │
│    source: 'workspace'                                   │
│  }                                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## File Structure

```
IDEA_HUB/
├── src/
│   ├── components/
│   │   └── Workspace/
│   │       └── WorkspaceIframe.tsx       ← iframe wrapper
│   ├── pages/
│   │   ├── WorkspaceViewPage.tsx         ← main workspace page
│   │   └── IdeaWorkspacePage.tsx         ← redirects to workspace
│   └── App.tsx                           ← routing
│
├── netlify/functions/
│   ├── ideas-create.ts                   ← atomic creation
│   ├── ideas-fork.ts                     ← fork with workspace
│   ├── workspaces-update.ts              ← update document/whiteboard
│   └── workspace-permissions.ts          ← NEW permission checker
│
├── prisma/
│   └── schema.prisma                     ← database schema
│
├── idea_workspace/ideahubORM/
│   ├── app/
│   │   ├── (routes)/workspace/[fileId]/
│   │   │   └── page.tsx                  ← iframe content
│   │   └── api/workspace/[id]/
│   │       └── route.ts                  ← workspace API
│   └── prisma/
│       └── schema.prisma                 ← workspace schema
│
└── Documentation/
    ├── SETUP_GUIDE.md                    ← setup instructions
    ├── INTEGRATION_COMPLETION_SUMMARY.md ← implementation details
    └── MIGRATION_AGENT_NOTES.md          ← architecture overview
```

---

**Legend:**
- `→` HTTP Request
- `←→` Bidirectional Communication
- `▼` Data Flow
- `✅` Allowed
- `❌` Not Allowed
- `PK` Primary Key
- `FK` Foreign Key
- `UNQ` Unique Constraint
