# AGENTS.md

## Cursor Cloud specific instructions

### Overview
Sorca is a Next.js 15 (App Router) Socratic AI therapy web app. Single-package repo — no monorepo/workspaces.

### Quick reference
| Action | Command |
|--------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 3000) |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Clean | `npm run clean` |

### Environment variables
- Copy `.env.example` to `.env.local` and fill in values.
- **Required** (env validation in `lib/env.ts` will throw without them): 6 `NEXT_PUBLIC_FIREBASE_*` vars and `GEMINI_API_KEY`.
- Optional: Stripe, Anthropic, Together AI, Resend, Upstash Redis — the app degrades gracefully without these.
- The `.env.local` file is auto-generated from injected secrets during setup; do not commit it.

### Authentication
- The app uses **Google OAuth via Firebase Auth** exclusively — there is no email/password signup.
- To test authenticated flows (dashboard, sessions, therapist features), a Google account login via the Desktop pane is required.

### Known lint issues
- `npm run lint` exits with code 1 due to pre-existing warnings (9) and errors (4) in the codebase (React Compiler memoization, `set-state-in-effect`, etc.). These are not caused by environment setup.

### Health check
- `GET /api/health` returns JSON with status of Firebase Admin, Firebase Client, Gemini, Stripe, and Anthropic connections.
