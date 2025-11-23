# Project ECHO Monorepo

Packages:
- backend: Node + Express + Prisma + SQLite API
- frontend: React + Vite timeline UI
- electron: Desktop shell that loads the frontend

Use npm workspaces.

Basic dev flow:
1. In one terminal: `npm install` at repo root.
2. In another terminal: `npm run backend:dev`
3. In another: `npm run frontend:dev`
4. In another: `npm run electron:dev`
