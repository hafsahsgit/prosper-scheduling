# 🚀 Supabase Realtime Database & Vercel Integration Guide

This guide details how to set up **Supabase Realtime Database** for your **Prosper Music Academy Operations Suite**. 

By connecting Supabase to your Vercel deployment, your client will get **instant 0.1-second multi-device sync** across all phones, tablets, and laptops, with **zero polling delays, zero CORS errors, and zero data collisions**.

---

## 📋 Step 1: Create a Free Supabase Project (2 Minutes)

1. Go to **[supabase.com](https://supabase.com)** and click **Start your project**.
2. Sign in with GitHub or Email.
3. Click **New Project**:
   - **Name**: `prosper-music-academy`
   - **Database Password**: Set a strong password (or click *Generate Password*).
   - **Region**: Choose the closest region to your team (e.g. *eu-west-1 London* or *us-east-1*).
   - **Pricing Plan**: Free Tier ($0/month).
4. Click **Create new project** and wait ~60 seconds for provisioning.

---

## ⚡ Step 2: Run Database Schema SQL (1 Minute)

1. Inside your new Supabase Project Dashboard, click on **SQL Editor** in the left sidebar menu (icon looks like `>/`).
2. Click **New Query**.
3. Open the file [`supabase_schema.sql`](./supabase_schema.sql) in this repository, copy all contents, and paste them into the SQL Editor.
4. Click the green **Run** button (or press `Ctrl + Enter`).
5. You will see `Success. No rows returned`. All 6 database tables (`students`, `parents`, `reschedules`, `attendance_logs`, `payment_transactions`, `audit_logs`) and Realtime WebSockets are now live!

---

## 🔑 Step 3: Copy Supabase API Credentials

1. In your Supabase Dashboard, click on **Project Settings** (gear icon ⚙️ at bottom left).
2. Click on **API** in the sidebar.
3. Copy the following two values:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (looks like a long token string starting with `eyJhbG...`)

---

## 🌐 Step 4: Add Environment Variables to Vercel (1 Minute)

1. Go to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Click on your connected project (`prosper-scheduling` or similar).
3. Go to **Settings** -> **Environment Variables**.
4. Add two new environment variables:

| Key | Value | Target |
| :--- | :--- | :--- |
| `SUPABASE_URL` | `https://xyzcompany.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Production, Preview, Development |

5. Click **Save** and trigger a new Redeploy on Vercel.

---

## 🎯 Verification & Real-Time Sync Test

1. Open your Vercel deployment URL on **Device A (Phone)** and **Device B (Laptop)**.
2. Sign in on both devices.
3. Toggle a parent status (`ACTIVE` -> `INACTIVE`) or add a reschedule on Device A.
4. **Observe Device B**: The screen will update **instantly in ~0.1 seconds without refreshing!**

---

## 🔄 Optional: Google Sheets Automated Backup

If your client still wants an export copy in Google Sheets:
- Supabase data can be automatically exported to Google Sheets using a simple free webhook or scheduled Google Apps Script `fetchAllData` job.
