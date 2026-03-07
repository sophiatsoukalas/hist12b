## LA Housing & Homelessness Map – HIST 12B

This repo contains the code for the class final project **“An interactive map / comparison website of Los Angeles that examines how neoliberal housing logic has shaped homelessness policy in the United States.”**

Tech stack:

- **Frontend**: Next.js (App Router) + TypeScript + Tailwind
- **Map**: Leaflet + OpenStreetMap via `react-leaflet`
- **Backend / DB / Auth / Storage**: Supabase (Postgres + Auth + Storage)
- **Hosting**: Vercel

---

## 1. Supabase setup

1. **Create a new Supabase project**
   - Go to the Supabase dashboard and create a new project.
   - Note the **Project URL** and **Anon public API key** from the Project Settings → API page.

2. **Run schema migrations (in order)**
   
   ### For NEW projects (first-time setup):
   - In the Supabase dashboard, open **SQL Editor**.
   - Run the following files **in order**:
     1. `supabase/migrations/001_init.sql` - Creates initial tables and structure
     2. `supabase/migrations/002_add_genre_to_policies.sql` - Adds genre field for Policy/Resistance distinction
   
   ### For EXISTING projects (already have the database):
   - If you've already set up the database before, you **only need to run**:
     - `supabase/migrations/002_add_genre_to_policies.sql`
   - This adds the new `genre` field without affecting existing data.
   
   The migration will:
   - Add a `genre` column to the `policies` table (default: 'Policy')
   - Allow distinguishing between official **Policies** and **Resistance** movements
   - Create an index for faster filtering by genre

3. **Run seed data**
   - In the SQL Editor, create another query with:
     - `supabase/seed.sql`
   - Run it to insert:
     - at least **5 locations**
     - at least **6 policies**
     - at least **10 citations**

4. **Create an admin user**
   - In Supabase, go to **Authentication → Users → Add user**.
   - Create an account with an email/password you’ll use for the admin dashboard.
   - Copy the new user’s **UUID**.
   - In the SQL Editor, insert that UUID into the `admin_users` table:

```sql
insert into public.admin_users (user_id)
values ('<PASTE_USER_UUID_HERE>');
```

5. **Create a public Storage bucket for images**
   - In Supabase, go to **Storage → + New bucket**.
   - Name it `location-images`.
   - Set it to **public**.
   - You can keep default file size limits.

---

## 2. Environment variables

Create a file called `.env.local` in the project root with:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-PROJECT-URL.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_PUBLIC_KEY"
```

- These values come from Supabase **Project Settings → API**.
- Do **not** commit `.env.local` to version control.

---

## 3. Local development

Install dependencies (already done if `create-next-app` was just run, but safe to repeat):

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser.

Key routes:

- `/` – Home (overview, thesis, how to use the site)
- `/map` – Map Explorer (Leaflet map + filters + location narratives)
- `/policies` – Policy Timeline (grouped by decade)
- `/about` – Methods & acknowledgements
- `/sources` – Bibliography with search + backlinks
- `/admin` – Admin Dashboard (email/password login + CRUD)

---

## 4. Deploying to Vercel

1. **Push this repo to GitHub** (or another git host).
2. Go to Vercel and **Import Project** from your repo.
3. When prompted for environment variables, add:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. Deploy. Vercel will:
   - Install dependencies
   - Build the Next.js app
   - Host the app at a public URL

After deployment, visit the Vercel URL and verify that:

- `/map` loads the OpenStreetMap tiles and seeded locations
- `/policies` shows the seeded policies grouped by decade
- `/sources` lists seeded citations
- `/admin` shows the login form and, after login, the admin tabs

---

## 5. Content editing guide (for non‑coders)

This is the short guide for teammates who just want to add content.

### 5.1 Logging into the admin dashboard

- Go to `/admin` on the deployed site.
- Enter the email and password you were given.
- If you see a yellow “viewer only” box, ask the tech lead or project owner to add your user ID to the `admin_users` table in Supabase.

### 5.2 Editing locations (map points)

- In `/admin`, click the **Locations** tab.
- On the right, you’ll see a list of existing locations. Click **Edit** to change one, or click **New** (top of the form) to create a new one.
- Fields:
  - **Title**: Name shown on the map and in the side panel.
  - **Slug**: Short URL-safe name (e.g. `skid-row`, `echo-park-lake-encampment`).
  - **Latitude / Longitude**: Use Google Maps or OpenStreetMap to copy coordinates.
  - **Neighborhood**: Free-text (e.g. `Downtown Los Angeles`, `Echo Park`).
  - **Era / decade label**: Short phrase (e.g. `1970s–present`).
  - **Categories**: Comma-separated list (e.g. `sweeps, shelters, policing`).
  - **Short summary**: 1–2 sentence overview.
  - **Narrative (Markdown)**: Longer narrative. You can use:
    - `**bold**` for emphasis
    - `*italics*` for key terms
    - `-` for bullet lists
  - **Images**: Choose one or more images to upload; they appear in the map drawer.
  - **Published**: Check this when the location is ready to appear on the public map.
- Click **Create location** or **Save changes**.

**Attach citations to a location**

- While editing a location, scroll down to **“Citations attached to this location”**.
- Use the dropdown to pick a citation (by key/title).
- Add an optional **context note** (e.g. “defines broken windows theory used here”).
- Click **Attach citation**.
- Existing links can be removed with the **Remove** button.

### 5.3 Editing policies (timeline)

- In `/admin`, click the **Policies** tab.
- Use the list on the right to **Edit** or **Delete** a policy; use **New** to create.
- Fields:
  - **Title**: Name of the law, program, initiative, or court case.
  - **Slug**: Short URL-safe identifier (e.g. `lamc-41-18-expansion`).
  - **Date**: The main date associated with the policy (e.g. passage date).
  - **Jurisdiction**: Choose federal, state, county, or city.
  - **Tags**: Comma-separated themes (e.g. `encampment bans, policing`).
  - **Short summary**: Concise explanation of what the policy does.
  - **Narrative (Markdown)**: Paragraph(s) situating the policy in the broader story.
  - **Published**: Check when ready to show on the timeline.

**Attach citations to a policy**

- While editing a policy, scroll to **“Citations attached to this policy”**.
- Choose a citation from the dropdown and add an optional **context note**.
- Click **Attach citation**.

### 5.4 Editing citations (sources)

- In `/admin`, click the **Citations** tab.
- Use **New** to add a citation; use **Edit** to change an existing one.
- Fields:
  - **Citation key**: Short identifier used across the project (e.g. `smith_neoliberal_city_2002`).
  - **Author**: Main author(s) or organization.
  - **Title**: Full title of the work.
  - **Year**: Publication year (optional).
  - **Publication**: Journal, press, or outlet.
  - **URL**: Link if available.
  - **Notes**: Brief comment on why this source matters.

Once citations are added, they appear on the `/sources` page, including backlinks to locations and policies where they are used.

---

## 6. Manual testing checklist

Use this list before turning in the project or demoing it.

- **Auth**
  - [ ] Can log in to `/admin` with a valid Supabase user.
  - [ ] Non-admin users see the “viewer only” message and cannot edit content.
  - [ ] “Sign out” logs you out and returns you to the login state.
- **Locations / Map**
  - [ ] Creating a new location in `/admin` makes a new marker appear on `/map` when **Published** is checked.
  - [ ] Updating latitude/longitude moves the marker correctly.
  - [ ] Filters (category, era, neighborhood) and search change which markers are visible.
  - [ ] Clicking a marker opens the right-hand drawer with summary, narrative, and images.
- **Policies / Timeline**
  - [ ] New published policies appear on `/policies` in the correct decade.
  - [ ] Jurisdiction and tags filters show/hide policies correctly.
  - [ ] Policy narratives render Markdown formatting correctly.
- **Sources**
  - [ ] `/sources` lists citations with correct author, title, publication, year.
  - [ ] Search filters the list by author/title/publication.
  - [ ] Pagination works (Next / Previous) when there are more than 10 citations.
  - [ ] After attaching citations in `/admin`, those backlinks show up under “Used in locations” and “Used in policies”.
- **Publish gating & RLS (spot-check)**
  - [ ] Draft locations/policies (Published unchecked) do **not** appear on `/map` or `/policies` when viewed in a private/incognito window.
  - [ ] Public pages still load correctly when not logged in.

