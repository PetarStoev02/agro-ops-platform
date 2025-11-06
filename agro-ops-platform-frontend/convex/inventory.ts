import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get all inventory items for an organization
 */
export const getByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
  },
});

/**
 * Get a single inventory item by ID
 */
export const getById = query({
  args: { itemId: v.id("inventory") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.itemId);
  },
});

/**
 * Create a new inventory item (chemical or fertilizer)
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    name: v.string(),
    category: v.string(), // "chemical" or "fertilizer"
    quantity: v.number(),
    unit: v.string(),
    location: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    cropTypes: v.optional(v.array(v.string())),
    applicableFor: v.optional(v.array(v.string())),
    // Fertilizer-specific fields
    contents: v.optional(v.string()),
    nitrogenContent: v.optional(v.number()),
    fertilizerType: v.optional(v.string()), // "гранулиран" or "листен"
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("inventory", {
      organizationId: args.organizationId,
      name: args.name,
      category: args.category,
      quantity: args.quantity,
      unit: args.unit,
      location: args.location,
      expiryDate: args.expiryDate,
      cropTypes: args.cropTypes,
      applicableFor: args.applicableFor,
      contents: args.contents,
      nitrogenContent: args.nitrogenContent,
      fertilizerType: args.fertilizerType,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Update an existing inventory item
 */
export const update = mutation({
  args: {
    itemId: v.id("inventory"),
    name: v.optional(v.string()),
    category: v.optional(v.string()),
    quantity: v.optional(v.number()),
    unit: v.optional(v.string()),
    location: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    cropTypes: v.optional(v.array(v.string())),
    applicableFor: v.optional(v.array(v.string())),
    contents: v.optional(v.string()),
    nitrogenContent: v.optional(v.number()),
    fertilizerType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { itemId, ...updates } = args;
    const existing = await ctx.db.get(itemId);
    if (!existing) {
      throw new Error("Inventory item not found");
    }

    await ctx.db.patch(itemId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete an inventory item
 */
export const remove = mutation({
  args: { itemId: v.id("inventory") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.itemId);
  },
});

/**
 * Get available fertilizers for an organization
 * Used by activities to select fertilizers
 */
export const getAvailableFertilizers = query({
  args: {
    organizationId: v.id("organizations"),
    cropType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("category"), "fertilizer"))
      .collect();

    // Filter by crop type if provided
    if (args.cropType) {
      return items.filter(
        (item) =>
          !item.cropTypes || item.cropTypes.includes(args.cropType!)
      );
    }

    return items;
  },
});

/**
 * Get available chemicals for an organization
 * Used by activities to select chemicals
 */
export const getAvailableChemicals = query({
  args: {
    organizationId: v.id("organizations"),
    cropType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const items = await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("category"), "chemical"))
      .collect();

    // Filter by crop type if provided
    if (args.cropType) {
      return items.filter(
        (item) =>
          !item.cropTypes || item.cropTypes.includes(args.cropType!)
      );
    }

    return items;
  },
});

