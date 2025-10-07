# 🚀 Workspace Integration Plan - GitHub Coding Agent Instructions

## 📋 Project Overview

**Objective**: Integrate the Next.js workspace application (`idea_workspace/ideahubORM`) with the main React SPA (`IDEA_HUB`) using an iframe-based micro-frontend architecture.

**Architecture**: Two separate applications communicating via iframe and postMessage API
- **IDEA_HUB** (React SPA): Main application for idea browsing, user management, and social features
- **idea_workspace** (Next.js): Standalone workspace application with Editor.js and Excalidraw canvas

---

## 🎯 Core Requirements

### 1. **Idea ↔ Workspace Relationship**
- Each Idea MUST have exactly ONE workspace (1:1 relationship)
- Workspaces contain both Document (EditorJS) and Canvas (Excalidraw) content
- An Idea is essentially a read-only view of its workspace

### 2. **Visibility & Permissions**
- **Public Ideas**:
  - Anyone can VIEW (read-only mode)
  - Non-owners must FORK to edit (creates a copy under their account)
  - Owners and collaborators can edit directly
  
- **Private Ideas**:
  - Only owner and added collaborators can view/edit
  - Other users cannot see the idea at all
  - Max 3 collaborators per idea

### 3. **Routing Convention**
All workspace routes must follow this pattern:
```
/{username}/idea/workspace/{ideaId}
```

### 4. **Creation Flow**
1. User clicks "Create Idea"
2. Modal appears with fields: Title, Description, Tags, Category, Visibility
3. On submit: Create BOTH Idea and Workspace in a single transaction
4. Immediately navigate to the workspace editor (iframe)

---

## 🗑️ CRITICAL: Cleanup Existing Dummy Code

**BEFORE starting integration**, you MUST remove all existing dummy workspace implementations from `IDEA_HUB`:

### Files/Directories to DELETE:
```bash
# Remove dummy workspace components
src/components/Workspace/
  ├── CanvasWorkspace.tsx          # DELETE
  ├── DocumentWorkspace.tsx        # DELETE
  ├── EraserWorkspace.tsx          # DELETE
  ├── WorkspaceHeader.tsx          # DELETE (if exists)
  └── WorkspaceTabs.tsx            # DELETE (if exists)

# Remove dummy workspace pages
src/pages/
  ├── WorkspacePage.tsx            # DELETE
  └── WorkspacesListPage.tsx       # KEEP (lists user's ideas, not workspace UI)
```

### Code References to REMOVE:

1. **In `src/App.tsx`**: Remove any routes pointing to old workspace components
   ```typescript
   // REMOVE routes like:
   <Route path="/workspace/:id" element={<WorkspacePage />} />
   <Route path="/workspaces" element={<WorkspacesListPage />} /> // KEEP THIS ONE
   ```

2. **In Navigation Components**: Remove links to old workspace pages
   - Check `src/components/Layout/Header.tsx`
   - Check `src/components/Layout/Sidebar.tsx`
   - Remove any "Workspace" navigation items that point to dummy components

3. **In API Services**: Keep API calls, remove only UI imports
   - Keep: `src/services/api.ts` workspace-related functions
   - Remove: Any imports of deleted workspace components

4. **Search and Remove**:
   ```bash
   # Search for imports of deleted components
   grep -r "CanvasWorkspace" src/
   grep -r "DocumentWorkspace" src/
   grep -r "EraserWorkspace" src/
   # Remove these imports and their usage
   ```

### Files to KEEP:
```bash
# These are NOT workspace UI - they're idea management
src/pages/WorkspacesListPage.tsx   # Lists user's ideas (rename to IdeasListPage later)
netlify/functions/workspaces-*.ts   # Backend API (will be refactored)
```

---

## 🏗️ Implementation Steps

### **Phase 1: Database Schema & Migration**

#### 1.1 Update Prisma Schema
Update `prisma/schema.prisma` in the ROOT of IDEA_HUB:

**Key Changes**:
```prisma
model Idea {
  id          String     @id @default(uuid())
  title       String
  description String
  content     String     @db.Text
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
  status      Status     @default(DRAFT)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  authorId    String     @map("author_id")
  
  // Relations
  author         User               @relation("AuthorIdeas", fields: [authorId], references: [id], onDelete: Cascade)
  forkedFromIdea Idea?              @relation("IdeaForks", fields: [forkedFrom], references: [id], onDelete: SetNull)
  forkIdeas      Idea[]             @relation("IdeaForks")
  workspace      Workspace?         @relation("IdeaWorkspace") // ⭐ ONE-TO-ONE
  collaborators  IdeaCollaborator[]
  comments       Comment[]
  starredBy      Star[]
  notifications  Notification[]
  
  @@map("ideas")
  @@index([authorId])
  @@index([visibility, status])
}

model Workspace {
  id        String   @id @default(uuid())
  name      String
  ideaId    String   @unique @map("idea_id") // ⭐ UNIQUE CONSTRAINT
  userId    String   @map("user_id")
  
  // ⭐ Store both document and canvas content
  document   Json?    @default("{}") // EditorJS blocks
  whiteboard Json?    @default("{\"elements\": [], \"appState\": {}}") // Excalidraw elements
  
  thumbnail String?  @db.Text
  isPublic  Boolean  @default(false) @map("is_public")
  archived  Boolean  @default(false) // ⭐ For soft delete
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // Relations
  idea  Idea @relation("IdeaWorkspace", fields: [ideaId], references: [id], onDelete: Cascade)
  owner User @relation("WorkspaceOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("workspaces")
  @@index([userId])
  @@index([ideaId])
}
```

**Important Notes**:
- The `Workspace` model should match the structure from `idea_workspace/ideahubORM/prisma/schema.prisma`
- Ensure `IdeaCollaborator` model exists with max 3 collaborators constraint
- Keep all existing enums: `Visibility`, `Status`, `CollaboratorRole`

#### 1.2 Run Migration
```bash
cd /home/ciju/ideahubv6/IDEA_HUB
npx prisma migrate dev --name add_workspace_to_idea_relation
npx prisma generate
```

---

### **Phase 2: Update Backend API Functions**

#### 2.1 Update `netlify/functions/ideas-create.ts`

**Current**: Creates only Idea
**Required**: Create BOTH Idea AND Workspace in a transaction

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Get user from auth (implement your auth logic)
  const userId = event.headers['x-user-id']; // or from JWT
  
  const { title, description, tags, category, visibility } = JSON.parse(event.body);

  try {
    // ⭐ Create Idea and Workspace in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the idea
      const idea = await tx.idea.create({
        data: {
          title,
          description,
          content: '', // Initially empty
          tags,
          category,
          visibility: visibility || 'PUBLIC',
          status: 'DRAFT',
          authorId: userId,
        },
      });

      // Create the workspace
      const workspace = await tx.workspace.create({
        data: {
          name: title, // Use idea title as workspace name
          ideaId: idea.id,
          userId: userId,
          document: {}, // Empty EditorJS state
          whiteboard: { elements: [], appState: {} }, // Empty Excalidraw state
          isPublic: visibility === 'PUBLIC',
        },
      });

      return { idea, workspace };
    });

    return {
      statusCode: 201,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error creating idea with workspace:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create idea' }),
    };
  }
};
```

#### 2.2 Update `netlify/functions/ideas-fork.ts`

**Required**: Copy workspace content when forking

```typescript
// In the fork handler, after creating the new idea:
const result = await prisma.$transaction(async (tx) => {
  // Get original workspace
  const originalWorkspace = await tx.workspace.findUnique({
    where: { ideaId: originalIdeaId },
  });

  // Create forked idea
  const forkedIdea = await tx.idea.create({
    data: {
      // ... existing fork data
      isFork: true,
      forkedFrom: originalIdeaId,
    },
  });

  // Create workspace with copied content
  const forkedWorkspace = await tx.workspace.create({
    data: {
      name: forkedIdea.title,
      ideaId: forkedIdea.id,
      userId: currentUserId,
      document: originalWorkspace.document, // ⭐ Copy content
      whiteboard: originalWorkspace.whiteboard, // ⭐ Copy content
      isPublic: forkedIdea.visibility === 'PUBLIC',
    },
  });

  return { idea: forkedIdea, workspace: forkedWorkspace };
});
```

#### 2.3 Create New Function: `netlify/functions/workspace-permissions.ts`

This checks if a user can view/edit a workspace:

```typescript
export const handler = async (event) => {
  const { ideaId } = event.queryStringParameters;
  const userId = event.headers['x-user-id'];

  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: {
      workspace: true,
      collaborators: true,
    },
  });

  if (!idea) {
    return { statusCode: 404, body: 'Idea not found' };
  }

  // Check permissions
  const isOwner = idea.authorId === userId;
  const isCollaborator = idea.collaborators.some(c => c.userId === userId);
  const canEdit = isOwner || idea.collaborators.some(
    c => c.userId === userId && c.role === 'EDITOR'
  );
  const canView = idea.visibility === 'PUBLIC' || isOwner || isCollaborator;

  return {
    statusCode: 200,
    body: JSON.stringify({
      idea,
      workspace: idea.workspace,
      permissions: {
        canView,
        canEdit,
        isOwner,
        isCollaborator,
      },
    }),
  };
};
```

---

### **Phase 3: Create React Components for iframe Integration**

#### 3.1 Create `src/components/Workspace/WorkspaceIframe.tsx`

This is the NEW workspace component (replaces all deleted dummy components):

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceIframeProps {
  workspaceId: string;
  ideaId: string;
  mode: 'view' | 'edit';
  canFork?: boolean;
  onFork?: () => void;
}

export const WorkspaceIframe: React.FC<WorkspaceIframeProps> = ({
  workspaceId,
  ideaId,
  mode,
  canFork = false,
  onFork,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const navigate = useNavigate();

  // Get auth token
  const token = localStorage.getItem('auth_token'); // Adjust based on your auth

  // Construct workspace URL
  const WORKSPACE_APP_URL = import.meta.env.VITE_WORKSPACE_APP_URL || 'http://localhost:3001';
  const workspaceUrl = `${WORKSPACE_APP_URL}/workspace/${workspaceId}?mode=${mode}&token=${token}&readOnly=${mode === 'view'}`;

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin
      if (!event.origin.includes('localhost:3001')) return;

      const { type, payload } = event.data;

      switch (type) {
        case 'WORKSPACE_LOADED':
          setIsLoaded(true);
          console.log('Workspace loaded successfully');
          break;

        case 'FORK_REQUEST':
          if (onFork) onFork();
          break;

        case 'SAVE_SUCCESS':
          console.log('Workspace saved:', payload);
          // Optional: Show toast notification
          break;

        case 'TITLE_CHANGED':
          // Update idea title if needed
          console.log('Title changed:', payload.title);
          break;

        case 'ERROR':
          console.error('Workspace error:', payload);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onFork]);

  return (
    <div className="workspace-iframe-container w-full h-full relative">
      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading workspace...</p>
          </div>
        </div>
      )}

      {/* Read-only banner */}
      {mode === 'view' && canFork && (
        <div className="absolute top-0 left-0 right-0 bg-yellow-100 dark:bg-yellow-900 px-4 py-2 flex items-center justify-between z-10">
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            📖 You're viewing this workspace in read-only mode
          </span>
          <button
            onClick={onFork}
            className="px-4 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
          >
            Fork to Edit
          </button>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={workspaceUrl}
        className={`w-full h-full border-0 ${mode === 'view' && canFork ? 'mt-10' : ''}`}
        title="Workspace Editor"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};
```

#### 3.2 Create `src/pages/WorkspaceViewPage.tsx`

This is the NEW page that renders the workspace iframe:

```typescript
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkspaceIframe } from '../components/Workspace/WorkspaceIframe';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const WorkspaceViewPage: React.FC = () => {
  const { username, ideaId } = useParams<{ username: string; ideaId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<any>(null);
  const [ideaData, setIdeaData] = useState<any>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        
        // Fetch idea and permission data
        const response = await fetch(`/.netlify/functions/workspace-permissions?ideaId=${ideaId}`, {
          headers: {
            'x-user-id': user?.id || '',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch workspace permissions');
        }

        const data = await response.json();
        
        // Check if user can view
        if (!data.permissions.canView) {
          setError('You do not have permission to view this workspace');
          return;
        }

        setIdeaData(data.idea);
        setPermissions(data.permissions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (ideaId && user) {
      fetchPermissions();
    }
  }, [ideaId, user]);

  const handleFork = async () => {
    try {
      // Call fork API
      const response = await fetch('/.netlify/functions/ideas-fork', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({ ideaId }),
      });

      const data = await response.json();
      
      // Navigate to forked workspace
      navigate(`/${user?.username}/idea/workspace/${data.idea.id}`);
    } catch (error) {
      console.error('Fork failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const mode = permissions?.canEdit ? 'edit' : 'view';
  const canFork = !permissions?.isOwner && !permissions?.isCollaborator && ideaData?.visibility === 'PUBLIC';

  return (
    <div className="h-screen flex flex-col">
      {/* Optional: Workspace header */}
      <div className="bg-white dark:bg-gray-800 border-b px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{ideaData?.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            by {username}
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
      </div>

      {/* Workspace iframe */}
      <div className="flex-1">
        <WorkspaceIframe
          workspaceId={ideaData?.workspace?.id}
          ideaId={ideaId!}
          mode={mode}
          canFork={canFork}
          onFork={handleFork}
        />
      </div>
    </div>
  );
};
```

#### 3.3 Update `src/App.tsx` - Add New Route

```typescript
import { WorkspaceViewPage } from './pages/WorkspaceViewPage';

// In your Routes component:
<Routes>
  {/* ... existing routes ... */}
  
  {/* ⭐ NEW: Workspace view route */}
  <Route 
    path="/:username/idea/workspace/:ideaId" 
    element={
      <ProtectedRoute>
        <WorkspaceViewPage />
      </ProtectedRoute>
    } 
  />
  
  {/* ... other routes ... */}
</Routes>
```

---

### **Phase 4: Update idea_workspace (Next.js) for iframe Integration**

#### 4.1 Update `idea_workspace/ideahubORM/app/(routes)/workspace/[fileId]/page.tsx`

Add support for query parameters and authentication:

```typescript
export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: { fileId: string };
  searchParams: { mode?: string; token?: string; readOnly?: string };
}) {
  const { fileId } = params;
  const { mode = 'edit', token, readOnly = 'false' } = searchParams;

  // ⭐ Validate token (implement your auth validation)
  // const user = await validateToken(token);
  // if (!user) {
  //   return <div>Unauthorized</div>;
  // }

  // Fetch workspace data
  const workspace = await prisma.workspace.findUnique({
    where: { id: fileId },
    include: {
      idea: {
        include: {
          author: true,
          collaborators: true,
        },
      },
    },
  });

  if (!workspace) {
    return <div>Workspace not found</div>;
  }

  // Determine if read-only
  const isReadOnly = readOnly === 'true' || mode === 'view';

  return (
    <WorkspaceClient
      workspace={workspace}
      readOnly={isReadOnly}
    />
  );
}
```

#### 4.2 Create `idea_workspace/ideahubORM/app/(routes)/workspace/_components/WorkspaceClient.tsx`

Client component to handle postMessage communication:

```typescript
'use client';

import { useEffect } from 'react';
import Editor from './Editor';
import Canvas from './Canvas';

interface WorkspaceClientProps {
  workspace: any;
  readOnly: boolean;
}

export default function WorkspaceClient({ workspace, readOnly }: WorkspaceClientProps) {
  // Notify parent window when loaded
  useEffect(() => {
    window.parent.postMessage(
      { type: 'WORKSPACE_LOADED', source: 'workspace' },
      '*' // In production, specify parent origin
    );
  }, []);

  // Handle fork button click
  const handleForkRequest = () => {
    window.parent.postMessage(
      { type: 'FORK_REQUEST', payload: { ideaId: workspace.ideaId }, source: 'workspace' },
      '*'
    );
  };

  // Handle save
  const handleSave = async (data: any) => {
    try {
      // Save to database
      await fetch(`/api/workspace/${workspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      // Notify parent
      window.parent.postMessage(
        { type: 'SAVE_SUCCESS', payload: { timestamp: new Date() }, source: 'workspace' },
        '*'
      );
    } catch (error) {
      window.parent.postMessage(
        { type: 'ERROR', payload: { message: error.message }, source: 'workspace' },
        '*'
      );
    }
  };

  return (
    <div className="workspace-container">
      {readOnly && (
        <div className="read-only-banner">
          This workspace is in view-only mode
        </div>
      )}

      <Editor
        initialContent={workspace.document}
        readOnly={readOnly}
        onSave={(content) => handleSave({ document: content })}
      />

      <Canvas
        initialData={workspace.whiteboard}
        readOnly={readOnly}
        onSave={(data) => handleSave({ whiteboard: data })}
      />

      {readOnly && (
        <button onClick={handleForkRequest}>
          Fork to Edit
        </button>
      )}
    </div>
  );
}
```

---

### **Phase 5: Update Create Idea Flow**

#### 5.1 Update `src/components/Ideas/CreateIdeaModal.tsx` (or create if doesn't exist)

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface CreateIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateIdeaModal: React.FC<CreateIdeaModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string>('');
  const [category, setCategory] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isCreating, setIsCreating] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch('/.netlify/functions/ideas-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          title,
          description,
          tags: tags.split(',').map(t => t.trim()),
          category,
          visibility,
        }),
      });

      const data = await response.json();
      
      // Navigate to workspace
      navigate(`/${user?.username}/idea/workspace/${data.idea.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create idea:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Create New Idea</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
              placeholder="My amazing idea..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              rows={3}
              required
              placeholder="Describe your idea..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="ai, productivity, design (comma separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="">Select category</option>
              <option value="technology">Technology</option>
              <option value="business">Business</option>
              <option value="design">Design</option>
              <option value="education">Education</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Visibility *</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="PUBLIC"
                  checked={visibility === 'PUBLIC'}
                  onChange={(e) => setVisibility(e.target.value as 'PUBLIC')}
                  className="mr-2"
                />
                Public
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="PRIVATE"
                  checked={visibility === 'PRIVATE'}
                  onChange={(e) => setVisibility(e.target.value as 'PRIVATE')}
                  className="mr-2"
                />
                Private
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create & Open Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

---

## 🔧 Configuration

### Environment Variables

#### In `IDEA_HUB/.env`:
```env
VITE_WORKSPACE_APP_URL=http://localhost:3001
DATABASE_URL=your_postgres_connection_string
```

#### In `idea_workspace/ideahubORM/.env`:
```env
DATABASE_URL=your_postgres_connection_string  # ⭐ SAME as main app
NEXT_PUBLIC_MAIN_APP_URL=http://localhost:5173
```

---

## ✅ Testing Checklist

After implementation, test these scenarios:

### 1. **Create Idea Flow**
- [ ] Modal opens with all required fields
- [ ] On submit, both Idea and Workspace are created
- [ ] Immediately navigates to workspace editor
- [ ] Workspace iframe loads correctly
- [ ] Can edit both document and canvas

### 2. **View Public Idea (Non-owner)**
- [ ] Can navigate to `/{creator}/idea/workspace/{ideaId}`
- [ ] Workspace loads in read-only mode
- [ ] Cannot edit document or canvas
- [ ] "Fork to Edit" button is visible
- [ ] Fork button works and creates copy

### 3. **Fork Workflow**
- [ ] Fork creates new Idea and Workspace
- [ ] Forked workspace contains copied content
- [ ] Forked idea shows `isFork: true` and `forkedFrom` reference
- [ ] Navigate to new forked workspace
- [ ] Can edit forked workspace

### 4. **Private Idea with Collaborators**
- [ ] Owner can add collaborators (max 3)
- [ ] Collaborators with EDITOR role can edit
- [ ] Collaborators with VIEWER role can only view
- [ ] Non-collaborators get permission error

### 5. **Routing**
- [ ] All workspace routes follow `/{username}/idea/workspace/{ideaId}` pattern
- [ ] Old workspace routes are removed/redirected
- [ ] Navigation works correctly

### 6. **Communication**
- [ ] Workspace iframe sends "WORKSPACE_LOADED" message
- [ ] Save events are communicated to parent
- [ ] Fork requests are communicated to parent
- [ ] Parent can receive and handle all messages

---

## 📦 Deployment Considerations (For Later)

When ready to deploy, consider:

1. **Same domain approach**: Use reverse proxy
2. **Subdomain approach**: `workspace.ideahub.com`
3. **CORS configuration**: Allow iframe embedding
4. **Authentication**: Share JWT tokens securely
5. **Database**: Both apps share same PostgreSQL instance

---

## 🚨 Important Notes

1. **DO NOT modify** the Next.js workspace components (Editor.tsx, Canvas components)
2. **Keep** the Next.js app separate - do not try to merge into React
3. **Ensure** both apps connect to the SAME database
4. **Test** postMessage communication thoroughly
5. **Verify** authentication works across iframe boundary
6. **Check** that all dummy workspace code is removed before starting

---

## 📝 Summary

**What this integration achieves**:
✅ Seamless workspace editing via iframe
✅ One-to-one Idea ↔ Workspace relationship
✅ Proper permission handling (view/edit/fork)
✅ Clean separation of concerns
✅ Both apps remain in their optimal frameworks
✅ Unified database schema
✅ No refactoring of existing Next.js workspace

**Architecture**:
- React SPA: Navigation, idea management, social features
- Next.js (iframe): Workspace editing (document + canvas)
- Communication: postMessage API
- Database: Single shared PostgreSQL

---

## 🎯 Success Criteria

The integration is successful when:
1. ✅ User can create idea and immediately start editing workspace
2. ✅ Public ideas can be viewed (read-only) by anyone
3. ✅ Non-owners must fork to edit public ideas
4. ✅ Private ideas are only accessible to owner/collaborators
5. ✅ All workspace routes follow `/{username}/idea/workspace/{ideaId}` pattern
6. ✅ No dummy workspace components remain in IDEA_HUB
7. ✅ Both document and canvas work perfectly in iframe
8. ✅ Changes are auto-saved and communicated properly

---

**End of Integration Plan**

Good luck with the implementation! 🚀
