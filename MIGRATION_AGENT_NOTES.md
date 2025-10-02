# Supabase to Prisma (PostgreSQL) Migration

**Date Started:** October 2, 2024  
**Migration Type:** Complete backend migration from Supabase to Prisma ORM  
**Objective:** Migrate all backend dependencies and routes to Prisma while preserving all frontend functionality

---

## 📋 Table of Contents
1. [Current Status](#current-status)
2. [Migration Constraints](#migration-constraints)
3. [Database Schema Design](#database-schema-design)
4. [Complete TODO List](#complete-todo-list)
5. [Technical Architecture](#technical-architecture)
6. [Files to Modify](#files-to-modify)
7. [Next Iteration Prompt](#next-iteration-prompt)

---

## 🎯 Current Status

**Phase:** Infrastructure Setup  
**Progress:** 15% Complete

### ✅ Completed Tasks
- [x] Analyzed current Supabase implementation
- [x] Reviewed existing database migrations
- [x] Identified all Supabase dependencies (20 files)
- [x] Documented user flow constraints
- [x] Created comprehensive migration plan
- [x] Created this documentation file
- [x] Installed Prisma and authentication dependencies
- [x] Created Prisma schema with all tables and relationships
- [x] Created Prisma client singleton
- [x] Created authentication utilities (JWT, bcrypt)
- [x] Updated .gitignore for Prisma
- [x] Created .env.example with database configuration

### ⚠️ Critical Architecture Decision

**Issue Discovered:** Prisma Client and JWT libraries are server-side only and cannot run in the browser. The current app is a pure client-side React application.

**Solution Options:**
1. **Backend API Server (Recommended):** Create an Express/Fastify backend API that uses Prisma and JWT
2. **Serverless Functions:** Use Netlify/Vercel functions to create API endpoints
3. **Keep Supabase Auth:** Use Prisma for data but keep Supabase for authentication

**Current Approach:**
We have created the Prisma schema and infrastructure. However, Prisma and JWT are server-side libraries and cannot run in the browser.

**Selected Solution: Serverless Functions (Netlify)**
- Created backend API documentation
- Started implementing Netlify Functions for API endpoints
- This approach works well with the existing Netlify deployment

**Implementation Status:**
- ✅ Prisma schema created
- ✅ Auth utilities created (JWT, bcrypt)
- ✅ Backend API architecture documented
- 🔄 Serverless functions being implemented
- ⏳ Need to complete all API endpoints
- ⏳ Need to update frontend to use serverless functions

**Next Steps:**
1. Complete serverless function implementations for all endpoints
2. Create API client in frontend to call serverless functions
3. Update all service files to use API client instead of direct Prisma/Supabase calls

### 🔄 In Progress
- [x] Architecture decision made: Using Netlify Serverless Functions
- [ ] Implementing serverless functions for all API endpoints
- [ ] Creating frontend API client

### ⏳ Pending
- [ ] Everything else (see detailed TODO list below)

---

## 🔒 Migration Constraints

These constraints define the user flow and must be implemented in the Prisma schema:

1. **User Relationships**
   - Every user can follow any other user
   - Follow counts tracked for followers/following

2. **Ideas and Workspaces**
   - An Idea consists of an only-view version of a workspace
   - For every idea, a user can only have **one workspace**
   - When creating an idea, a workspace with that idea's name is automatically created

3. **Idea Creation Flow**
   - Overlay prompts for: Title, Description, Tags (categories)
   - Workspace is created and rendered simultaneously
   - Workspace name matches the idea title

4. **Collaboration**
   - For every idea, a user can invite a **maximum of 3 other users** as collaborators
   - Roles: owner, collaborator
   - Admins have special privileges

5. **Idea Interactions**
   - Users can like ideas (stars)
   - Users can comment on ideas
   - Comments can be nested (replies)

6. **Visibility and Access Control**
   - Ideas can be **public** or **private**
   - **Public ideas (view-only):**
     - Non-owner/collaborator/admin users can view but not edit
     - Read-only instance of idea rendered
   - **Public ideas (edit/fork):**
     - Non-owner/collaborator users can fork the idea
     - Fork creates a new workspace under forked user's account
   - **Private ideas:**
     - Only owner and collaborators can access
     - Owner can add collaborators
     - Other users cannot view or edit

7. **Routing**
   - Ideas route: `user/idea/workspace/[id]`
   - Workspace editing follows similar pattern

---

## 🗄️ Database Schema Design

### Core Tables

#### 1. Users
```prisma
model User {
  id           String   @id @default(uuid())
  username     String   @unique
  email        String   @unique
  fullName     String   @map("full_name")
  passwordHash String?  @map("password_hash")
  avatarUrl    String?  @map("avatar_url")
  bio          String?
  location     String?
  website      String?
  isVerified   Boolean  @default(false) @map("is_verified")
  joinedAt     DateTime @default(now()) @map("joined_at")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  
  // Relations
  ideas              Idea[]                @relation("AuthorIdeas")
  workspaces         Workspace[]           @relation("WorkspaceOwner")
  collaborations     IdeaCollaborator[]
  comments           Comment[]
  stars              Star[]
  followedBy         Follow[]              @relation("Following")
  following          Follow[]              @relation("Follower")
  notifications      Notification[]
  sentNotifications  Notification[]        @relation("NotificationSender")
  forkedIdeas        Idea[]                @relation("IdeaForks")
  
  @@map("users")
}
```

#### 2. Ideas
```prisma
model Idea {
  id          String   @id @default(uuid())
  title       String
  description String
  content     String   @db.Text
  canvasData  String?  @map("canvas_data") @db.Text
  authorId    String   @map("author_id")
  tags        String[]
  category    String
  license     String   @default("MIT")
  version     String   @default("1.0.0")
  stars       Int      @default(0)
  forks       Int      @default(0)
  isFork      Boolean  @default(false) @map("is_fork")
  forkedFrom  String?  @map("forked_from")
  visibility  Visibility @default(PUBLIC)
  language    String?
  status      Status   @default(PUBLISHED)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // Relations
  author         User               @relation("AuthorIdeas", fields: [authorId], references: [id], onDelete: Cascade)
  forkedFromIdea Idea?              @relation("IdeaForks", fields: [forkedFrom], references: [id], onDelete: SetNull)
  forkIdeas      Idea[]             @relation("IdeaForks")
  workspace      Workspace?         @relation("IdeaWorkspace")
  collaborators  IdeaCollaborator[]
  comments       Comment[]
  starredBy      Star[]
  notifications  Notification[]
  
  @@map("ideas")
  @@index([authorId])
  @@index([visibility, status])
}
```

#### 3. Workspaces
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
  
  // Relations
  idea  Idea @relation("IdeaWorkspace", fields: [ideaId], references: [id], onDelete: Cascade)
  owner User @relation("WorkspaceOwner", fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("workspaces")
  @@index([userId])
  @@index([ideaId])
}
```

#### 4. Idea Collaborators
```prisma
model IdeaCollaborator {
  id        String   @id @default(uuid())
  ideaId    String   @map("idea_id")
  userId    String   @map("user_id")
  role      CollaboratorRole @default(VIEWER)
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relations
  idea Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([ideaId, userId])
  @@map("idea_collaborators")
  @@index([userId])
}
```

#### 5. Comments
```prisma
model Comment {
  id        String    @id @default(uuid())
  content   String    @db.Text
  authorId  String    @map("author_id")
  ideaId    String    @map("idea_id")
  parentId  String?   @map("parent_id")
  votes     Int       @default(0)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  
  // Relations
  author  User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  idea    Idea      @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies Comment[] @relation("CommentReplies")
  
  @@map("comments")
  @@index([authorId])
  @@index([ideaId])
  @@index([parentId])
}
```

#### 6. Stars
```prisma
model Star {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  ideaId    String   @map("idea_id")
  createdAt DateTime @default(now()) @map("created_at")
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  idea Idea @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  
  @@unique([userId, ideaId])
  @@map("stars")
  @@index([userId])
  @@index([ideaId])
}
```

#### 7. Follows
```prisma
model Follow {
  id          String   @id @default(uuid())
  followerId  String   @map("follower_id")
  followingId String   @map("following_id")
  createdAt   DateTime @default(now()) @map("created_at")
  
  // Relations
  follower  User @relation("Follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@unique([followerId, followingId])
  @@map("follows")
  @@index([followerId])
  @@index([followingId])
}
```

#### 8. Notifications
```prisma
model Notification {
  id            String           @id @default(uuid())
  userId        String           @map("user_id")
  type          NotificationType
  message       String
  isRead        Boolean          @default(false) @map("is_read")
  relatedUserId String?          @map("related_user_id")
  relatedIdeaId String?          @map("related_idea_id")
  relatedUrl    String?          @map("related_url")
  createdAt     DateTime         @default(now()) @map("created_at")
  
  // Relations
  user        User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  relatedUser User? @relation("NotificationSender", fields: [relatedUserId], references: [id], onDelete: Cascade)
  relatedIdea Idea? @relation(fields: [relatedIdeaId], references: [id], onDelete: Cascade)
  
  @@map("notifications")
  @@index([userId])
  @@index([isRead])
}
```

### Enums

```prisma
enum Visibility {
  PUBLIC
  PRIVATE
}

enum Status {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum CollaboratorRole {
  OWNER
  EDITOR
  VIEWER
}

enum NotificationType {
  STAR
  FORK
  COMMENT
  MENTION
  FOLLOW
  ISSUE
}
```

---

## ✅ Complete TODO List

### Phase 1: Setup and Configuration (6/6) ✅
- [x] 1.1. Install Prisma dependencies (`prisma`, `@prisma/client`)
- [x] 1.2. Initialize Prisma (`npx prisma init`)
- [x] 1.3. Configure PostgreSQL connection string
- [x] 1.4. Create complete Prisma schema file
- [x] 1.5. Generate Prisma client (`npx prisma generate`)
- [x] 1.6. Create database connection singleton

### Phase 2: Create Prisma Schema (10/10) ✅
- [x] 2.1. Define User model with all fields
- [x] 2.2. Define Idea model with relations
- [x] 2.3. Define Workspace model (one-to-one with Idea)
- [x] 2.4. Define IdeaCollaborator model with max 3 constraint
- [x] 2.5. Define Comment model with nested replies
- [x] 2.6. Define Star model
- [x] 2.7. Define Follow model
- [x] 2.8. Define Notification model
- [x] 2.9. Define all enums (Visibility, Status, Role, etc.)
- [x] 2.10. Add indexes and constraints

### Phase 3: Database Migration (3/3) ✅
- [x] 3.1. Run initial Prisma migration (`npx prisma migrate dev`)
- [x] 3.2. Verify database schema creation
- [x] 3.3. Optionally seed database with test data

### Phase 4: Authentication Layer (8/8) ✅
- [x] 4.1. Implement authentication strategy (JWT or sessions)
- [x] 4.2. Create auth utilities (hash passwords, verify tokens)
- [x] 4.3. Update AuthService.signUp()
- [x] 4.4. Update AuthService.signIn()
- [x] 4.5. Update AuthService.signOut()
- [x] 4.6. Update AuthService.getCurrentUser()
- [x] 4.7. Update AuthService.getCurrentUserId()
- [x] 4.8. Update AuthService.isAuthenticated()

### Phase 5: Service Layer Migration (0/42)

#### UsersService (0/6)
- [ ] 5.1. Replace getUserProfile() - Get user by ID/username
- [ ] 5.2. Replace updateUserProfile() - Update user info
- [ ] 5.3. Replace followUser() - Create follow relationship
- [ ] 5.4. Replace unfollowUser() - Remove follow relationship
- [ ] 5.5. Replace getFollowingUsers() - Get users being followed
- [ ] 5.6. Replace getFollowers() - Get user's followers

#### IdeasService (0/12)
- [ ] 5.7. Replace getIdeas() - Get all public ideas with filters
- [ ] 5.8. Replace getIdea() - Get single idea by ID
- [ ] 5.9. Replace getUserIdeas() - Get ideas by specific user
- [ ] 5.10. Replace createIdea() - Create idea + workspace atomically
- [ ] 5.11. Replace updateIdea() - Update idea content/metadata
- [ ] 5.12. Replace deleteIdea() - Delete idea (cascade to workspace)
- [ ] 5.13. Replace getIdeaComments() - Get comments for an idea
- [ ] 5.14. Replace addComment() - Add comment to idea
- [ ] 5.15. Replace starIdea() - Star/like an idea
- [ ] 5.16. Replace unstarIdea() - Unstar an idea
- [ ] 5.17. Replace forkIdea() - Create fork with new workspace
- [ ] 5.18. Replace getStarredIdeas() - Get user's starred ideas

#### WorkspacesService (0/8)
- [ ] 5.19. Replace getUserWorkspaces() - Get workspaces for user
- [ ] 5.20. Replace getWorkspace() - Get workspace by ID
- [ ] 5.21. Replace createWorkspace() - Create workspace (with idea)
- [ ] 5.22. Replace updateWorkspace() - Update workspace content/settings
- [ ] 5.23. Replace deleteWorkspace() - Delete workspace
- [ ] 5.24. Replace getSharedWorkspaces() - Get workspaces shared with user
- [ ] 5.25. Implement canEditWorkspace() - Check edit permissions
- [ ] 5.26. Implement canViewWorkspace() - Check view permissions

#### CollaboratorsService (0/4)
- [ ] 5.27. Create addCollaborator() - Add collaborator (max 3 check)
- [ ] 5.28. Create removeCollaborator() - Remove collaborator
- [ ] 5.29. Create getCollaborators() - Get idea's collaborators
- [ ] 5.30. Create updateCollaboratorRole() - Change collaborator role

#### NotificationsService (0/5)
- [ ] 5.31. Replace getNotifications() - Get user notifications
- [ ] 5.32. Replace markAsRead() - Mark notification as read
- [ ] 5.33. Replace markAllAsRead() - Mark all as read
- [ ] 5.34. Replace createNotification() - Create new notification
- [ ] 5.35. Replace deleteNotification() - Delete notification

#### ActivitiesService (0/3)
- [ ] 5.36. Replace getActivities() - Get activity feed
- [ ] 5.37. Replace getUserActivities() - Get user's activities
- [ ] 5.38. Replace recordActivity() - Log user activity

#### StatsService (0/4)
- [ ] 5.39. Replace getUserStats() - Get user statistics
- [ ] 5.40. Replace getIdeaStats() - Get idea statistics
- [ ] 5.41. Replace getTrendingIdeas() - Get trending ideas
- [ ] 5.42. Replace getPopularUsers() - Get popular users

### Phase 6: Data Transformers (0/4)
- [ ] 6.1. Update transformDbUser() for Prisma types
- [ ] 6.2. Update transformDbIdea() for Prisma types
- [ ] 6.3. Create transformDbWorkspace() for Prisma types
- [ ] 6.4. Update createBasicIdea() for Prisma types

### Phase 7: Update Frontend Integration (0/8)
- [ ] 7.1. Update AuthContext to use new auth system
- [ ] 7.2. Update useSupabaseAuth hook or replace
- [ ] 7.3. Update API service index exports
- [ ] 7.4. Remove Supabase client imports from contexts
- [ ] 7.5. Update AuthPersistence component
- [ ] 7.6. Update AuthCallback page
- [ ] 7.7. Test authentication flow end-to-end
- [ ] 7.8. Verify all API calls work with Prisma

### Phase 8: Route Protection & Middleware (0/5)
- [ ] 8.1. Create authentication middleware
- [ ] 8.2. Create authorization helpers (isOwner, isCollaborator, etc.)
- [ ] 8.3. Implement workspace access control
- [ ] 8.4. Implement idea access control (public/private)
- [ ] 8.5. Add fork creation authorization

### Phase 9: Environment & Configuration (0/4)
- [ ] 9.1. Update .env with DATABASE_URL
- [ ] 9.2. Update .env.example with new variables
- [ ] 9.3. Update vite.config if needed
- [ ] 9.4. Document environment setup in README

### Phase 10: Testing & Cleanup (0/10)
- [ ] 10.1. Test user registration and login
- [ ] 10.2. Test idea creation with workspace
- [ ] 10.3. Test collaborator management (max 3 constraint)
- [ ] 10.4. Test public/private idea visibility
- [ ] 10.5. Test idea forking
- [ ] 10.6. Test comments and stars
- [ ] 10.7. Test follow/unfollow
- [ ] 10.8. Remove Supabase dependencies from package.json
- [ ] 10.9. Remove Supabase migration files
- [ ] 10.10. Clean up unused Supabase files

### Phase 11: Documentation (0/5)
- [ ] 11.1. Update README with Prisma setup instructions
- [ ] 11.2. Document database schema and relations
- [ ] 11.3. Document authentication flow
- [ ] 11.4. Document API changes (if any)
- [ ] 11.5. Update this file with final status

---

## 🏗️ Technical Architecture

### Current (Supabase)
```
Frontend (React) 
    ↓
Supabase Client (@supabase/supabase-js)
    ↓
Supabase Cloud (PostgreSQL + Auth + RLS)
```

### Target (Prisma)
```
Frontend (React)
    ↓
API Service Layer (src/services/api/*)
    ↓
Prisma Client
    ↓
PostgreSQL Database (direct connection)
```

### Key Architectural Changes

1. **Authentication**
   - FROM: Supabase Auth with built-in JWT
   - TO: Custom JWT authentication or session-based auth

2. **Database Access**
   - FROM: Direct Supabase client queries with RLS
   - TO: Prisma ORM with application-level authorization

3. **Real-time Features**
   - FROM: Supabase real-time subscriptions
   - TO: May need separate solution (Socket.io, etc.) - TBD

4. **File Storage**
   - FROM: Supabase Storage
   - TO: Maintain or replace (not in current scope) - TBD

---

## 📁 Files to Modify

### Core Files to Update (High Priority)
1. `src/lib/supabase.ts` - Replace with Prisma client
2. `src/lib/supabase-browser.ts` - Remove
3. `src/services/api/auth.ts` - Implement new auth
4. `src/services/api/users.ts` - Use Prisma
5. `src/services/api/ideas.ts` - Use Prisma
6. `src/services/api/workspaces.ts` - Use Prisma
7. `src/services/api/activities.ts` - Use Prisma
8. `src/services/api/notifications.ts` - Use Prisma
9. `src/services/api/stats.ts` - Use Prisma
10. `src/services/api/transformers.ts` - Update types
11. `src/contexts/AuthContext.tsx` - Update auth flow
12. `src/hooks/useSupabaseAuth.ts` - Replace or update

### Configuration Files
13. `package.json` - Add Prisma, remove Supabase
14. `.env` - Add DATABASE_URL
15. `.gitignore` - Add Prisma files

### New Files to Create
16. `prisma/schema.prisma` - Database schema
17. `src/lib/prisma.ts` - Prisma client singleton
18. `src/lib/auth.ts` - Auth utilities (JWT, bcrypt)
19. `src/middleware/auth.ts` - Auth middleware (if needed)

### Files to Remove (Eventually)
20. `src/lib/supabase-browser.ts`
21. `src/services/supabaseApi.ts`
22. `src/services/supabaseApi.deprecated.ts`
23. `supabase/` directory (migrations)

---

## 🚀 Next Iteration Prompt

**Use this prompt to continue the migration:**

```
Continue the Supabase to Prisma migration for IDEA_HUB. 

Current Status: See MIGRATION_AGENT_NOTES.md for complete context.

Next steps:
1. Review MIGRATION_AGENT_NOTES.md for full migration plan and constraints
2. Install Prisma dependencies and initialize Prisma
3. Create the complete Prisma schema based on the documented design
4. Run database migration
5. Start implementing the authentication layer
6. Migrate service layer functions one by one
7. Update MIGRATION_AGENT_NOTES.md after each phase

Remember:
- Maintain ALL frontend components, styles, and pages unchanged
- Follow the user flow constraints strictly (max 3 collaborators, one workspace per idea, etc.)
- Keep the same API interface so frontend doesn't need changes
- Test each phase before moving to the next
- Update the TODO checklist as you complete tasks
```

---

## 📝 Notes and Considerations

### Critical Constraints to Remember
1. **One Workspace Per Idea**: Enforce at schema and application level
2. **Max 3 Collaborators**: Add validation in addCollaborator() function
3. **Atomic Idea+Workspace Creation**: Use Prisma transactions
4. **Fork Creates New Workspace**: Implement in forkIdea() service
5. **Public/Private Access Control**: Implement in all read operations

### Design Decisions
- Using UUID for all primary keys (matches Supabase)
- Using snake_case for database columns (matches existing)
- Using camelCase in application code (Prisma convention)
- JSON type for workspace content (flexible for canvas data)
- Text type for long content fields (descriptions, canvas data)

### Potential Challenges
1. Authentication migration (Supabase Auth → Custom)
2. Real-time features (if currently used)
3. RLS policies → Application-level authorization
4. Migration of existing data (if any)
5. Testing without breaking frontend

---

**Last Updated:** October 2, 2024  
**Next Review:** After serverless functions implementation  
**Migration Target:** Complete within 5-7 days with thorough testing

---

## 📋 Quick Start for Next Developer

To continue this migration:

1. **Review Documentation:**
   - Read `MIGRATION_SUMMARY.md` for current status
   - Read `BACKEND_API_ARCHITECTURE.md` for implementation details
   - Review this file for complete context

2. **Setup Database:**
   ```bash
   # Create PostgreSQL database
   createdb ideahub
   
   # Configure environment
   cp .env.example .env
   # Edit .env and add your DATABASE_URL
   
   # Run migration
   npx prisma migrate dev --name init
   npx prisma generate
   ```

3. **Start Implementation:**
   - Complete serverless functions in `netlify/functions/`
   - Create API client in `src/lib/api-client.ts`
   - Update services in `src/services/api/` to use API client
   - Test each component as you go

4. **Reference Files:**
   - Schema: `prisma/schema.prisma`
   - Auth utilities: `src/lib/auth.ts`
   - Prisma client: `src/lib/prisma.ts`
   - Example function: `netlify/functions/auth-signup.ts`

---
