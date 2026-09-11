# Insurance Ledger — Setup Guide

Do these in order. Total time: roughly 30-40 minutes, mostly waiting on things to provision.

## 1. Create the Supabase project (the database + login)

1. Go to supabase.com and sign up / sign in.
2. Click "New project". Pick any name (e.g. `insurance-ledger`), set a strong database password (save it somewhere — a password manager, not a text file), pick the region closest to you, and create it. Wait a minute or two for it to provision.
3. In the left sidebar, open the **SQL Editor**. Click "New query", paste the entire contents of `supabase/schema.sql` from this project, and click **Run**. This creates the `clients`, `entries`, and `payments` tables.
4. In the left sidebar, go to **Authentication → Users**. Click "Add user" → "Create new user". Enter your own email and a password — this is YOUR login for the app (there's no public sign-up page, on purpose). Confirm the email if it asks.
5. Go to **Project Settings → API**. Copy two values, you'll need them in step 3 below:
   - **Project URL**
   - **anon public** key (NOT the service_role key — never expose that one)
6. Go to **Project Settings → Database → Connection string**, choose the **URI** tab, and copy the connection string. You'll need it in step 4 (backups) — replace `[YOUR-PASSWORD]` in it with the database password you set in step 2.

## 2. Put the project on GitHub

1. Create a new **private** repository on GitHub (e.g. `insurance-ledger`).
2. Push everything in this folder to it (the whole thing, including `.github/` and `supabase/`).
3. Go to the repo's **Settings → Secrets and variables → Actions → New repository secret**. Name it `SUPABASE_DB_URL` and paste the connection string from step 1.6.

This alone means: every day at 2am, a free GitHub Action dumps your database into a `backups/` folder in this same repo, and deletes anything older than 30 days. That's your autobackup.

## 3. Configure the frontend

1. Inside `frontend/`, copy `.env.example` to a new file named `.env`.
2. Fill in the two values from step 1.5:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
3. `.env` is only used locally for testing — you'll enter these same two values directly into Vercel in the next step, so the live site also has them.

## 4. Deploy the frontend to Vercel

1. Go to vercel.com, sign up / sign in (you can sign in with your GitHub account — makes this easier).
2. Click "Add New… → Project", and import the GitHub repo you created in step 2.
3. When it asks for the **Root Directory**, set it to `frontend` (important — the React app lives inside that subfolder).
4. Before deploying, expand **Environment Variables** and add the same two:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. After a minute, Vercel gives you a live URL like `insurance-ledger.vercel.app` — that's your app, reachable from any device, anywhere.

## 5. Test it

1. Open the Vercel URL on your laptop, sign in with the email/password you created in step 1.4.
2. Add a client, then a test entry, then record a payment on it — confirm the numbers move correctly.
3. Open the same URL on your phone and sign in — you should see the same data.
4. In your GitHub repo, go to the **Actions** tab, open "Backup Supabase database", and click **Run workflow** to trigger it manually once — confirm a `.sql` file shows up in a new `backups/` folder afterward.

## Day-to-day use

- Just visit your Vercel URL and sign in — bookmark it on your phone and laptop.
- Every change autosaves straight to the database, no save button.
- "Export CSV" / "Backup JSON" in the app give you an on-demand copy any time, separate from the automatic daily backup.

## If something breaks

- **Blank page / login fails**: double check the two env variables in Vercel match Supabase exactly (Project Settings → API).
- **"permission denied" errors in the app**: means the SQL in step 1.3 didn't fully run — go back to the SQL Editor and re-run `schema.sql`.
- **Backup workflow fails**: check the `SUPABASE_DB_URL` secret is correct and the password inside it is the right one (not `[YOUR-PASSWORD]` literally).
