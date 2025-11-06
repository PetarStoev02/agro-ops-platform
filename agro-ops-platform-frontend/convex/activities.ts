import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Get all activities for an organization
 */
export const getByOrganization = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .collect();
  },
});

/**
 * Get activities by category
 */
export const getByCategory = query({
  args: {
    organizationId: v.id("organizations"),
    category: v.union(
      v.literal("chemical_treatment"),
      v.literal("field_inspection"),
      v.literal("fertilizer"),
      v.literal("farm_activity")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("category"), args.category))
      .order("desc")
      .collect();
  },
});

/**
 * Get activities for a specific field
 */
export const getByField = query({
  args: { fieldId: v.id("fields") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_field", (q) => q.eq("fieldId", args.fieldId))
      .order("desc")
      .collect();

    // Group activities by category
    const grouped = activities.reduce((acc, activity) => {
      const category = activity.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    return grouped;
  },
});

/**
 * Get a single activity by ID
 */
export const getById = query({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activityId);
  },
});

/**
 * Get available chemicals from inventory for a specific crop type
 */
export const getAvailableChemicals = query({
  args: {
    organizationId: v.id("organizations"),
    cropType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => {
        // Filter by category (chemical) and applicableFor
        const categoryMatch = q.or(
          q.eq(q.field("category"), "chemical"),
          q.eq(q.field("category"), "pesticide")
        );
        
        if (!args.cropType) {
          return categoryMatch;
        }

        // Check if cropType is in cropTypes array or cropTypes is empty/undefined
        return q.and(
          categoryMatch,
          q.or(
            q.eq(q.field("cropTypes"), undefined),
            q.eq(q.field("cropTypes"), []),
            // Check if cropType is in the array (we'll filter in JS since Convex doesn't have array contains)
            q.gt(q.field("quantity"), 0)
          )
        );
      })
      .collect();

    // Filter by cropType in JavaScript (if provided)
    const filtered = args.cropType
      ? inventory.filter(
          (item) =>
            !item.cropTypes ||
            item.cropTypes.length === 0 ||
            item.cropTypes.includes(args.cropType!)
        )
      : inventory;

    return filtered.filter((item) => item.quantity > 0);
  },
});

/**
 * Get available fertilizers from inventory
 */
export const getAvailableFertilizers = query({
  args: {
    organizationId: v.id("organizations"),
    cropType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => {
        const categoryMatch = q.or(
          q.eq(q.field("category"), "fertilizer"),
          q.eq(q.field("category"), "soil_conditioner")
        );

        if (!args.cropType) {
          return categoryMatch;
        }

        return q.and(categoryMatch, q.gt(q.field("quantity"), 0));
      })
      .collect();

    // Filter by cropType in JavaScript (if provided)
    const filtered = args.cropType
      ? inventory.filter(
          (item) =>
            !item.cropTypes ||
            item.cropTypes.length === 0 ||
            item.cropTypes.includes(args.cropType!)
        )
      : inventory;

    return filtered.filter((item) => item.quantity > 0);
  },
});

/**
 * Calculate required quantity based on dose and area
 */
function calculateRequiredQuantity(
  dose: number,
  area: number,
  _unit: string
): number {
  // Dose is per decare (дка), area is in decares
  // Return the total quantity needed
  // _unit is kept for future unit conversion support
  return dose * area;
}

/**
 * Create a new activity
 */
export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    fieldId: v.optional(v.id("fields")),
    category: v.union(
      v.literal("chemical_treatment"),
      v.literal("field_inspection"),
      v.literal("fertilizer"),
      v.literal("farm_activity")
    ),
    type: v.string(), // Keep for backward compatibility
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.string(),
    // Chemical Treatment fields
    chemicalId: v.optional(v.id("inventory")),
    chemicalName: v.optional(v.string()),
    infestationType: v.optional(v.string()),
    dose: v.optional(v.number()),
    quarantinePeriod: v.optional(v.number()),
    treatedArea: v.optional(v.number()),
    equipment: v.optional(v.string()),
    // Field Inspection fields
    startDate: v.optional(v.number()),
    surveyedArea: v.optional(v.number()),
    attackedArea: v.optional(v.number()),
    damage: v.optional(v.string()),
    damageType: v.optional(v.string()),
    attackDensity: v.optional(v.string()),
    phenologicalPhase: v.optional(v.string()),
    // Fertilizer fields
    fertilizerId: v.optional(v.id("inventory")),
    fertilizerName: v.optional(v.string()),
    fertilizedArea: v.optional(v.number()),
    fertilizerType: v.optional(v.string()),
    // Farm Activity fields
    endDate: v.optional(v.number()),
    activityType: v.optional(v.string()),
    materialType: v.optional(v.string()),
    quantity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inventoryItemId: Id<"inventory"> | undefined;
    let quantityToDeduct = 0;

    // Handle inventory deduction for chemical treatments
    if (args.category === "chemical_treatment" && args.chemicalId) {
      inventoryItemId = args.chemicalId;
      const inventoryItem = await ctx.db.get(args.chemicalId);
      if (!inventoryItem) {
        throw new Error("Chemical not found in inventory");
      }

      if (args.dose && args.treatedArea) {
        quantityToDeduct = calculateRequiredQuantity(
          args.dose,
          args.treatedArea,
          inventoryItem.unit
        );

        if (inventoryItem.quantity < quantityToDeduct) {
          throw new Error(
            `Insufficient quantity. Available: ${inventoryItem.quantity} ${inventoryItem.unit}, Required: ${quantityToDeduct} ${inventoryItem.unit}`
          );
        }
      }
    }

    // Handle inventory deduction for fertilizers
    if (args.category === "fertilizer" && args.fertilizerId) {
      inventoryItemId = args.fertilizerId;
      const inventoryItem = await ctx.db.get(args.fertilizerId);
      if (!inventoryItem) {
        throw new Error("Fertilizer not found in inventory");
      }

      if (args.dose && args.fertilizedArea) {
        quantityToDeduct = calculateRequiredQuantity(
          args.dose,
          args.fertilizedArea,
          inventoryItem.unit
        );

        if (inventoryItem.quantity < quantityToDeduct) {
          throw new Error(
            `Insufficient quantity. Available: ${inventoryItem.quantity} ${inventoryItem.unit}, Required: ${quantityToDeduct} ${inventoryItem.unit}`
          );
        }
      }
    }

    // Deduct inventory if needed (before creating activity for atomicity)
    if (inventoryItemId && quantityToDeduct > 0) {
      const inventoryItem = await ctx.db.get(inventoryItemId);
      if (!inventoryItem) {
        throw new Error("Inventory item not found");
      }
      await ctx.db.patch(inventoryItemId, {
        quantity: inventoryItem.quantity - quantityToDeduct,
        updatedAt: now,
      });
    }

    // Create the activity
    const activityId = await ctx.db.insert("activities", {
      organizationId: args.organizationId,
      fieldId: args.fieldId,
      category: args.category,
      type: args.type,
      description: args.description,
      date: args.date,
      userId: args.userId,
      chemicalId: args.chemicalId,
      chemicalName: args.chemicalName,
      infestationType: args.infestationType,
      dose: args.dose,
      quarantinePeriod: args.quarantinePeriod,
      treatedArea: args.treatedArea,
      equipment: args.equipment,
      startDate: args.startDate,
      surveyedArea: args.surveyedArea,
      attackedArea: args.attackedArea,
      damage: args.damage,
      damageType: args.damageType,
      attackDensity: args.attackDensity,
      phenologicalPhase: args.phenologicalPhase,
      fertilizerId: args.fertilizerId,
      fertilizerName: args.fertilizerName,
      fertilizedArea: args.fertilizedArea,
      fertilizerType: args.fertilizerType,
      endDate: args.endDate,
      activityType: args.activityType,
      materialType: args.materialType,
      quantity: args.quantity,
      inventoryItemId: inventoryItemId,
      createdAt: now,
      updatedAt: now,
    });

    return activityId;
  },
});

/**
 * Update an existing activity
 */
export const update = mutation({
  args: {
    activityId: v.id("activities"),
    // All fields are optional for updates
    fieldId: v.optional(v.id("fields")),
    category: v.optional(
      v.union(
        v.literal("chemical_treatment"),
        v.literal("field_inspection"),
        v.literal("fertilizer"),
        v.literal("farm_activity")
      )
    ),
    type: v.optional(v.string()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    // Chemical Treatment fields
    chemicalId: v.optional(v.id("inventory")),
    chemicalName: v.optional(v.string()),
    infestationType: v.optional(v.string()),
    dose: v.optional(v.number()),
    quarantinePeriod: v.optional(v.number()),
    treatedArea: v.optional(v.number()),
    equipment: v.optional(v.string()),
    // Field Inspection fields
    startDate: v.optional(v.number()),
    surveyedArea: v.optional(v.number()),
    attackedArea: v.optional(v.number()),
    damage: v.optional(v.string()),
    damageType: v.optional(v.string()),
    attackDensity: v.optional(v.string()),
    phenologicalPhase: v.optional(v.string()),
    // Fertilizer fields
    fertilizerId: v.optional(v.id("inventory")),
    fertilizerName: v.optional(v.string()),
    fertilizedArea: v.optional(v.number()),
    fertilizerType: v.optional(v.string()),
    // Farm Activity fields
    endDate: v.optional(v.number()),
    activityType: v.optional(v.string()),
    materialType: v.optional(v.string()),
    quantity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { activityId, ...updates } = args;
    const existing = await ctx.db.get(activityId);
    if (!existing) {
      throw new Error("Activity not found");
    }

    // Handle inventory changes if chemical/fertilizer changed
    // Restore old quantity first, then deduct new quantity
    const oldInventoryId = existing.inventoryItemId;
    const oldDose = existing.dose || 0;
    const oldArea =
      existing.treatedArea || existing.fertilizedArea || 0;

    if (oldInventoryId && oldDose > 0 && oldArea > 0) {
      const oldInventoryItem = await ctx.db.get(oldInventoryId);
      if (oldInventoryItem) {
        const oldQuantity = calculateRequiredQuantity(
          oldDose,
          oldArea,
          oldInventoryItem.unit
        );
        // Restore old quantity
        await ctx.db.patch(oldInventoryId, {
          quantity: oldInventoryItem.quantity + oldQuantity,
          updatedAt: Date.now(),
        });
      }
    }

    // Check new quantity if updating chemical/fertilizer
    const newInventoryId =
      updates.chemicalId ||
      updates.fertilizerId ||
      (updates.category === "chemical_treatment" ? existing.chemicalId : undefined) ||
      (updates.category === "fertilizer" ? existing.fertilizerId : undefined) ||
      (existing.category === "chemical_treatment" ? existing.chemicalId : undefined) ||
      (existing.category === "fertilizer" ? existing.fertilizerId : undefined);

    const newDose = updates.dose ?? existing.dose ?? 0;
    const newArea =
      updates.treatedArea ||
      updates.fertilizedArea ||
      existing.treatedArea ||
      existing.fertilizedArea ||
      0;

    if (newInventoryId && newDose > 0 && newArea > 0) {
      const newInventoryItem = await ctx.db.get(newInventoryId);
      if (!newInventoryItem) {
        throw new Error("Inventory item not found");
      }

      const newQuantity = calculateRequiredQuantity(
        newDose,
        newArea,
        newInventoryItem.unit
      );

      if (newInventoryItem.quantity < newQuantity) {
        throw new Error(
          `Insufficient quantity. Available: ${newInventoryItem.quantity} ${newInventoryItem.unit}, Required: ${newQuantity} ${newInventoryItem.unit}`
        );
      }

      // Deduct new quantity
      await ctx.db.patch(newInventoryId, {
        quantity: newInventoryItem.quantity - newQuantity,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.patch(activityId, {
      ...updates,
      inventoryItemId:
        updates.chemicalId ||
        updates.fertilizerId ||
        existing.inventoryItemId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Delete an activity
 */
export const remove = mutation({
  args: { activityId: v.id("activities") },
  handler: async (ctx, args) => {
    const activity = await ctx.db.get(args.activityId);
    if (!activity) {
      throw new Error("Activity not found");
    }

    // Restore inventory if this activity used inventory
    if (activity.inventoryItemId) {
      const inventoryItem = await ctx.db.get(activity.inventoryItemId);
      if (inventoryItem) {
        const dose = activity.dose || 0;
        const area =
          activity.treatedArea || activity.fertilizedArea || 0;

        if (dose > 0 && area > 0) {
          const quantityToRestore = calculateRequiredQuantity(
            dose,
            area,
            inventoryItem.unit
          );
          await ctx.db.patch(activity.inventoryItemId, {
            quantity: inventoryItem.quantity + quantityToRestore,
            updatedAt: Date.now(),
          });
        }
      }
    }

    await ctx.db.delete(args.activityId);
  },
});

