import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get organization by Clerk organization ID
 */
export const getByClerkOrgId = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();
  },
});

/**
 * Get organization by slug
 */
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

/**
 * Create or update organization from Clerk
 */
export const upsertFromClerk = mutation({
  args: {
    clerkOrgId: v.string(),
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing organization
      await ctx.db.patch(existing._id, {
        name: args.name,
        slug: args.slug,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new organization
      return await ctx.db.insert("organizations", {
        clerkOrgId: args.clerkOrgId,
        name: args.name,
        slug: args.slug,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

