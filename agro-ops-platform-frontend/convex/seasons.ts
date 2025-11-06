import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all seasons for an organization
 */
export const getByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seasons")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

/**
 * Get season by year
 */
export const getByYear = query({
  args: {
    organizationId: v.id("organizations"),
    year: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seasons")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("year"), args.year))
      .first();
  },
});

/**
 * Get active season(s)
 */
export const getActive = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("seasons")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

/**
 * Create a new season by year
 * Auto-generates name as "YYYY / YYYY+1" and dates from Jan 1 to Dec 31
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    year: v.number(), // e.g., 2024
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const yearStr = args.year.toString();
    const nextYear = args.year + 1;
    const yearIdentifier = `${yearStr} / ${nextYear}`;
    const name = yearIdentifier;

    // Create dates: Jan 1, YYYY to Dec 31, YYYY
    const startDate = new Date(args.year, 0, 1).getTime();
    const endDate = new Date(args.year, 11, 31, 23, 59, 59, 999).getTime();

    // Check if season with this year already exists
    const existing = await ctx.db
      .query("seasons")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("year"), yearIdentifier))
      .first();

    if (existing) {
      throw new Error(`Season for year ${yearIdentifier} already exists`);
    }

    const now = Date.now();
    return await ctx.db.insert("seasons", {
      organizationId: args.organizationId,
      name,
      year: yearIdentifier,
      startDate,
      endDate,
      isActive: args.isActive ?? false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a season
 */
export const update = mutation({
  args: {
    seasonId: v.id("seasons"),
    name: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { seasonId, ...updates } = args;
    const existing = await ctx.db.get(seasonId);
    if (!existing) {
      throw new Error("Season not found");
    }

    await ctx.db.patch(seasonId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get a single season by ID
 */
export const getById = query({
  args: { seasonId: v.id("seasons") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.seasonId);
  },
});

