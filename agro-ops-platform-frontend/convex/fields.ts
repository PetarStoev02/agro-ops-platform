import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all fields for an organization
 */
export const getByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("fields")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

/**
 * Get a single field by ID
 */
export const getById = query({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fieldId);
  },
});

/**
 * Create a new field
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    bzsNumber: v.string(),
    populatedPlace: v.string(),
    landArea: v.string(),
    locality: v.string(),
    area: v.number(),
    sowingDate: v.optional(v.number()),
    cropType: v.optional(v.string()),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    seasonId: v.optional(v.id("seasons")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("fields", {
      organizationId: args.organizationId,
      name: args.name,
      bzsNumber: args.bzsNumber,
      populatedPlace: args.populatedPlace,
      landArea: args.landArea,
      locality: args.locality,
      area: args.area,
      sowingDate: args.sowingDate,
      cropType: args.cropType,
      location: args.location,
      seasonId: args.seasonId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update a field
 */
export const update = mutation({
  args: {
    fieldId: v.id("fields"),
    name: v.optional(v.string()),
    bzsNumber: v.optional(v.string()),
    populatedPlace: v.optional(v.string()),
    landArea: v.optional(v.string()),
    locality: v.optional(v.string()),
    area: v.optional(v.number()),
    sowingDate: v.optional(v.number()),
    cropType: v.optional(v.string()),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    seasonId: v.optional(v.id("seasons")),
  },
  handler: async (ctx, args) => {
    const { fieldId, ...updates } = args;
    const existing = await ctx.db.get(fieldId);
    if (!existing) {
      throw new Error("Field not found");
    }

    await ctx.db.patch(fieldId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete a field
 */
export const remove = mutation({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.fieldId);
  },
});

/**
 * Get activities for a field grouped by category/type
 */
export const getActivitiesByField = query({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
      .collect();

    // Group activities by type
    const grouped = activities.reduce((acc, activity) => {
      const type = activity.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    return grouped;
  },
});

/**
 * Get field with activities count by category
 */
export const getWithActivitiesCount = query({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const field = await ctx.db.get(args.fieldId);
    if (!field) {
      return null;
    }

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
      .collect();

    // Count activities by type
    const counts = activities.reduce((acc, activity) => {
      const type = activity.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...field,
      activityCounts: counts,
      totalActivities: activities.length,
    };
  },
});

