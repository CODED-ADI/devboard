<div align="center">

<img src="https://img.shields.io/badge/DevBoard-by%20HEX-6366f1?style=for-the-badge&logoColor=white" alt="DevBoard by HEX" />

# DevBoard

### GitHub-Integrated Kanban for Developers

[![Live Demo](https://img.shields.io/badge/Live%20Demo-devboard--mu--eight.vercel.app-6366f1?style=flat-square&logo=vercel&logoColor=white)](https://devboard-mu-eight.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**Built by [HEX](https://github.com/CODED-ADI) &nbsp;·&nbsp; [Live Demo →](https://devboard-mu-eight.vercel.app)**

</div>

---

## The Problem

Developers constantly context-switch between GitHub Issues and project management tools. No clean, free tool bridges them for solo devs and small teams.

DevBoard syncs your GitHub Issues directly into a Kanban board. Move a card, the GitHub Issue label updates. Close a card, the Issue closes. Real-time, two-way.

---

## Features

### Core MVP
- **GitHub OAuth** — sign in with your GitHub account
- **Repo-linked Boards** — connect any board to a GitHub repository
- **Two-way Issue Sync** — cards reflect GitHub Issues and vice versa
- **Drag and Drop** — smooth column and card reordering via dnd-kit
- **Labels and Assignees** — pulled directly from GitHub
- **Dark UI** — built for developers, not product managers

### Advanced (In Progress)
- **Event Sourcing** — every state change is an immutable log entry
- **Optimistic UI** — instant feedback before server confirms
- **Activity Feed** — full board history per workspace
- **Sprint Velocity** — Recharts-powered burndown charts
- **Command Palette** — Cmd+K for power users

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL via Neon |
| ORM | Prisma |
| Auth | NextAuth.js v5 (Auth.js) |
| State | Zustand + TanStack Query |
| Drag and Drop | @dnd-kit/core |
| GitHub API | @octokit/rest + GitHub GraphQL |
| CI | GitHub Actions |

---

## Architecture

```
Browser (React)
  Zustand (optimistic UI) + TanStack Query (server sync)
         |
Next.js 16 (App Router)
  Server Components, Route Handlers, Auth
         |              |
PostgreSQL (Neon)    GitHub REST + GraphQL
Prisma ORM           @octokit/rest
BoardActivity log    Issue / Label sync
(event sourcing)
```

---

## Getting Started

### Prerequisites
- Node.js 20.9+
- PostgreSQL database (Neon free tier works)
- GitHub OAuth App

### 1. Clone and Install

```bash
git clone https://github.com/CODED-ADI/devboard.git
cd devboard
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env.local
```

Fill in `.env.local` with your database URL, auth secret, and GitHub OAuth credentials.

### 3. Database Setup

```bash
npx prisma db push
npx prisma generate
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Sign-in page
│   ├── (dashboard)/boards/   # Kanban boards
│   └── api/auth/             # NextAuth route handler
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── features/             # Board, Task, GitHub components
│   └── layouts/              # Nav, Providers
├── lib/
│   ├── auth.ts               # NextAuth config
│   ├── github.ts             # Octokit + GraphQL helpers
│   ├── prisma.ts             # DB client singleton
│   └── utils.ts              # Utility functions
├── stores/
│   └── board-store.ts        # Zustand optimistic board state
└── types/                    # Shared TypeScript interfaces
```

---

## License

MIT © HEX

---

<div align="center">

**© 2026 HEX — CODED-ADI. All rights reserved.**

*Crafted with precision by HEX*

</div>
