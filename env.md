# 🔑 Resort Management System: Environment Variables Setup

Configure the following environment variables to activate cloud synchronization, real-time updates, and Vercel hosting.

---

## ☁️ Supabase Cloud Configuration

Add these variables to connect the frontend state engine to your Supabase Postgres Database.

### 1. `VITE_SUPABASE_URL`
* **Type:** String (URL)
* **Value:** The endpoint of your Supabase API instance.
* **Format:** `https://[your-project-reference-id].supabase.co`
* **Where to find:** 
  1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
  2. Select your Project.
  3. Go to **Settings ⚙️** (bottom left sidebar) ➔ **API**.
  4. Copy the URL from the **Project URL** box.

### 2. `VITE_SUPABASE_ANON_KEY`
* **Type:** String (JWT)
* **Value:** The public anon token used by the client SDK to safely authenticate requests.
* **Format:** A long alphanumeric string starting with `eyJ...`
* **Where to find:**
  1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
  2. Select your Project.
  3. Go to **Settings ⚙️** ➔ **API**.
  4. Copy the key from the **Project API keys** section under **`anon` / `public`**.

---

## 📝 Setup Instructions

### 💻 Local Development Setup (`.env`)
Create a file named `.env` in the root of this project and paste the following content:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-anon-key-here
```

> [!NOTE]  
> Files starting with `.env` are automatically ignored by Git (using the configured `.gitignore`) to ensure your secrets are never exposed on public repositories.

---

## 🚀 Vercel Production Setup

When deploying to Vercel, do not commit your `.env` file. Instead, set the environment variables via the Vercel dashboard:

1. Open your Vercel Dashboard and select your **resort** project.
2. Go to **Settings** ➔ **Environment Variables** (in the project menu).
3. Add the two keys exactly as shown:
   * **Key:** `VITE_SUPABASE_URL` ➔ **Value:** `[Your Supabase URL]`
   * **Key:** `VITE_SUPABASE_ANON_KEY` ➔ **Value:** `[Your Supabase Anon Key]`
4. Click **Save**.
5. Trigger a redeploy by committing code, or go to **Deployments** ➔ Click the **three dots** on your latest build ➔ **Redeploy** ➔ Check **Redeploy with existing settings**.
