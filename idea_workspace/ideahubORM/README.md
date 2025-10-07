# Ideahub_workspace

Minimal workspace page powered by Next.js 14, Prisma, and Postgres. It includes a document editor (Editor.js) and canvas (Excalidraw) with save/load via Prisma API routes.

> **Note**
> Legacy ConvexDB and Kinde authentication flows have been removed. Workspace access is currently unauthenticated and all onboarding routes simply link to the dashboard.

## Setup

1. Ensure `DATABASE_URL` is set in `.env` (you mentioned Prisma DB is connected).
2. Push schema:
	 ```bash
	 npx prisma db push
	 ```

## Run

```bash
npm run dev
```

## Create a file and open Workspace

```bash
curl -X POST http://localhost:3000/api/workspace \
	-H 'Content-Type: application/json' \
	-d '{"fileName":"Untitled"}'
```

Copy the `id` from the response and open:

http://localhost:3000/workspace/<id>

You can now build your app on top of the workspace component.
