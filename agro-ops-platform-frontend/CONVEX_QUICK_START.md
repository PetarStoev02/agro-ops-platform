# Convex Quick Start Guide

## Why You're Seeing Skeleton Loaders

The dashboard shows skeleton loaders because:
1. **Convex isn't connected** - The `NEXT_PUBLIC_CONVEX_URL` environment variable is missing
2. **Organization not synced** - Your Clerk organization needs to be synced to Convex

## Step-by-Step Setup

### 1. Install and Login to Convex

```bash
# Login to Convex (opens browser)
npx convex login
```

### 2. Start Convex Development Server

In a **separate terminal**, run:

```bash
cd agro-ops-platform-frontend
npx convex dev
```

This will:
- Create a new Convex project (or connect to existing)
- Show you a deployment URL like: `https://your-project.convex.cloud`
- Start watching for changes

**Keep this terminal running!**

### 3. Add Environment Variable

Copy the deployment URL from step 2, then:

1. Create `.env.local` in the `agro-ops-platform-frontend` folder (if it doesn't exist)
2. Add this line:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

Replace `https://your-project.convex.cloud` with your actual URL.

### 4. Restart Next.js Dev Server

Stop your Next.js server (Ctrl+C) and restart it:

```bash
pnpm dev
```

### 5. Verify Connection

1. Open your app in the browser
2. Navigate to the dashboard
3. The organization will automatically sync to Convex
4. Skeleton loaders should disappear and show `0` values

## What Happens Next

Once connected:
- ✅ Your Clerk organization automatically syncs to Convex
- ✅ Dashboard shows `0` for empty data (not skeletons)
- ✅ You can start adding data (fields, inventory, activities, etc.)

## Adding Data

To populate the dashboard, you need to add data to these tables:

1. **Seasons** - Create at least one active season
2. **Fields** - Add fields with crop types
3. **Activities** - Add farming activities
4. **Inventory** - Add products/items
5. **Credits** - Add financial transactions
6. **Audits** - Add audits
7. **Notifications** - Add notifications

See `DASHBOARD_DATA_REQUIREMENTS.md` for detailed field requirements.

## Troubleshooting

### Still Seeing Skeletons?

1. **Check Convex is running**: Make sure `npx convex dev` is running in a terminal
2. **Check environment variable**: Verify `.env.local` has `NEXT_PUBLIC_CONVEX_URL`
3. **Restart Next.js**: Stop and restart `pnpm dev`
4. **Check browser console**: Look for Convex connection errors

### "Missing NEXT_PUBLIC_CONVEX_URL" Error

- Make sure you've added the URL to `.env.local`
- Restart your Next.js dev server after adding it
- The file should be in `agro-ops-platform-frontend/.env.local`

### Organization Not Syncing

The organization sync happens automatically when you visit the dashboard. If it's not working:

1. Check browser console for errors
2. Verify Convex is running (`npx convex dev`)
3. Check that your Clerk organization has a `slug` set

## Next Steps

Once Convex is connected:
1. ✅ Dashboard will show `0` values instead of skeletons
2. ✅ Start adding data through the app (fields, inventory, etc.)
3. ✅ Dashboard will update in real-time as you add data

## Need Help?

- Check `CONVEX_SETUP.md` for detailed documentation
- Visit [Convex Dashboard](https://dashboard.convex.dev) to see your data
- Check Convex dev server terminal for errors

