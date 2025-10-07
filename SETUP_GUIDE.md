# 🚀 IDEA_HUB Setup Guide - Database & Environment Configuration

**Last Updated:** December 2024  
**For:** Post-Integration Testing and Development

---

## 📋 Overview

This guide will help you set up the IDEA_HUB project for development and testing after the workspace integration. The project consists of two applications:

1. **IDEA_HUB** (React SPA) - Main application (Port 3000)
2. **idea_workspace** (Next.js) - Workspace editor (Port 3001)

Both applications share the same PostgreSQL database.

---

## 🔧 Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **PostgreSQL** v14 or higher
- **Git** for version control

---

## 📦 Step 1: Clone and Install Dependencies

### 1.1 Clone the Repository

```bash
git clone https://github.com/CHRISILDAVID/IDEA_HUB.git
cd IDEA_HUB
```

### 1.2 Install Main App Dependencies

```bash
npm install
```

### 1.3 Install Workspace App Dependencies

```bash
cd idea_workspace/ideahubORM
npm install
cd ../..
```

---

## 🗄️ Step 2: Database Setup

### 2.1 Create PostgreSQL Database

```bash
# Log into PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ideahub;

# Exit psql
\q
```

### 2.2 Configure Database Connection

Create a `.env` file in the **root directory** of IDEA_HUB:

```bash
cp .env.example .env
```

Edit `.env` and update the `DATABASE_URL`:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ideahub?schema=public"

# Replace:
# - username: your PostgreSQL username (default: postgres)
# - password: your PostgreSQL password
# - localhost: your database host (use localhost for local dev)
# - 5432: PostgreSQL port (default: 5432)
# - ideahub: database name
```

### 2.3 Run Database Migrations

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create all tables
npx prisma migrate dev --name initial_setup

# (Optional) Seed database with sample data
npx prisma db seed
```

**Expected Output:**
```
✅ Migration applied successfully
✅ Prisma Client generated
```

### 2.4 Verify Database Setup

```bash
# Open Prisma Studio to view database
npx prisma studio
```

This will open Prisma Studio at `http://localhost:5555` where you can verify that all tables are created.

---

## 🔐 Step 3: Authentication Setup

### 3.1 Configure JWT Secret

In your `.env` file, update the JWT secret:

```env
# JWT Authentication
JWT_SECRET="your-secure-random-secret-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
```

**⚠️ Important:** Use a strong, random secret in production. You can generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🌐 Step 4: Workspace Integration Setup

### 4.1 Configure Workspace URL

In your `.env` file, set the workspace app URL:

```env
# Workspace Integration (Next.js iframe)
VITE_WORKSPACE_APP_URL="http://localhost:3001"
```

**Note:** In production, this should be the actual deployed URL of your workspace app.

### 4.2 Setup Workspace App Environment

Create a `.env` file in `idea_workspace/ideahubORM/`:

```bash
cd idea_workspace/ideahubORM
cp .env.example .env
```

Edit `idea_workspace/ideahubORM/.env`:

```env
# Use the SAME database URL as main app
DATABASE_URL="postgresql://username:password@localhost:5432/ideahub?schema=public"

# Next.js Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### 4.3 Generate Workspace Prisma Client

```bash
cd idea_workspace/ideahubORM
npx prisma generate
cd ../..
```

---

## ▶️ Step 5: Start Development Servers

You need to run **both** applications simultaneously.

### Option A: Two Terminal Windows

**Terminal 1 - Main App:**
```bash
npm run dev
```

**Terminal 2 - Workspace App:**
```bash
cd idea_workspace/ideahubORM
npm run dev
```

### Option B: Using npm-run-all (Recommended)

Install npm-run-all in the root directory:

```bash
npm install --save-dev npm-run-all
```

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:workspace": "cd idea_workspace/ideahubORM && npm run dev",
    "dev:all": "npm-run-all --parallel dev dev:workspace"
  }
}
```

Then run:

```bash
npm run dev:all
```

---

## 🌍 Step 6: Access the Applications

After starting both servers:

- **Main App (IDEA_HUB):** http://localhost:3000
- **Workspace App:** http://localhost:3001
- **Prisma Studio:** http://localhost:5555 (if running)

---

## 🧪 Step 7: Testing the Integration

### 7.1 Create a Test User

1. Navigate to http://localhost:3000
2. Click "Register" and create an account
3. Verify you're redirected to the dashboard

### 7.2 Create a Test Idea with Workspace

1. Click "Create Idea" or navigate to `/create`
2. Fill in:
   - **Title:** "Test Workspace Integration"
   - **Description:** "Testing the iframe workspace"
   - **Category:** Select any category
   - **Visibility:** Public
3. Click "Create"
4. You should be redirected to the workspace view in an iframe

### 7.3 Verify Workspace Features

**Test the following:**

- [ ] Workspace loads inside iframe
- [ ] Can switch between Document and Canvas views
- [ ] Can edit content (if you're the owner)
- [ ] Changes save successfully
- [ ] Can view workspace in read-only mode (create another user)
- [ ] Fork functionality works for public ideas

### 7.4 Test Permissions

**As Owner:**
- [ ] Can edit workspace
- [ ] Can change visibility
- [ ] Can add collaborators

**As Non-Owner (Public Idea):**
- [ ] Can view in read-only mode
- [ ] See "Fork to Edit" button
- [ ] Forking creates a copy under your account

**As Collaborator:**
- [ ] Can edit workspace (if role is EDITOR)
- [ ] Cannot change visibility

---

## 🔍 Step 8: Verify Database Data

### 8.1 Check Tables Were Created

```bash
npx prisma studio
```

Verify these tables exist:
- `users`
- `ideas`
- `workspaces` (should have `document` and `whiteboard` columns)
- `idea_collaborators`
- `comments`
- `stars`
- `follows`
- `notifications`

### 8.2 Check Workspace Data

After creating an idea:

1. Open Prisma Studio
2. Go to `ideas` table - find your idea
3. Go to `workspaces` table - verify workspace exists with matching `ideaId`
4. Verify `document` and `whiteboard` fields contain JSON data

---

## 🐛 Troubleshooting

### Issue: "Database connection error"

**Solution:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check database exists: `psql -U postgres -l | grep ideahub`
3. Verify DATABASE_URL in `.env` is correct
4. Try: `npx prisma db push` to force schema sync

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
cd idea_workspace/ideahubORM && npx prisma generate
```

### Issue: "Workspace iframe doesn't load"

**Solution:**
1. Verify workspace app is running on port 3001
2. Check browser console for CORS errors
3. Verify `VITE_WORKSPACE_APP_URL` in `.env`
4. Check iframe sandbox attributes

### Issue: "JWT token errors"

**Solution:**
1. Clear localStorage in browser DevTools
2. Log out and log back in
3. Verify `JWT_SECRET` is set in `.env`
4. Check token is being sent in API requests (Network tab)

### Issue: "postMessage not working"

**Solution:**
1. Check browser console for origin errors
2. Verify workspace app is on http://localhost:3001
3. Check `WorkspaceIframe.tsx` origin validation
4. Open DevTools in iframe (right-click iframe → "Inspect")

---

## 📊 Database Schema Summary

### Key Tables and Relationships

**users** ↔ **ideas** (one-to-many)
- User can create multiple ideas

**ideas** ↔ **workspaces** (one-to-one)
- Each idea has exactly ONE workspace
- Workspace contains `document` and `whiteboard` fields

**ideas** ↔ **idea_collaborators** (one-to-many)
- Max 3 collaborators per idea
- Roles: OWNER, EDITOR, VIEWER

**ideas** ↔ **ideas** (self-referencing for forks)
- Track which ideas are forked from others

---

## 🔐 Security Notes

### Development vs Production

**Development (.env):**
```env
NODE_ENV="development"
VITE_WORKSPACE_APP_URL="http://localhost:3001"
JWT_SECRET="dev-secret-change-in-production"
```

**Production (.env.production):**
```env
NODE_ENV="production"
VITE_WORKSPACE_APP_URL="https://workspace.yourdomain.com"
JWT_SECRET="<strong-random-secret-from-crypto>"
DATABASE_URL="postgresql://user:pass@production-host:5432/ideahub?sslmode=require"
```

### Important Security Considerations

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT secrets in production**
3. **Enable SSL for database connections in production** (add `?sslmode=require`)
4. **Verify postMessage origins** - Update `WorkspaceIframe.tsx` for production domains
5. **Use HTTPS in production** for both apps

---

## 📚 Next Steps

After successful setup:

1. **Explore the API**: Check `netlify/functions/` for available endpoints
2. **Review the schema**: Open `prisma/schema.prisma` to understand data models
3. **Test edge cases**: Try forking, collaborating, and permissions
4. **Check documentation**: See `MIGRATION_AGENT_NOTES.md` for architecture details
5. **Report issues**: If you encounter problems, check the troubleshooting section

---

## 🎯 Quick Reference

### Common Commands

```bash
# Database
npx prisma generate              # Generate Prisma client
npx prisma migrate dev           # Run migrations
npx prisma studio                # Open database viewer
npx prisma db push               # Force sync schema

# Development
npm run dev                      # Start main app
npm run build                    # Build main app
npm run dev:all                  # Start both apps (if configured)

# Workspace App
cd idea_workspace/ideahubORM
npm run dev                      # Start workspace app
npm run build                    # Build workspace app
```

### Environment Files

- **Root `.env`** - Main app + database config
- **`idea_workspace/ideahubORM/.env`** - Workspace app config

### Key URLs

- Main App: http://localhost:3000
- Workspace: http://localhost:3001
- Database: http://localhost:5555 (Prisma Studio)

---

**Happy Coding! 🚀**

For more details, see:
- `MIGRATION_AGENT_NOTES.md` - Technical architecture
- `WORKSPACE_INTEGRATION_PLAN.md` - Integration details
- `PHASE_8_COMPLETION_SUMMARY.md` - Latest changes
