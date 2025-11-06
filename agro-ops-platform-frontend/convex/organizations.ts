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
      // Update existing organization (preserve onboarding fields)
      await ctx.db.patch(existing._id, {
        name: args.name,
        slug: args.slug,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new organization (not onboarded by default)
      return await ctx.db.insert("organizations", {
        clerkOrgId: args.clerkOrgId,
        name: args.name,
        slug: args.slug,
        isOnboarded: false,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

/**
 * Update organization details during onboarding
 */
export const updateOrganizationDetails = mutation({
  args: {
    clerkOrgId: v.string(),
    municipality: v.optional(v.string()),
    settlement: v.optional(v.string()),
    address: v.optional(v.string()),
    agricultureDirectorate: v.optional(v.string()),
    regionalFoodSafetyDirectorate: v.optional(v.string()),
    ekatteRegistration: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!existing) {
      throw new Error("Organization not found");
    }

    const now = Date.now();

    await ctx.db.patch(existing._id, {
      municipality: args.municipality,
      settlement: args.settlement,
      address: args.address,
      agricultureDirectorate: args.agricultureDirectorate,
      regionalFoodSafetyDirectorate: args.regionalFoodSafetyDirectorate,
      ekatteRegistration: args.ekatteRegistration,
      updatedAt: now,
    });

    return existing._id;
  },
});

/**
 * Mark organization as onboarded
 */
export const markAsOnboarded = mutation({
  args: {
    clerkOrgId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!existing) {
      throw new Error("Organization not found");
    }

    const now = Date.now();

    await ctx.db.patch(existing._id, {
      isOnboarded: true,
      updatedAt: now,
    });

    return existing._id;
  },
});

/**
 * Get onboarding status for an organization
 */
export const getOnboardingStatus = query({
  args: { clerkOrgId: v.string() },
  handler: async (ctx, args) => {
    const org = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
      .first();

    if (!org) {
      return { hasOrganization: false, isOnboarded: false };
    }

    return {
      hasOrganization: true,
      isOnboarded: org.isOnboarded ?? false,
    };
  },
});

/**
 * List organizations by Clerk organization IDs
 */
export const listByUserMemberships = query({
  args: { clerkOrgIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const orgs = await Promise.all(
      args.clerkOrgIds.map((clerkOrgId) =>
        ctx.db
          .query("organizations")
          .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", clerkOrgId))
          .first()
      )
    );
    return orgs.filter((org): org is NonNullable<typeof org> => org !== null);
  },
});

