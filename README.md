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

## Deployment Guide

### Option 1: Deploying to Vercel (Recommended)

1. **Push your project to GitHub / GitLab / Bitbucket**.
2. **Import Project into Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/new) and select your repository.
   - Vercel will automatically read `vercel.json`.
3. **Configure Environment Variables** in Vercel settings:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key
   - `VITE_SUPABASE_PROJECT_ID`: Your Supabase project ID
   - `SUPABASE_URL`: Your Supabase URL
   - `SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (Secret)
4. **Deploy**: Click **Deploy**. Vercel will build and launch your full-stack app.

---

### Option 2: Deploying via Docker (Render / Railway / Fly.io / VPS)

1. Build the Docker image:
   ```bash
   docker build -t college-course-portal .
   ```
2. Run the Docker container:
   ```bash
   docker run -p 3000:3000 \
     -e VITE_SUPABASE_URL="https://your-id.supabase.co" \
     -e VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key" \
     -e SUPABASE_URL="https://your-id.supabase.co" \
     -e SUPABASE_PUBLISHABLE_KEY="your-anon-key" \
     -e SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
     college-course-portal
   ```

---

### Option 3: Deploying to Netlify

1. Connect your repository to Netlify.
2. Netlify will detect `netlify.toml` automatically.
3. Add the required Supabase Environment Variables in Netlify **Site Settings > Environment variables**.
4. Trigger deploy!

