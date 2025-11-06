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
    // Onboarding fields
    municipality: v.optional(v.string()), // Община
    settlement: v.optional(v.string()), // Населено място
    address: v.optional(v.string()), // Адрес
    agricultureDirectorate: v.optional(v.string()), // Дирекция "Земеделие"
    regionalFoodSafetyDirectorate: v.optional(v.string()), // ОДБХ
    ekatteRegistration: v.optional(v.string()), // ЕКАТЕ на регистрация (5 digits)
    isOnboarded: v.optional(v.boolean()), // Track onboarding completion status
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_org_id", ["clerkOrgId"])
    .index("by_slug", ["slug"]),

  // Fields (agricultural fields)
  fields: defineTable({
    organizationId: v.id("organizations"),
    name: v.string(), // Field name (Име на полето)
    bzsNumber: v.string(), // BZS Number (НОМЕР по БЗС) - format "00000-000"
    populatedPlace: v.string(), // Populated place (Населено място)
    landArea: v.string(), // Land/Cadastral area (Землище)
    locality: v.string(), // Locality (Местност)
    area: v.number(), // Area in decares (Площ (дка.))
    sowingDate: v.optional(v.number()), // Optional sowing date (Дата на засяване)
    cropType: v.optional(v.string()), // Crop type (Култура)
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
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
    year: v.string(), // Year identifier (e.g., "2024 / 2025")
    startDate: v.number(),
    endDate: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_active", ["isActive"])
    .index("by_year", ["year"]),

  // Activities (farming activities)
  activities: defineTable({
    organizationId: v.id("organizations"),
    fieldId: v.optional(v.id("fields")),
    type: v.string(), // e.g., "planting", "harvesting", "fertilizing" (kept for backward compatibility)
    category: v.union(
      v.literal("chemical_treatment"),
      v.literal("field_inspection"),
      v.literal("fertilizer"),
      v.literal("farm_activity")
    ),
    description: v.optional(v.string()),
    date: v.number(),
    userId: v.string(), // Clerk user ID
    // Category-specific fields
    // Chemical Treatment fields
    chemicalId: v.optional(v.id("inventory")), // Reference to inventory item
    chemicalName: v.optional(v.string()),
    infestationType: v.optional(v.string()),
    dose: v.optional(v.number()), // Dose per decare (л/дка)
    quarantinePeriod: v.optional(v.number()), // Карантитнен срок (0 = none)
    treatedArea: v.optional(v.number()), // Treated area in decares
    equipment: v.optional(v.string()),
    // Field Inspection fields
    startDate: v.optional(v.number()),
    surveyedArea: v.optional(v.number()), // Surveyed area in decares
    attackedArea: v.optional(v.number()), // Attacked area in decares
    damage: v.optional(v.string()),
    damageType: v.optional(v.string()),
    attackDensity: v.optional(v.string()), // Density/degree of attack
    phenologicalPhase: v.optional(v.string()),
    // Fertilizer fields
    fertilizerId: v.optional(v.id("inventory")), // Reference to inventory item
    fertilizerName: v.optional(v.string()),
    fertilizedArea: v.optional(v.number()), // Fertilized area in decares
    fertilizerType: v.optional(v.string()),
    // Farm Activity fields
    endDate: v.optional(v.number()),
    activityType: v.optional(v.string()), // Type of farm activity
    materialType: v.optional(v.string()), // Type of material used (seeds, fertilizers, PPP)
    quantity: v.optional(v.string()), // Quantity used (e.g., "10 kg/dka")
    // Common inventory reference
    inventoryItemId: v.optional(v.id("inventory")), // Generic inventory reference
    metadata: v.optional(v.any()), // Kept for backward compatibility
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_field", ["fieldId"])
    .index("by_date", ["date"])
    .index("by_category", ["category"]),

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
    category: v.string(), // e.g., "seeds", "fertilizer", "equipment", "chemical"
    quantity: v.number(),
    unit: v.string(), // e.g., "kg", "liters", "pieces"
    location: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    cropTypes: v.optional(v.array(v.string())), // Applicable crop types for chemicals/fertilizers
    applicableFor: v.optional(v.array(v.string())), // Activity types this item can be used for
    // Fertilizer-specific fields
    contents: v.optional(v.string()), // Free text description of fertilizer contents
    nitrogenContent: v.optional(v.number()), // Nitrogen percentage for fertilizers
    fertilizerType: v.optional(v.string()), // "гранулиран" or "листен"
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

