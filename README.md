# IdeaHub v4 - Collaborative Idea Sharing Platform

A modern web application for creating, sharing, and collaborating on ideas with an integrated canvas workspace.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **PostgreSQL** database
- **Git** for version control

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/CHRISILDAVID/IDEA_HUB.git
cd IDEA_HUB
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and update these values:
# - DATABASE_URL: Your PostgreSQL connection string
# - JWT_SECRET: A secure random string for JWT signing
# - NODE_ENV: "development" or "production"
```

**Required Environment Variables:**
```env
# Database (PostgreSQL)
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"

# JWT Authentication
JWT_SECRET="your-secure-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT="3000"
```

4. **Setup the database**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database with sample data
npx prisma db seed
```

5. **Start the development server**
```bash
# Using Netlify CLI (recommended)
netlify dev

# Or using Vite directly (frontend only)
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:8888](http://localhost:8888) (Netlify) or [http://localhost:5173](http://localhost:5173) (Vite only)

---

## 📚 Documentation

### API Testing
Complete documentation for testing all backend APIs:
- **[API Testing README](API_TESTING_README.md)** - Start here for API testing
- **[How to Test APIs](HOW_TO_TEST_APIS.md)** - Step-by-step testing guide
- **[API Testing Report](API_TESTING_REPORT.md)** - Complete API reference
- **[API Architecture](API_ARCHITECTURE_DIAGRAM.md)** - System architecture diagrams
- **[Manual Testing Guide](MANUAL_API_TESTING_GUIDE.md)** - Detailed testing procedures

### Project Status
- **[Migration Progress Report](MIGRATION_PROGRESS_REPORT.md)** - Current project status
- **[Phase 8 Completion](PHASE_8_COMPLETION_SUMMARY.md)** - Route Protection & Middleware ✅ **NEW!**
- **[Phase 6-7 Completion](PHASE_6_7_COMPLETION_SUMMARY.md)** - Data Transformers & Frontend Integration
- **[Changelog](CHANGELOG.md)** - Version history

### Architecture
- **[Backend API Architecture](BACKEND_API_ARCHITECTURE.md)** - API design
- **[Canvas Features](CANVAS_EDITOR_FEATURES.md)** - Canvas implementation
- **[Create & Edit Features](CREATE_AND_EDIT_FEATURES.md)** - Feature documentation

---

## ✨ Features

### Core Features
- 🔐 **Authentication** - JWT-based user authentication
- 💡 **Ideas** - Create, edit, share ideas
- 🎨 **Canvas Workspace** - Integrated Excalidraw canvas (1:1 with ideas)
- ⭐ **Stars & Forks** - GitHub-like social features
- 👥 **Collaboration** - Add up to 3 collaborators per idea
- 🔍 **Search & Filter** - Browse ideas by category, tags
- 👤 **User Profiles** - Follow users, view stats

### Technical Features
- **One Workspace Per Idea** - Automatic workspace creation
- **Access Control** - Public/private visibility
- **Real-time Updates** - Canvas auto-save
- **Responsive UI** - Mobile-friendly design

---

## 🏗️ Technology Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Excalidraw** - Canvas editor
- **React Router** - Navigation
- **Vite** - Build tool

### Backend
- **Netlify Functions** - Serverless APIs
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

---

## 📁 Project Structure

```
IDEA_HUB/
├── netlify/functions/      # 18 serverless API endpoints
│   ├── auth-*.ts          # Authentication APIs (4)
│   ├── ideas-*.ts         # Ideas APIs (7)
│   ├── workspaces-*.ts    # Workspaces APIs (3)
│   ├── users-*.ts         # Users APIs (3)
│   └── collaborators-*.ts # Collaborators API (1)
├── src/
│   ├── components/        # React components
│   ├── services/api/      # Frontend API services
│   ├── lib/               # Utilities & helpers
│   │   ├── api-client.ts     # HTTP client for API calls
│   │   ├── auth.ts           # JWT & password utilities
│   │   ├── auth-client.ts    # Browser-safe auth utilities
│   │   ├── middleware.ts     # 🆕 Request middleware utilities
│   │   ├── authorization.ts  # 🆕 Permission checking helpers
│   │   └── prisma.ts         # Prisma client singleton
│   ├── pages/            # Page components
│   └── contexts/         # React contexts
├── prisma/
│   └── schema.prisma     # Database schema
└── [Documentation files]
```

### Key Backend Utilities (New in Phase 8)

**`src/lib/middleware.ts`** - Request handling utilities:
- `requireAuth()` - Enforce authentication
- `optionalAuth()` - Support optional auth
- `checkMethod()` - Validate HTTP methods
- `validateQueryParams()` / `validateBodyFields()` - Input validation
- `ErrorResponses.*` - Standard error responses
- `successResponse()` / `createdResponse()` - Standard success responses

**`src/lib/authorization.ts`** - Permission checking:
- `canViewIdea()` / `canEditIdea()` / `canDeleteIdea()` - Idea permissions
- `canViewWorkspace()` / `canEditWorkspace()` - Workspace permissions
- `canAddCollaborators()` / `canAddMoreCollaborators()` - Collaborator permissions
- `canForkIdea()` - Fork permissions
- `sanitizeUser()` - Remove sensitive data from user objects

---

## 🧪 Testing

### Automated Testing
```bash
# Make sure server is running
netlify dev

# Run API tests (in another terminal)
./test-apis.sh
```

### Manual Testing
1. Start server: `netlify dev`
2. Open browser: `http://localhost:8888`
3. Follow guide: [HOW_TO_TEST_APIS.md](HOW_TO_TEST_APIS.md)

---

## 🔑 Environment Variables

Create a `.env` file:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-secret-key"
```

---

## 📊 API Endpoints (18 Total)

### Authentication (4)
- `POST /auth-signup` - Register
- `POST /auth-signin` - Login
- `GET /auth-user` - Get current user
- `POST /auth-signout` - Logout

### Ideas (7)
- `POST /ideas-create` - Create idea + workspace
- `GET /ideas-list` - List ideas
- `GET /ideas-get` - Get idea
- `PUT /ideas-update` - Update idea
- `DELETE /ideas-delete` - Delete idea
- `POST /ideas-star` - Star/unstar
- `POST /ideas-fork` - Fork idea

### Workspaces (3)
- `GET /workspaces-list` - List workspaces
- `GET /workspaces-get` - Get workspace
- `PUT /workspaces-update` - Update canvas

### Users (3)
- `GET /users-profile` - Get profile
- `PUT /users-update` - Update profile
- `POST /users-follow` - Follow/unfollow

### Collaborators (1)
- `POST /collaborators-add` - Add collaborator

**See [API_TESTING_REPORT.md](API_TESTING_REPORT.md) for complete documentation.**

---

## 🎯 Critical Constraints

1. **One Workspace Per Idea** - Enforced via atomic transaction
2. **Max 3 Collaborators** - Enforced at API level
3. **Access Control** - Public/private with owner + collaborator permissions

---

## 🚧 Current Status

**Phase 7 Complete (70% Overall)**
- ✅ All 18 backend APIs implemented
- ✅ Frontend services migrated
- ✅ Authentication flow working
- ✅ App functional without Supabase
- ✅ Comprehensive API documentation

**Next Steps:**
- Implement stubbed services (notifications, activities, stats)
- Performance optimization
- Additional features

See [MIGRATION_PROGRESS_REPORT.md](MIGRATION_PROGRESS_REPORT.md) for details.

---

## 📝 License

MIT

---

## 🤝 Contributing

1. Test the APIs using the provided guides
2. Report issues with detailed steps to reproduce
3. Follow the architecture patterns established in the codebase

---

**For detailed API testing, start with [API_TESTING_README.md](API_TESTING_README.md)**
