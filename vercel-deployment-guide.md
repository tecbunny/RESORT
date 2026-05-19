# 🚀 Resort Management System: Vercel Deployment Guide

Deploying your React-based Resort Management System to Vercel is extremely simple and fast. Follow this guide to go live in less than 2 minutes.

---

## 💻 Method 1: Deploying via Vercel GitHub Integration (Recommended)

This is the easiest and most professional method. Every time you push code to GitHub, Vercel will automatically build and deploy your app.

### **Step 1: Push your code to GitHub**
Initialize Git in your project folder, commit your changes, and push them to a new GitHub repository:
```bash
git init
git add .
git commit -m "Initialize Resort Management System with Supabase & Mobile Optimization"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

### **Step 2: Connect to Vercel**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) (create a free account if you don't have one).
2. Click **Add New...** -> **Project**.
3. Import your new GitHub repository.

### **Step 3: Add Environment Variables (Crucial)**
Before clicking **Deploy**, expand the **Environment Variables** section and add your Supabase credentials:
* **Key:** `VITE_SUPABASE_URL`  
  **Value:** `https://your-project-id.supabase.co`
* **Key:** `VITE_SUPABASE_ANON_KEY`  
  **Value:** `your-anon-public-key-here`

### **Step 4: Deploy!**
Click **Deploy**. Vercel will auto-detect Vite, build the production bundles, and give you a live HTTPS domain link!

---

## ⚡ Method 2: Deploying via Vercel CLI (Command Line)

If you prefer deploying straight from your local terminal without pushing to GitHub first, you can use the Vercel CLI.

### **Step 1: Install Vercel CLI globally**
Run the following command in your terminal (or command prompt):
```bash
npm install -g vercel
```

### **Step 2: Log in to Vercel**
```bash
vercel login
```
Follow the prompts in your browser to authorize the CLI.

### **Step 3: Link and Configure your project**
Run the deploy command from your project root:
```bash
vercel
```
Answer the interactive setup questions:
1. Set Up and Deploy? **Yes**
2. Which scope? (Select your personal account)
3. Link to existing project? **No**
4. What is the project's name? **resort-management**
5. In which directory is your code? **./**
6. Modify default build settings? **No** (Vercel automatically detects Vite!)

### **Step 4: Set Environment Variables on Vercel**
Add your Supabase environment keys to the Vercel cloud:
```bash
vercel env add VITE_SUPABASE_URL your_supabase_url_here
vercel env add VITE_SUPABASE_ANON_KEY your_supabase_anon_key_here
```

### **Step 5: Deploy to Production**
Now that keys are configured, run the production build and deploy command:
```bash
vercel --prod
```
Your resort management system is now live with a production-grade URL!

---

## 🔒 Security Best Practices for Vercel
- **Environment Isolation:** Do not expose your private database service role keys (`SERVICE_ROLE`). Only use the public `ANON_KEY`.
- **Custom Domain:** You can easily map your custom domain (e.g. `resort.yourdomain.com`) in the **Project Settings** -> **Domains** tab in Vercel for a premium business outlook.
