import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get dashboard statistics for an organization
 * Returns counts for inventory products, active fields, and unread notifications
 */
export const getDashboardStats = query({
  args: { 
    organizationId: v.id("organizations"),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get total inventory count
    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    
    const totalProducts = inventory.length;
    const totalProductQuantity = inventory.reduce((sum, item) => sum + item.quantity, 0);

    // Get active fields count
    const fields = await ctx.db
      .query("fields")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();
    
    const activeFields = fields.length;
    const totalArea = fields.reduce((sum, field) => sum + field.area, 0);

    // Get unread notifications count (if userId provided)
    let unreadNotifications = 0;
    if (args.userId) {
      const userId = args.userId;
      const notifications = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .filter((q) => q.eq(q.field("read"), false))
        .collect();
      unreadNotifications = notifications.length;
    }

    // Get recent activities count (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.gte(q.field("date"), sevenDaysAgo))
      .collect();

    return {
      totalProducts,
      totalProductQuantity,
      activeFields,
      totalArea,
      unreadNotifications,
      recentActivitiesCount: recentActivities.length,
    };
  },
});

/**
 * Get fields breakdown by season with crop type distribution
 * Returns count, total area, and crop types for fields
 */
export const getFieldsBySeasonWithBreakdown = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Get all fields for the organization
    const fields = await ctx.db
      .query("fields")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    // Get all seasons
    const seasons = await ctx.db
      .query("seasons")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    // Create a map of season data
    const seasonMap = new Map(seasons.map(s => [s._id, s]));

    // Group fields by season
    // Use Map to avoid non-ASCII characters in object keys
    const fieldsBySeason = new Map<string, {
      seasonName: string;
      year: number;
      count: number;
      totalArea: number;
      cropTypes: Map<string, { count: number; area: number }>;
    }>();

    // Group by crop type (overall) - use Map to avoid non-ASCII keys
    const cropTypeBreakdown = new Map<string, { count: number; area: number }>();

    fields.forEach(field => {
      const seasonKey = field.seasonId || "no-season";
      const cropType = field.cropType || "Unknown";
      
      // Initialize season group if needed
      if (!fieldsBySeason.has(seasonKey)) {
        const season = field.seasonId ? seasonMap.get(field.seasonId) : null;
        fieldsBySeason.set(seasonKey, {
          seasonName: season?.name || "No Season",
          year: season ? new Date(season.startDate).getFullYear() : new Date().getFullYear(),
          count: 0,
          totalArea: 0,
          cropTypes: new Map(),
        });
      }

      const seasonData = fieldsBySeason.get(seasonKey)!;

      // Update season statistics
      seasonData.count++;
      seasonData.totalArea += field.area;

      // Update crop type for this season
      if (!seasonData.cropTypes.has(cropType)) {
        seasonData.cropTypes.set(cropType, { count: 0, area: 0 });
      }
      const cropTypeData = seasonData.cropTypes.get(cropType)!;
      cropTypeData.count++;
      cropTypeData.area += field.area;

      // Update overall crop type breakdown
      if (!cropTypeBreakdown.has(cropType)) {
        cropTypeBreakdown.set(cropType, { count: 0, area: 0 });
      }
      const overallCropTypeData = cropTypeBreakdown.get(cropType)!;
      overallCropTypeData.count++;
      overallCropTypeData.area += field.area;
    });

    return {
      bySeason: Array.from(fieldsBySeason.entries()).map(([seasonId, data]) => ({
        seasonId,
        seasonName: data.seasonName,
        year: data.year,
        count: data.count,
        totalArea: data.totalArea,
        cropTypes: Array.from(data.cropTypes.entries()).map(([cropType, stats]) => ({
          cropType,
          ...stats,
        })),
      })),
      byCropType: Array.from(cropTypeBreakdown.entries()).map(([cropType, data]) => ({
        cropType,
        ...data,
      })),
      totalFields: fields.length,
      totalArea: fields.reduce((sum, f) => sum + f.area, 0),
    };
  },
});

/**
 * Get recent activities with user and field information
 */
export const getRecentActivities = query({
  args: { 
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .order("desc")
      .take(limit);

    // Fetch field names and IDs for activities that have fieldId
    const enrichedActivities = await Promise.all(
      activities.map(async (activity) => {
        let fieldName = null;
        let fieldId = null;
        if (activity.fieldId) {
          const field = await ctx.db.get(activity.fieldId);
          fieldName = field?.name || null;
          fieldId = activity.fieldId;
        }
        return {
          ...activity,
          fieldName,
          fieldId,
        };
      })
    );

    return enrichedActivities;
  },
});

/**
 * Get low stock inventory items
 * Returns items with quantity below threshold or near expiry
 */
export const getLowStockInventory = query({
  args: { 
    organizationId: v.id("organizations"),
    quantityThreshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const threshold = args.quantityThreshold || 10;
    const thirtyDaysFromNow = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const inventory = await ctx.db
      .query("inventory")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .collect();

    // Filter low stock and near expiry items
    const lowStockItems = inventory.filter(item => item.quantity < threshold);
    const nearExpiryItems = inventory.filter(
      item => item.expiryDate && item.expiryDate < thirtyDaysFromNow
    );

    // Combine and deduplicate
    const alertItems = new Map();
    
    lowStockItems.forEach(item => {
      alertItems.set(item._id, {
        ...item,
        alertType: "low_stock" as const,
      });
    });

    nearExpiryItems.forEach(item => {
      if (alertItems.has(item._id)) {
        alertItems.set(item._id, {
          ...item,
          alertType: "both" as const,
        });
      } else {
        alertItems.set(item._id, {
          ...item,
          alertType: "near_expiry" as const,
        });
      }
    });

    return Array.from(alertItems.values());
  },
});

/**
 * Get financial summary from credits
 * Returns total income and expenses for the current active season
 */
export const getFinancialSummary = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Get active season
    const activeSeason = await ctx.db
      .query("seasons")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    let startDate = 0;
    let endDate = Date.now();

    if (activeSeason) {
      startDate = activeSeason.startDate;
      endDate = activeSeason.endDate;
    } else {
      // If no active season, use current year
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1).getTime();
      endDate = new Date(now.getFullYear(), 11, 31).getTime();
    }

    // Get all credits for the period
    const credits = await ctx.db
      .query("credits")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => 
        q.and(
          q.gte(q.field("date"), startDate),
          q.lte(q.field("date"), endDate)
        )
      )
      .collect();

    // Calculate totals
    const income = credits
      .filter(c => c.type === "income")
      .reduce((sum, c) => sum + c.amount, 0);

    const expenses = credits
      .filter(c => c.type === "expense")
      .reduce((sum, c) => sum + c.amount, 0);

    const balance = income - expenses;

    // Get currency (assume first credit's currency or default to USD)
    const currency = credits[0]?.currency || "USD";

    return {
      income,
      expenses,
      balance,
      currency,
      period: {
        startDate,
        endDate,
        seasonName: activeSeason?.name || "Current Year",
      },
      transactionCount: credits.length,
    };
  },
});

/**
 * Get count of pending audits
 */
export const getPendingAudits = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    const pendingAudits = await ctx.db
      .query("audits")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return {
      count: pendingAudits.length,
      audits: pendingAudits.slice(0, 5), // Return first 5 for quick display
    };
  },
});

/**
 * Get member activity counts for segmentation
 * Returns activity count per user for the current active season
 */
export const getMemberActivityCounts = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, args) => {
    // Get active season
    const activeSeason = await ctx.db
      .query("seasons")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    let startDate = 0;
    if (activeSeason) {
      startDate = activeSeason.startDate;
    } else {
      // If no active season, use current year
      const now = new Date();
      startDate = new Date(now.getFullYear(), 0, 1).getTime();
    }

    // Get all activities since season start
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", args.organizationId)
      )
      .filter((q) => q.gte(q.field("date"), startDate))
      .collect();

    // Count activities per user
    const activityCountByUser: Record<string, number> = {};
    
    activities.forEach(activity => {
      if (!activityCountByUser[activity.userId]) {
        activityCountByUser[activity.userId] = 0;
      }
      activityCountByUser[activity.userId]++;
    });

    return {
      activityCountByUser,
      totalActivities: activities.length,
    };
  },
});

