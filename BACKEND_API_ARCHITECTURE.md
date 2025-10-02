# Backend API Architecture for Prisma Migration

## Overview
This document outlines the backend API structure needed to complete the Prisma migration. Since Prisma Client and JWT libraries are server-side only, we need a backend API layer.

## Architecture Options

### Option 1: Express/Fastify Backend (Recommended)
Create a separate Node.js backend API server.

**Pros:**
- Full control over API
- Better performance
- Easy to test and debug
- Can use WebSockets for real-time features

**Cons:**
- Requires separate deployment
- More infrastructure to manage

**Structure:**
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── ideas.ts
│   │   ├── workspaces.ts
│   │   ├── comments.ts
│   │   └── notifications.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── ideaService.ts
│   │   └── workspaceService.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── auth.ts
│   └── server.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

### Option 2: Serverless Functions (Netlify/Vercel)
Use serverless functions for each API endpoint.

**Pros:**
- Easy to deploy alongside frontend
- Auto-scaling
- No server management

**Cons:**
- Cold start times
- Stateless (session management harder)
- May need API Gateway for rate limiting

**Structure:**
```
netlify/functions/
├── auth-signup.ts
├── auth-signin.ts
├── auth-user.ts
├── ideas-list.ts
├── ideas-get.ts
├── ideas-create.ts
├── ideas-update.ts
├── ideas-delete.ts
├── workspaces-list.ts
├── workspaces-get.ts
├── workspaces-create.ts
└── workspaces-update.ts
```

### Option 3: Hybrid Approach
Use Prisma for data, but keep Supabase Auth.

**Pros:**
- Minimal authentication changes
- Leverage Supabase's security features
- Easier migration path

**Cons:**
- Still dependent on Supabase for auth
- Mixed architecture

## Recommended: Express Backend API

### Implementation Steps

1. **Create Backend Directory Structure**
```bash
mkdir -p backend/src/{routes,middleware,services,lib}
cd backend
npm init -y
npm install express cors dotenv @prisma/client bcryptjs jsonwebtoken
npm install -D typescript @types/node @types/express @types/bcryptjs @types/jsonwebtoken ts-node nodemon
```

2. **Move Prisma to Backend**
- Move `prisma/` directory to `backend/`
- Move `src/lib/prisma.ts` to `backend/src/lib/`
- Move `src/lib/auth.ts` to `backend/src/lib/`

3. **Create Express Server**

```typescript
// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import ideaRoutes from './routes/ideas';
import workspaceRoutes from './routes/workspaces';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/workspaces', workspaceRoutes);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend API server running on port ${PORT}`);
});
```

4. **Create Auth Middleware**

```typescript
// backend/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    username: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
```

5. **Create Auth Routes**

```typescript
// backend/src/routes/auth.ts
import { Router } from 'express';
import { AuthService } from '../services/authService';

const router = Router();

router.post('/signup', async (req, res, next) => {
  try {
    const { email, password, username, fullName } = req.body;
    const result = await AuthService.signUp(email, password, { username, fullName });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.signIn(email, password);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/user', authenticate, async (req, res, next) => {
  try {
    const result = await AuthService.getCurrentUser(req.user!.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/signout', (req, res) => {
  res.json({ success: true });
});

export default router;
```

6. **Update Frontend API Client**

Create a new API client that makes HTTP requests to the backend:

```typescript
// src/lib/api-client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}
```

7. **Update AuthService in Frontend**

```typescript
// src/services/api/auth.ts
import { apiRequest } from '../../lib/api-client';
import { storeToken, removeStoredToken, getStoredToken } from '../../lib/auth';

export class AuthService {
  static async signUp(email: string, password: string, userData: any) {
    const result = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData }),
    });
    
    storeToken(result.token);
    return result;
  }

  static async signIn(email: string, password: string) {
    const result = await apiRequest('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    storeToken(result.token);
    return result;
  }

  static async getCurrentUser() {
    if (!getStoredToken()) return null;
    
    try {
      return await apiRequest('/auth/user');
    } catch {
      removeStoredToken();
      return null;
    }
  }

  static async signOut() {
    await apiRequest('/auth/signout', { method: 'POST' });
    removeStoredToken();
  }
}
```

## Frontend Changes Required

1. **Create API Client** (`src/lib/api-client.ts`)
2. **Update All Service Files** to use `apiRequest` instead of Prisma/Supabase
3. **Update Environment Variables** to include `VITE_API_URL`
4. **Remove Server-Side Libraries** from frontend build

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:pass@localhost:5432/ideahub"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=3001
FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
```

### Frontend (.env)
```
VITE_API_URL="http://localhost:3001/api"
```

## Deployment Considerations

### Development
- Run backend: `cd backend && npm run dev`
- Run frontend: `npm run dev`

### Production
- Backend: Deploy to Heroku, Railway, Render, or DigitalOcean
- Frontend: Deploy to Netlify, Vercel, or Cloudflare Pages
- Ensure CORS is properly configured
- Use environment variables for API URL

## Next Steps

1. **Decision Required:** Choose backend architecture (Express vs Serverless vs Hybrid)
2. **Setup Backend:** Create backend directory structure and implement API
3. **Update Frontend:** Create API client and update all service files
4. **Test Integration:** Ensure frontend and backend communicate correctly
5. **Deploy:** Set up production deployment for both frontend and backend

## Security Considerations

1. **JWT Token Security**
   - Use secure HTTP-only cookies for production
   - Implement refresh token mechanism
   - Set appropriate expiration times

2. **Rate Limiting**
   - Implement rate limiting on API endpoints
   - Use tools like express-rate-limit

3. **Input Validation**
   - Validate all inputs on backend
   - Use libraries like joi or zod

4. **HTTPS**
   - Always use HTTPS in production
   - Configure CORS properly

5. **Password Security**
   - Enforce strong password requirements
   - Consider adding 2FA

## Testing Strategy

1. **Backend Unit Tests**
   - Test each service function
   - Test middleware
   - Test route handlers

2. **Integration Tests**
   - Test API endpoints end-to-end
   - Test authentication flow
   - Test database operations

3. **Frontend Tests**
   - Test API client
   - Test service layer
   - Mock API responses

## Migration Path

1. **Phase 1:** Set up backend infrastructure ✅ (Partially - needs decision)
2. **Phase 2:** Implement authentication API
3. **Phase 3:** Implement ideas API
4. **Phase 4:** Implement workspaces API
5. **Phase 5:** Implement remaining APIs
6. **Phase 6:** Update frontend to use backend API
7. **Phase 7:** Test and deploy
