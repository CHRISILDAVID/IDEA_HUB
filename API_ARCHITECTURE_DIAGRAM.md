# IdeaHub API Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Auth UI    │  │   Ideas UI   │  │ Workspace UI │  │  Users UI   │ │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├─────────────┤ │
│  │ LoginForm    │  │ IdeaList     │  │WorkspaceCanvas│ │ ProfilePage │ │
│  │ RegisterForm │  │ IdeaCard     │  │EraserWorkspace│ │ SettingsPage│ │
│  │ AuthContext  │  │ StarButton   │  │               │ │ FollowButton│ │
│  │              │  │ ForkButton   │  │               │ │             │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬────────┘  └──────┬──────┘ │
│         │                 │                  │                  │        │
│         └─────────────────┴──────────────────┴──────────────────┘        │
│                                      │                                    │
│                         ┌────────────▼───────────────┐                   │
│                         │   API CLIENT LAYER         │                   │
│                         ├────────────────────────────┤                   │
│                         │ src/lib/api-client.ts      │                   │
│                         │ - JWT Token Management     │                   │
│                         │ - HTTP Methods (GET/POST)  │                   │
│                         │ - Error Handling           │                   │
│                         │ - Base URL: /.netlify/     │                   │
│                         └────────────┬───────────────┘                   │
│                                      │                                    │
│                         ┌────────────▼───────────────┐                   │
│                         │   SERVICE LAYER            │                   │
│                         ├────────────────────────────┤                   │
│                         │ AuthService                │                   │
│                         │ IdeasService               │                   │
│                         │ WorkspacesService          │                   │
│                         │ UsersService               │                   │
│                         │ CollaboratorsService       │                   │
│                         └────────────────────────────┘                   │
│                                                                           │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
                                    │ HTTPS Requests
                                    │ Authorization: Bearer <JWT>
                                    │
┌───────────────────────────────────▼───────────────────────────────────────┐
│                     BACKEND (Netlify Serverless Functions)                │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│  │  AUTHENTICATION (4)  │  │      IDEAS (7)       │  │   WORKSPACES (3) │ │
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────┤ │
│  │ POST /auth-signup    │  │ POST /ideas-create   │  │ GET /workspaces  │ │
│  │ POST /auth-signin    │  │ GET  /ideas-list     │  │     -list        │ │
│  │ GET  /auth-user      │  │ GET  /ideas-get      │  │ GET /workspaces  │ │
│  │ POST /auth-signout   │  │ PUT  /ideas-update   │  │     -get         │ │
│  │                      │  │ DEL  /ideas-delete   │  │ PUT /workspaces  │ │
│  │ Features:            │  │ POST /ideas-star     │  │     -update      │ │
│  │ • JWT Generation     │  │ POST /ideas-fork     │  │                  │ │
│  │ • Password Hashing   │  │                      │  │ Features:        │ │
│  │ • Token Validation   │  │ Features:            │  │ • Canvas Data    │ │
│  │                      │  │ • 1:1 Workspace      │  │ • Access Control │ │
│  │                      │  │ • Star/Unstar        │  │ • Public/Private │ │
│  │                      │  │ • Fork with Workspace│  │                  │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────┘ │
│                                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐   │
│  │      USERS (3)       │  │      COLLABORATORS (1)                   │   │
│  ├──────────────────────┤  ├──────────────────────────────────────────┤   │
│  │ GET /users-profile   │  │ POST /collaborators-add                  │   │
│  │ PUT /users-update    │  │                                          │   │
│  │ POST /users-follow   │  │ Features:                                │   │
│  │                      │  │ • Max 3 Collaborators                    │   │
│  │ Features:            │  │ • Role-based Access (EDITOR)             │   │
│  │ • Profile + Stats    │  │ • Owner-only Permission                  │   │
│  │ • Follow System      │  │                                          │   │
│  │                      │  │                                          │   │
│  └──────────────────────┘  └──────────────────────────────────────────┘   │
│                                                                             │
│                         ┌────────────────────────┐                         │
│                         │   MIDDLEWARE LAYER     │                         │
│                         ├────────────────────────┤                         │
│                         │ src/lib/auth.ts        │                         │
│                         │ • verifyToken()        │                         │
│                         │ • generateToken()      │                         │
│                         │ • hashPassword()       │                         │
│                         │ • comparePassword()    │                         │
│                         └───────────┬────────────┘                         │
│                                     │                                       │
└─────────────────────────────────────┼───────────────────────────────────────┘
                                      │
                                      │ Prisma ORM
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│                          DATABASE (PostgreSQL)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────┐  ┌──────────────┐   │
│  │  User    │  │   Idea   │  │  Workspace │  │ Star │  │ Collaborator │   │
│  ├──────────┤  ├──────────┤  ├────────────┤  ├──────┤  ├──────────────┤   │
│  │ id       │──┤ authorId │  │ id         │  │ id   │  │ id           │   │
│  │ email    │  │ title    │──┤ ideaId     │  │ user │──┤ ideaId       │   │
│  │ username │  │ content  │  │ content    │  │ idea │  │ userId       │   │
│  │ password │  │ category │  │ userId     │  └──────┘  │ role         │   │
│  │ ...      │  │ tags     │  │ isPublic   │            └──────────────┘   │
│  └──────────┘  │ ...      │  │ ...        │                                │
│                └──────────┘  └────────────┘                                │
│                                                                               │
│  ┌──────────┐  ┌────────────┐  ┌──────────────┐                            │
│  │  Follow  │  │  Comment   │  │ Notification │                            │
│  ├──────────┤  ├────────────┤  ├──────────────┤                            │
│  │ follower │  │ ideaId     │  │ userId       │                            │
│  │ following│  │ userId     │  │ type         │                            │
│  └──────────┘  │ content    │  │ read         │                            │
│                └────────────┘  └──────────────┘                            │
│                                                                               │
│  Constraints:                                                                │
│  • One Workspace per Idea (1:1 relationship)                                │
│  • Max 3 Collaborators per Idea                                             │
│  • Unique email, username                                                   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                              DATA FLOW EXAMPLE
═══════════════════════════════════════════════════════════════════════════════

EXAMPLE 1: User Creates an Idea
────────────────────────────────

1. User fills form in UI
   ↓
2. Component: DashboardPage → onClick(createIdea)
   ↓
3. Service: IdeasService.createIdea(data)
   ↓
4. API Client: POST /.netlify/functions/ideas-create
   Headers: { Authorization: Bearer <JWT> }
   Body: { title, description, content, category, ... }
   ↓
5. Backend: ideas-create.ts
   • Verify JWT token
   • Validate input
   • Start Prisma transaction:
     → Create Idea record
     → Create Workspace record (same name)
   • Commit transaction
   ↓
6. Database: Insert into Idea + Workspace tables
   ↓
7. Response: { idea: {...}, workspace: {...} }
   ↓
8. Frontend: Update UI, navigate to workspace


EXAMPLE 2: User Stars an Idea
──────────────────────────────

1. User clicks Star button
   ↓
2. Component: StarButton → onClick(handleStar)
   ↓
3. Service: IdeasService.starIdea(ideaId)
   ↓
4. API Client: POST /.netlify/functions/ideas-star
   Headers: { Authorization: Bearer <JWT> }
   Body: { ideaId: "uuid" }
   ↓
5. Backend: ideas-star.ts
   • Verify JWT token
   • Check if already starred:
     → If starred: Delete Star record (unstar)
     → If not: Create Star record (star)
   • Update idea stars count
   • Create notification for idea author
   ↓
6. Database: Insert/Delete in Star table
   ↓
7. Response: { isStarred: true, stars: 42 }
   ↓
8. Frontend: Update button UI, update star count


EXAMPLE 3: User Opens Workspace
────────────────────────────────

1. User clicks on workspace
   ↓
2. Component: WorkspaceCard → onClick(navigate)
   ↓
3. Service: WorkspacesService.getWorkspace(id)
   ↓
4. API Client: GET /.netlify/functions/workspaces-get?id=<uuid>
   Headers: { Authorization: Bearer <JWT> }
   ↓
5. Backend: workspaces-get.ts
   • Verify JWT token (if private workspace)
   • Fetch workspace with idea + collaborators
   • Check permissions:
     → Public: Allow everyone
     → Private: Check if owner or collaborator
   ↓
6. Database: Query Workspace + Idea + Collaborators
   ↓
7. Response: { workspace: { content, idea: {...} } }
   ↓
8. Frontend: Load Excalidraw canvas with content


═══════════════════════════════════════════════════════════════════════════════
                           AUTHENTICATION FLOW
═══════════════════════════════════════════════════════════════════════════════

Login Flow:
───────────
User → LoginForm → AuthService.login(email, password)
                ↓
          POST /auth-signin
                ↓
          Backend validates credentials
                ↓
          Generate JWT token
                ↓
          Return { user, token }
                ↓
          Store token in localStorage
                ↓
          Set AuthContext.user
                ↓
          Redirect to dashboard


Token Validation:
─────────────────
Page Load → AuthContext.useEffect()
                ↓
          Check localStorage for token
                ↓
          GET /auth-user (with token)
                ↓
          Backend: verifyToken(token)
                ↓
          If valid: Return user
          If invalid: Return 401
                ↓
          Update AuthContext
                ↓
          Render protected content OR redirect to login


Protected API Call:
───────────────────
Component → Service Method
                ↓
          API Client adds header:
          Authorization: Bearer <token>
                ↓
          Backend: extractTokenFromHeader()
                ↓
          Backend: verifyToken(token)
                ↓
          If valid: Process request
          If invalid: Return 401 Unauthorized
                ↓
          Frontend: Handle 401 → Logout + redirect


═══════════════════════════════════════════════════════════════════════════════
                         CRITICAL CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════════

1. ONE WORKSPACE PER IDEA
   • Enforced in: ideas-create.ts, ideas-fork.ts
   • Implementation: Atomic transaction
   • Effect: When idea created → workspace created
            When idea forked → new workspace created
            When idea deleted → workspace deleted (cascade)

2. MAX 3 COLLABORATORS
   • Enforced in: collaborators-add.ts
   • Implementation: Count check before insert
   • Effect: 4th collaborator add → 400 Bad Request

3. ACCESS CONTROL
   • Public ideas/workspaces → Anyone can view
   • Private ideas/workspaces → Owner + collaborators only
   • Enforced in: ideas-get.ts, workspaces-get.ts
   • Effect: Unauthorized access → 403 Forbidden


═══════════════════════════════════════════════════════════════════════════════
```

**Created:** October 3, 2025  
**Version:** 1.0  
**Purpose:** Visual reference for API architecture and data flow
