# Convex Backend

This directory contains the Convex backend functions and schema for the Agro Ops Platform.

## Setup

1. **Login to Convex** (if not already logged in):
   ```bash
   npx convex login
   ```

2. **Initialize your Convex project**:
   ```bash
   npx convex dev
   ```
   This will:
   - Create a new Convex project (if needed)
   - Generate deployment URL
   - Start the development server
   - Watch for changes and push them automatically

3. **Set environment variables**:
   After initialization, you'll get a deployment URL. Add it to your `.env.local`:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```

## Structure

- `schema.ts` - Database schema definitions
- `*.ts` - Convex functions (queries, mutations, actions)

## Development

- Run `npx convex dev` to start the development server
- Functions are automatically deployed as you save
- Check the Convex dashboard for logs and data

## Integration with Next.js

The Convex client is integrated in the Next.js app. Use the `useQuery`, `useMutation`, and `useAction` hooks from `convex/react` in your React components.

