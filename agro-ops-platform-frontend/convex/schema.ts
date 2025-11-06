import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema for the Agro Ops Platform
 * 
 * This schema defines the data structure for the agricultural operations platform.
 * Tables are organized by domain: organizations, fields, activities, etc.
 */
export default defineSchema({
  // Organizations/Companies
  organizations: defineTable({
    clerkOrgId: v.string(), // Clerk organization ID
    name: v.string(),
    slug: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_org_id", ["clerkOrgId"])
    .index("by_slug", ["slug"]),

  // Fields (agricultural fields)
  fields: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    area: v.number(), // in hectares or square meters
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    cropType: v.optional(v.string()),
    seasonId: v.optional(v.id("seasons")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_season", ["seasonId"]),

  // Seasons
  seasons: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_active", ["isActive"]),

  // Activities (farming activities)
  activities: defineTable({
    organizationId: v.id("organizations"),
    fieldId: v.optional(v.id("fields")),
    type: v.string(), // e.g., "planting", "harvesting", "fertilizing"
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.string(), // Clerk user ID
    metadata: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_field", ["fieldId"])
    .index("by_date", ["date"]),

  // Diaries (farming diaries/logs)
  diaries: defineTable({
    organizationId: v.id("organizations"),
    fieldId: v.optional(v.id("fields")),
    title: v.string(),
    content: v.string(),
    date: v.number(),
    userId: v.string(), // Clerk user ID
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_field", ["fieldId"])
    .index("by_date", ["date"]),

  // Warehouse/Inventory
  inventory: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(),
    category: v.string(), // e.g., "seeds", "fertilizer", "equipment"
    quantity: v.number(),
    unit: v.string(), // e.g., "kg", "liters", "pieces"
    location: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_category", ["category"]),

  // Reports
  reports: defineTable({
    organizationId: v.id("organizations"),
    type: v.string(), // e.g., "field_report", "financial_report"
    title: v.string(),
    content: v.any(), // Flexible structure for different report types
    generatedAt: v.number(),
    generatedBy: v.string(), // Clerk user ID
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_type", ["type"]),

  // Notifications
  notifications: defineTable({
    organizationId: v.id("organizations"),
    userId: v.string(), // Clerk user ID
    title: v.string(),
    message: v.string(),
    type: v.string(), // e.g., "info", "warning", "error"
    read: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_read", ["read"]),

  // Credits/Financial records
  credits: defineTable({
    organizationId: v.id("organizations"),
    amount: v.number(),
    currency: v.string(),
    type: v.string(), // e.g., "income", "expense"
    category: v.optional(v.string()),
    description: v.string(),
    date: v.number(),
    userId: v.string(), // Clerk user ID
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_date", ["date"])
    .index("by_type", ["type"]),

  // Audits
  audits: defineTable({
    organizationId: v.id("organizations"),
    type: v.string(), // e.g., "compliance", "quality", "safety"
    title: v.string(),
    description: v.string(),
    status: v.string(), // e.g., "pending", "completed", "failed"
    date: v.number(),
    userId: v.string(), // Clerk user ID
    findings: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_date", ["date"]),
});

