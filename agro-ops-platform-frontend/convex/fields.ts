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
    area: v.number(),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    cropType: v.optional(v.string()),
    seasonId: v.optional(v.id("seasons")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("fields", {
      organizationId: args.organizationId,
      name: args.name,
      area: args.area,
      location: args.location,
      cropType: args.cropType,
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
    area: v.optional(v.number()),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
    cropType: v.optional(v.string()),
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

