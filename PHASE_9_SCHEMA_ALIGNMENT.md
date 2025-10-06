# Schema Alignment Guide - Phase 9

**Phase:** 9 of 12  
**Purpose:** Show exact schema transformations for merging ideahubORM workspace into IDEA_HUB  
**Date:** October 5, 2025

---

## 📊 Schema Transformation Overview

### Before: Two Separate Schemas

#### Schema A: IDEA_HUB (Current)
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
  
  @@map("workspaces")
  @@index([userId])
  @@index([ideaId])
}
```

#### Schema B: ideahubORM (Current)
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

### After: Unified Schema

```prisma
model Workspace {
  id         String   @id @default(uuid())
  name       String
  ideaId     String   @unique @map("idea_id")
  userId     String   @map("user_id")
  
  // ✨ MERGED: Content fields from ideahubORM File model
  document   Json?    @db.JsonB  // From File.document
  whiteboard Json?    @db.JsonB  // From File.whiteboard
  
  // ✨ MERGED: Archive functionality from ideahubORM
  archived   Boolean  @default(false)  // From File.archived
  
  // ✨ KEPT: Existing IDEA_HUB fields
  thumbnail  String?  @db.Text
  isPublic   Boolean  @default(false) @map("is_public")
  
  // ✨ KEPT: Timestamps
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  // ✨ KEPT: Relations
  idea  Idea @relation("IdeaWorkspace", fields: [ideaId], references: [id], onDelete: Cascade)
  owner User @relation("WorkspaceOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("workspaces")
  @@index([userId])
  @@index([ideaId])
  @@index([archived])  // ✨ NEW INDEX
}
```

---

## 🔄 Field Mapping

| ideahubORM `File` | → | IDEA_HUB `Workspace` | Type | Notes |
|-------------------|---|----------------------|------|-------|
| `id` | ❌ | - | - | Use Workspace.id instead |
| `fileName` | ❌ | - | - | Use Workspace.name instead |
| `document` | ✅ | `document` | `Json? @db.JsonB` | **ADD THIS** |
| `whiteboard` | ✅ | `whiteboard` | `Json? @db.JsonB` | **ADD THIS** |
| `archived` | ✅ | `archived` | `Boolean @default(false)` | **ADD THIS** |
| `createdAt` | ✅ | `createdAt` | `DateTime` | Already exists |
| `updatedAt` | ✅ | `updatedAt` | `DateTime` | Already exists |
| - | ➕ | `name` | `String` | Already exists |
| - | ➕ | `ideaId` | `String @unique` | Already exists |
| - | ➕ | `userId` | `String` | Already exists |
| - | ➕ | `thumbnail` | `String?` | Already exists |
| - | ➕ | `isPublic` | `Boolean` | Already exists |

---

## 🗑️ Fields to Remove

### From IDEA_HUB Workspace Model

```prisma
// ❌ REMOVE OR REPURPOSE THIS FIELD:
content Json @default("{\"elements\": [], \"appState\": {}}")

// Why: Replaced by `document` and `whiteboard` fields
// Migration: If has data, split into document/whiteboard, otherwise delete
```

### From IDEA_HUB Idea Model

```prisma
// ❌ REMOVE THIS FIELD (if exists):
canvasData String? @map("canvas_data") @db.Text

// Why: Canvas data now stored in Workspace.whiteboard
// Migration: Copy to Workspace.whiteboard before removing
```

---

## 📝 Prisma Migration Script

### Step 1: Update Schema File

Edit `/home/ciju/ideahubv4/IDEA_HUB/prisma/schema.prisma`:

```prisma
model Workspace {
  id         String   @id @default(uuid())
  name       String
  ideaId     String   @unique @map("idea_id")
  userId     String   @map("user_id")
  
  // ✨ ADD THESE THREE LINES:
  document   Json?    @db.JsonB
  whiteboard Json?    @db.JsonB
  archived   Boolean  @default(false)
  
  thumbnail  String?  @db.Text
  isPublic   Boolean  @default(false) @map("is_public")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  idea  Idea @relation("IdeaWorkspace", fields: [ideaId], references: [id], onDelete: Cascade)
  owner User @relation("WorkspaceOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("workspaces")
  @@index([userId])
  @@index([ideaId])
  @@index([archived])  // ✨ ADD THIS LINE
}

model Idea {
  id          String     @id @default(uuid())
  title       String
  description String
  content     String     @db.Text
  
  // ❌ REMOVE THIS LINE (if it exists):
  // canvasData  String?    @map("canvas_data") @db.Text
  
  // ... rest of fields unchanged
}
```

### Step 2: Generate Migration

```bash
cd /home/ciju/ideahubv4/IDEA_HUB
npx prisma migrate dev --name add_workspace_document_whiteboard_archived
```

### Step 3: Verify Migration

```sql
-- This SQL will be generated by Prisma:

-- Add new columns to workspaces table
ALTER TABLE "workspaces" ADD COLUMN "document" JSONB;
ALTER TABLE "workspaces" ADD COLUMN "whiteboard" JSONB;
ALTER TABLE "workspaces" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- Add index for archived column
CREATE INDEX "workspaces_archived_idx" ON "workspaces"("archived");

-- Optional: Remove old columns if they exist
-- ALTER TABLE "ideas" DROP COLUMN "canvas_data";
-- ALTER TABLE "workspaces" DROP COLUMN "content";
```

### Step 4: Regenerate Client

```bash
npx prisma generate
```

---

## 🔄 Data Migration (If Needed)

### Migrate Canvas Data from Idea to Workspace

```typescript
// scripts/migrate-canvas-to-whiteboard.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCanvasData() {
  const ideas = await prisma.idea.findMany({
    where: { canvasData: { not: null } },
    include: { workspace: true }
  });

  console.log(`Migrating ${ideas.length} ideas with canvas data...`);

  for (const idea of ideas) {
    if (!idea.workspace) continue;

    try {
      const canvasData = JSON.parse(idea.canvasData!);
      
      await prisma.workspace.update({
        where: { id: idea.workspace.id },
        data: { whiteboard: canvasData }
      });

      console.log(`✓ Migrated idea ${idea.id}`);
    } catch (error) {
      console.error(`✗ Failed to migrate idea ${idea.id}:`, error);
    }
  }

  console.log('Migration complete!');
}

migrateCanvasData()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
```

**Run:**
```bash
npx ts-node scripts/migrate-canvas-to-whiteboard.ts
```

---

## 📊 Content Structure Specifications

### Document Field (BlockNote Editor)

```typescript
interface DocumentContent {
  type: "doc";
  content: Array<{
    type: "paragraph" | "heading" | "bulletList" | "orderedList" | "codeBlock";
    content?: Array<{
      type: "text";
      text: string;
      marks?: Array<{ type: "bold" | "italic" | "underline" }>;
    }>;
    attrs?: {
      level?: number;  // For headings
      language?: string;  // For code blocks
    };
  }>;
}

// Example:
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "My Idea" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is my " },
        { "type": "text", "text": "amazing", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": " idea!" }
      ]
    }
  ]
}
```

### Whiteboard Field (Excalidraw Canvas)

```typescript
interface WhiteboardContent {
  type: "excalidraw";
  version: number;
  source: string;
  elements: Array<{
    type: "rectangle" | "diamond" | "ellipse" | "arrow" | "line" | "freedraw" | "text";
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    strokeColor: string;
    backgroundColor: string;
    fillStyle: "solid" | "hachure" | "cross-hatch";
    strokeWidth: number;
    roughness: number;
    opacity: number;
    text?: string;  // For text elements
    points?: Array<[number, number]>;  // For line/freedraw
  }>;
  appState: {
    viewBackgroundColor: string;
    currentItemStrokeColor: string;
    currentItemBackgroundColor: string;
    zoom: { value: number };
    scrollX: number;
    scrollY: number;
  };
}

// Example:
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [
    {
      "type": "rectangle",
      "id": "abc123",
      "x": 100,
      "y": 100,
      "width": 200,
      "height": 150,
      "angle": 0,
      "strokeColor": "#000000",
      "backgroundColor": "#ffffff",
      "fillStyle": "hachure",
      "strokeWidth": 2,
      "roughness": 1,
      "opacity": 100
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "zoom": { "value": 1 }
  }
}
```

---

## 🔍 Type Definitions (TypeScript)

### Updated Workspace Type

```typescript
// src/types/workspace.ts

export interface Workspace {
  id: string;
  name: string;
  ideaId: string;
  userId: string;
  
  // ✨ NEW FIELDS
  document?: DocumentContent | null;
  whiteboard?: WhiteboardContent | null;
  archived: boolean;
  
  // Existing fields
  thumbnail?: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  idea?: Idea;
  owner?: User;
}

export interface WorkspaceUpdateInput {
  name?: string;
  document?: DocumentContent | null;
  whiteboard?: WhiteboardContent | null;
  archived?: boolean;
  thumbnail?: string | null;
  isPublic?: boolean;
}
```

---

## ✅ Validation Checklist

After schema migration, verify:

- [ ] `document` column exists in `workspaces` table
- [ ] `whiteboard` column exists in `workspaces` table
- [ ] `archived` column exists in `workspaces` table with default `false`
- [ ] Index created on `archived` column
- [ ] Old `canvasData` column removed from `ideas` table (if existed)
- [ ] Old `content` column handled in `workspaces` table
- [ ] Prisma client regenerated successfully
- [ ] TypeScript types updated
- [ ] No compilation errors
- [ ] Database constraints intact (1:1 Idea-Workspace)

---

## 🧪 Test Queries

### Create Workspace with New Fields

```typescript
const workspace = await prisma.workspace.create({
  data: {
    name: "My Idea Workspace",
    ideaId: "idea-uuid-here",
    userId: "user-uuid-here",
    document: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello World" }]
        }
      ]
    },
    whiteboard: {
      type: "excalidraw",
      version: 2,
      elements: [],
      appState: { zoom: { value: 1 } }
    },
    archived: false,
    isPublic: false
  }
});
```

### Query with New Fields

```typescript
const workspace = await prisma.workspace.findUnique({
  where: { ideaId: "idea-uuid-here" },
  select: {
    id: true,
    name: true,
    document: true,      // ✨ NEW
    whiteboard: true,    // ✨ NEW
    archived: true,      // ✨ NEW
    thumbnail: true,
    isPublic: true,
    createdAt: true,
    updatedAt: true,
    idea: {
      select: {
        title: true,
        visibility: true,
        authorId: true
      }
    }
  }
});
```

### Update Workspace Content

```typescript
const updated = await prisma.workspace.update({
  where: { id: "workspace-uuid-here" },
  data: {
    document: newDocumentContent,
    whiteboard: newWhiteboardContent,
    updatedAt: new Date()  // Auto-updated by Prisma
  }
});
```

---

## 📋 Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Models** | Workspace (basic) + File (separate DB) | Workspace (enhanced) |
| **Content Storage** | Generic `content` JSON | Specific `document` + `whiteboard` |
| **Archive** | Not supported | Supported via `archived` flag |
| **Database** | Two separate Prisma DBs | Single unified Prisma DB |
| **Type Safety** | Limited | Full TypeScript types |
| **Indexes** | `userId`, `ideaId` | `userId`, `ideaId`, `archived` |

---

**Status:** Schema alignment complete  
**Next:** Implement backend API updates (Phase 9.2)

---

*Created: October 5, 2025*  
*Schema Version: 2.0 (Post-Migration)*
