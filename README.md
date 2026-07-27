# College Course Portal

A full-stack college course portal with a React frontend (TanStack Router + Vite) and a Nitro/TanStack Start backend, connected to Supabase.

## Project Structure

```
college-course-portal-main/
│
├── frontend/                    ← React UI (TanStack Router, shadcn/ui, Tailwind)
│   ├── public/                  ← Static assets
│   ├── src/
│   │   ├── assets/              ← Images, SVGs
│   │   ├── components/          ← UI components (shadcn/Radix + custom)
│   │   │   └── ui/              ← Base shadcn components
│   │   ├── hooks/               ← Custom React hooks
│   │   ├── integrations/
│   │   │   └── supabase/        ← Browser-safe Supabase client + DB types
│   │   ├── lib/                 ← Client utilities (utils.ts, email-templates)
│   │   ├── routes/              ← TanStack Router file-based routes
│   │   ├── styles.css           ← Global Tailwind CSS
│   │   ├── router.tsx           ← Router configuration
│   │   └── routeTree.gen.ts     ← Auto-generated route tree
│   ├── components.json          ← shadcn/ui config
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── .env                    ← VITE_* public env vars only
│
├── backend/                     ← Server / API (Nitro + TanStack Start SSR)
│   ├── src/
│   │   ├── server.ts            ← Main SSR entry with error normalization
│   │   ├── start.ts             ← Dev server startup
│   │   ├── integrations/
│   │   │   └── supabase/        ← Server-only Supabase clients + auth middleware
│   │   └── lib/                 ← Server functions, error handling, email
│   ├── supabase/                ← Supabase project config + DB migrations
│   │   ├── config.toml
│   │   └── migrations/
│   ├── tsconfig.json
│   └── .env                    ← Secret server-only env vars
│
├── package.json                 ← Bun workspace root
├── bunfig.toml                  ← Bun config
├── .prettierrc                  ← Shared code formatting
└── .gitignore
```

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) installed globally

### Install Dependencies
```bash
bun install
```

### Run Development Server
```bash
# Start frontend (Vite dev server)
bun run dev:frontend

# Start backend (Nitro)
bun run dev:backend

# Or start frontend only (default)
bun run dev
```

### Build for Production
```bash
bun run build
```

## Environment Variables

### Frontend (`frontend/.env`)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID |

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** service role key (never commit!) |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TanStack Router, TanStack Query |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| Animations | GSAP |
| Backend | TanStack Start, Nitro |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Build Tool | Vite + Bun |
