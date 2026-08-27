# Cairn

A cairn is a stack of stones marking a path — each passer-by adds one. This is a
minimal personal dashboard built the same way: three sections — **Heatmap**, **Todo**,
**Journal** — on a dark, hairline-ruled layout. No streaks, no scores, no badges.

> Continuity over perfection.

## The idea

**Trackers** (Heatmap) and **lists** (Todo) are deliberately separate. A tracker is just
a name and a year of squares — mark the days you did it, and that's the whole mechanism.
Nothing on the todo page touches it, and nothing on it reaches the todo page.

On a list, every item starts in **Pending**. Drag the ones that have to happen today into
**Minimum**, the section nested inside Pending. When those are done — wherever they've
since moved to — the list reads *Minimum reached · Keep going.*, and when every list with
items has reached its minimum the header reads *Today is done.*

Missed days stay blank. Nothing resets, nothing warns you. You just start again today.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres + magic-link auth) · dnd-kit

## Setup

1. **Create a Supabase project**, then open the SQL editor and run
   [`supabase/schema.sql`](supabase/schema.sql). It creates the four tables, their
   indexes, and Row Level Security policies scoping every row to `auth.uid()`.

2. **Configure the environment.**

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where to find it |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same page (the *anon/public* key) |
   | `NEXT_PUBLIC_SITE_URL` | your deployed origin, e.g. `https://cairn.vercel.app` |

   Only the anon key is used, client and server. It is safe to expose — RLS is what
   protects the data. No service-role key is needed anywhere in this app.

3. **Allow the magic-link redirect.** In Supabase → Authentication → URL Configuration,
   set the Site URL and add `http://localhost:3000/auth/callback` plus
   `https://<your-domain>/auth/callback` to the redirect allow-list.

4. **Run it.**

   ```bash
   npm install && npm run dev
   ```

## Deploying

Push to a Git repo and import it on Vercel; set the three environment variables in the
project settings. Nothing else is required — there is no server-side secret, no cron,
no background worker. For Cloudflare Workers, deploy through `@opennextjs/cloudflare`.

## How the data is shaped

| Table | Holds |
| --- | --- |
| `trackers` | a name and an ordering — nothing else |
| `day_logs` | one row per tracker per day it was marked — what the heatmap draws |
| `lists` | a name and an ordering, for grouping today's items |
| `todos` | one row per item per day, with `done`, `is_minimum`, `position` |
| `journal_entries` | one row per day, unique on `(user_id, day)` |

Trackers are marked by hand and only by hand. Dates are stored as `YYYY-MM-DD` in the
user's local timezone.

## Notes on the interactions

- Items drag between **Minimum**, **Everything else** and **Done** (pointer or keyboard —
  focus the handle, then Space and arrow keys). The small `MIN` control does the same
  thing without dragging.
- Checking an item moves it to Done; if it was part of the minimum it still counts there.
- Clicking a title edits it in place; Enter saves, Escape cancels.
- **Mark today** on a tracker records the day; any past day can be marked by clicking it.
- The journal saves itself as you type, one entry per day.
- Every write is optimistic and rolls back with a visible message if the server rejects it.
