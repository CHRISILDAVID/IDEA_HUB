# Deployment Checklist

This checklist outlines the steps needed to deploy the migrated IdeaHub application.

## Pre-Deployment Setup

### 1. Database Setup
- [ ] Create PostgreSQL database instance
  - Options: Supabase PostgreSQL, Railway, Neon, PlanetScale, or self-hosted
  - Recommended: Use Supabase PostgreSQL to minimize migration effort
- [ ] Note database connection details
- [ ] Set up database backups

### 2. Environment Variables
Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database?schema=public"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="generate-a-secure-random-string-here"

# Application
NODE_ENV="production"
```

To generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Database Migration
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations to create tables
npm run prisma:migrate deploy

# Optional: Seed initial data
# npm run prisma:db:seed
```

### 4. Data Migration (If migrating from existing Supabase)
If you have existing data in Supabase:

1. Export data from Supabase:
   - Use Supabase SQL editor or pg_dump
   - Export tables: users, ideas, comments, stars, follows, etc.

2. Transform data to match Prisma schema:
   - Field names (snake_case → camelCase mapping handled by Prisma)
   - Ensure UUIDs are properly formatted

3. Import data:
   ```bash
   # Option 1: Using Prisma Studio
   npm run prisma:studio
   
   # Option 2: Using SQL scripts
   psql $DATABASE_URL < migration_script.sql
   
   # Option 3: Using custom migration script
   node scripts/migrate-data.js
   ```

## Deployment Platforms

### Option 1: Vercel (Recommended for Next.js)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login and deploy:
```bash
vercel login
vercel
```

3. Set environment variables in Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env`

4. Deploy:
```bash
vercel --prod
```

### Option 2: Railway

1. Install Railway CLI:
```bash
npm install -g @railway/cli
```

2. Login and initialize:
```bash
railway login
railway init
```

3. Add PostgreSQL service:
```bash
railway add
# Select PostgreSQL
```

4. Set environment variables:
```bash
railway variables set NEXTAUTH_SECRET="your-secret"
railway variables set NEXTAUTH_URL="https://your-app.railway.app"
```

5. Deploy:
```bash
railway up
```

### Option 3: Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ideahub
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

3. Deploy:
```bash
docker-compose up -d
```

## Post-Deployment

### 1. Verify Deployment
- [ ] Check that the application loads
- [ ] Test authentication (sign up, sign in, sign out)
- [ ] Verify database connections
- [ ] Test creating/editing/deleting ideas
- [ ] Test workspace functionality
- [ ] Verify notifications work
- [ ] Check user profiles and following

### 2. Performance Monitoring
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Configure analytics (Google Analytics, Plausible, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom, etc.)
- [ ] Monitor database performance

### 3. Security Checklist
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Rate limiting implemented (if needed)
- [ ] CORS configured properly
- [ ] Input validation in place
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection enabled

### 4. Optimize Performance
- [ ] Enable Next.js caching
- [ ] Set up CDN for static assets
- [ ] Optimize images (Next.js Image component)
- [ ] Enable Prisma connection pooling
- [ ] Set up database indexes
- [ ] Configure ISR (Incremental Static Regeneration) for appropriate pages

### 5. Documentation
- [ ] Update README with production setup
- [ ] Document API endpoints
- [ ] Create user guide
- [ ] Document deployment process
- [ ] Set up changelog

## Database Optimization

### Recommended Indexes
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_ideas_author_id ON ideas(author_id);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_created_at ON ideas(created_at);
CREATE INDEX idx_stars_user_id ON stars(user_id);
CREATE INDEX idx_stars_idea_id ON stars(idea_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_comments_idea_id ON comments(idea_id);
```

### Connection Pooling
Add to `DATABASE_URL`:
```
?connection_limit=10&pool_timeout=20
```

## Rollback Plan

If issues occur:

1. Keep old Supabase instance running initially
2. Maintain database backups
3. Have DNS ready to point back to old deployment
4. Document all configuration changes
5. Test rollback procedure in staging

## Maintenance

### Regular Tasks
- [ ] Weekly database backups
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Monitor error logs
- [ ] Review and optimize slow queries

### Monitoring Alerts
Set up alerts for:
- Application errors (>50/hour)
- High response times (>2s)
- Database connection issues
- High memory/CPU usage
- Failed authentication attempts

## Support Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Prisma Deployment Docs](https://www.prisma.io/docs/guides/deployment)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)

## Troubleshooting

### Common Issues

**Database Connection Errors**
- Verify DATABASE_URL format
- Check database firewall rules
- Ensure connection pooling settings

**Build Failures**
- Check Node.js version compatibility
- Verify all dependencies installed
- Review build logs for specific errors

**Authentication Issues**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches deployment URL
- Ensure cookies are enabled

**Performance Issues**
- Review database query performance
- Check Next.js bundle size
- Monitor server resources
- Consider implementing caching

## Success Criteria

Deployment is successful when:
- ✅ Application accessible at production URL
- ✅ All core features working
- ✅ Authentication functioning correctly
- ✅ Database queries performing well
- ✅ Error rate < 1%
- ✅ Response times < 1s for 95% of requests
- ✅ Monitoring and alerts configured
- ✅ Backups running successfully
