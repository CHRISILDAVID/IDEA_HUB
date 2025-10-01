# IdeaHub - Share and Collaborate on Ideas

A modern platform for sharing, discovering, and collaborating on innovative ideas. Built with Next.js, Prisma, and PostgreSQL.

## 🚀 Migration Status

This project is currently being migrated from Supabase to Prisma ORM and from React (Vite) to Next.js. See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed information about the migration process.

### Current Status
- ✅ Prisma ORM setup complete
- ✅ Database schema defined
- ✅ Next.js infrastructure ready
- ✅ Prisma services implemented
- ✅ API routes created
- 🚧 Authentication migration in progress
- 🚧 Frontend migration in progress

## 📋 Features

- **Idea Management**: Create, edit, and share innovative ideas
- **Collaboration**: Work together with others on ideas
- **Workspaces**: Visual canvas for brainstorming and planning
- **Social Features**: Follow users, star ideas, and engage with the community
- **Rich Editor**: Markdown support with TipTap editor
- **Visual Canvas**: Excalidraw integration for diagrams and sketches
- **Version Control**: Track idea evolution with forking and versioning

## 🛠️ Tech Stack

### New Stack (Post-Migration)
- **Framework**: Next.js 15 (App Router)
- **Database ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js (planned)
- **UI**: React 19, TailwindCSS
- **State Management**: Redux Toolkit
- **Rich Text**: TipTap
- **Canvas**: Excalidraw, Konva

### Legacy Stack (Pre-Migration)
- **Framework**: React 18 with Vite
- **Database**: Supabase
- **Authentication**: Supabase Auth

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/CHRISILDAVID/IDEA_HUB.git
cd IDEA_HUB
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your database URL:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ideahub?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

4. Set up the database:
```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

5. Run the development server:
```bash
# New Next.js app
npm run dev

# Legacy Vite app (during migration)
npm run dev:vite
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Available Scripts

### Next.js (New)
- `npm run dev` - Start Next.js development server
- `npm run build` - Build Next.js app for production
- `npm start` - Start Next.js production server

### Vite (Legacy - during migration)
- `npm run dev:vite` - Start Vite development server
- `npm run build:vite` - Build Vite app

### Database (Prisma)
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Other
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
IDEA_HUB/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   ├── ideas/           # Ideas endpoints
│   │   ├── users/           # Users endpoints
│   │   ├── notifications/   # Notifications endpoints
│   │   └── workspaces/      # Workspaces endpoints
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── prisma/
│   └── schema.prisma        # Database schema
├── src/
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   ├── lib/
│   │   └── prisma/         # Prisma client
│   ├── pages/               # React pages (legacy)
│   ├── services/
│   │   ├── api/            # Legacy Supabase services
│   │   └── prisma/         # New Prisma services
│   ├── store/              # Redux store
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── MIGRATION_GUIDE.md       # Migration documentation
├── next.config.js           # Next.js configuration
├── package.json
└── tsconfig.json
```

## 🗄️ Database Schema

The database uses Prisma ORM with PostgreSQL and includes:
- **Users**: User profiles and authentication
- **Ideas**: Main content entities
- **Comments**: Threaded discussions
- **Stars**: Idea favorites
- **Follows**: User relationships
- **IdeaCollaborators**: Collaboration management
- **Notifications**: User notifications
- **Workspaces**: Visual canvas workspaces
- **WorkspaceCollaborators**: Workspace sharing

See [prisma/schema.prisma](./prisma/schema.prisma) for the complete schema.

## 🔐 Authentication

Authentication is currently being migrated from Supabase Auth to NextAuth.js. During the migration period, some features may require updates.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- All contributors and users of IdeaHub

## 📞 Support

For support, please open an issue in the GitHub repository.
