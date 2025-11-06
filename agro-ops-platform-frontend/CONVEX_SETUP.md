# Convex Setup Guide

This guide will help you set up Convex for the Agro Ops Platform.

## Prerequisites

- Node.js and pnpm installed
- A Convex account (free tier available)

## Setup Steps

### 1. Login to Convex

```bash
npx convex login
```

This will open your browser to authenticate with Convex. If you don't have an account, you can create one for free.

### 2. Initialize Convex Project

```bash
npx convex dev
```

This command will:
- Create a new Convex project (or connect to an existing one)
- Generate a deployment URL
- Start the development server
- Watch for changes and automatically deploy them

**Important:** After running this command, you'll receive a deployment URL that looks like:
```
https://your-project-name.convex.cloud
```

### 3. Set Environment Variable

Create a `.env.local` file in the root of the project (if it doesn't exist) and add:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project-name.convex.cloud
```

Replace `https://your-project-name.convex.cloud` with the actual URL you received from step 2.

### 4. Verify Setup

1. Start the Next.js dev server:
   ```bash
   pnpm dev
   ```

2. Check that Convex is running:
   ```bash
   pnpm convex:dev
   ```

3. Visit the Convex dashboard to see your deployment:
   - The dashboard URL will be shown in the terminal
   - Or visit https://dashboard.convex.dev

## Project Structure

- `convex/schema.ts` - Database schema definitions
- `convex/*.ts` - Convex functions (queries, mutations, actions)
- `convex/_generated/` - Auto-generated types (DO NOT EDIT)

## Development Workflow

### Running Convex in Development

Keep the Convex dev server running in a separate terminal:

```bash
pnpm convex:dev
```

This will:
- Watch for changes in the `convex/` directory
- Automatically deploy functions as you save
- Show logs and errors in real-time

### Using Convex in Your Components

```typescript
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export function MyComponent() {
  const { organization } = useOrganization();
  
  // Query data
  const fields = useQuery(
    api.fields.getByOrganization,
    organization?.id 
      ? { organizationId: organization.id }
      : "skip"
  );
  
  // Mutate data
  const createField = useMutation(api.fields.create);
  
  // ... rest of component
}
```

## Schema Overview

The schema includes tables for:
- `organizations` - Company/organization data (synced with Clerk)
- `fields` - Agricultural fields
- `seasons` - Farming seasons
- `activities` - Farming activities
- `diaries` - Daily logs
- `inventory` - Warehouse inventory
- `reports` - Various reports
- `notifications` - User notifications
- `credits` - Financial records
- `audits` - Compliance audits

## Syncing Clerk Organizations

When a user creates or updates an organization in Clerk, sync it to Convex:

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const upsertOrg = useMutation(api.organizations.upsertFromClerk);

// Call when organization changes
await upsertOrg({
  clerkOrgId: organization.id,
  name: organization.name,
  slug: organization.slug,
});
```

## Troubleshooting

### "Missing NEXT_PUBLIC_CONVEX_URL" Error

Make sure you've:
1. Run `npx convex dev` to get your deployment URL
2. Added `NEXT_PUBLIC_CONVEX_URL` to `.env.local`
3. Restarted your Next.js dev server

### Functions Not Deploying

- Make sure `npx convex dev` is running
- Check for TypeScript errors in your Convex functions
- Look at the Convex dev server logs for errors

### Type Errors

After modifying the schema or functions, the generated types might be out of sync. Run:

```bash
npx convex dev
```

This will regenerate the types in `convex/_generated/`.

## Production Deployment

When deploying to production:

1. Deploy your Convex functions:
   ```bash
   pnpm convex:deploy --prod
   ```

2. Set the production Convex URL in your production environment variables

3. The Convex dashboard will show you the production deployment URL

## Resources

- [Convex Documentation](https://docs.convex.dev)
- [Convex Dashboard](https://dashboard.convex.dev)
- [Convex React Hooks](https://docs.convex.dev/client/react)

