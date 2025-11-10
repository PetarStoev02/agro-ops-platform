import { query, action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Get all allowed chemicals
 */
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("allowed_chemicals")
      .order("asc")
      .collect();
  },
});

/**
 * Get chemicals by name (exact match)
 */
export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("allowed_chemicals")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .collect();
  },
});

/**
 * Get only primary entries (for dropdown)
 */
export const getPrimary = query({
  args: {},
  handler: async (ctx) => {
    try {
      const all = await ctx.db
        .query("allowed_chemicals")
        .collect();
      
      return all.filter((chemical) => chemical.isPrimary);
    } catch (error) {
      // Return empty array if table doesn't exist yet
      console.error("Error fetching allowed chemicals:", error);
      return [];
    }
  },
});

/**
 * Search chemicals by name (case-insensitive)
 */
export const search = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("allowed_chemicals")
      .collect();
    
    const searchLower = args.query.toLowerCase();
    return all.filter((chemical) =>
      chemical.name.toLowerCase().includes(searchLower)
    );
  },
});

/**
 * Import chemicals from Excel file
 * 
 * @param fileData - Base64 encoded Excel file data
 * Expected columns: Name, Dose, Danger Type (exact column names may vary)
 */
export const importFromExcel = action({
  args: {
    fileData: v.string(), // Base64 encoded file data
  },
  handler: async (ctx, args) => {
    // Dynamically import xlsx to avoid bundling issues
    const XLSX = await import("xlsx");
    
    // Convert base64 to ArrayBuffer
    const binaryString = atob(args.fileData);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const arrayBuffer = bytes.buffer;

    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as unknown[][];

    // Find header row (first row with data)
    let headerRowIndex = 0;
    let nameColIndex = -1;
    let doseColIndex = -1;
    let dangerColIndex = -1;

    // Try to find column indices
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i] as string[];
      const rowLower = row.map((cell) => String(cell).toLowerCase());

      // Look for common column name patterns
      nameColIndex = rowLower.findIndex((cell) =>
        cell.includes("name") || cell.includes("име") || cell.includes("наименование")
      );
      doseColIndex = rowLower.findIndex((cell) =>
        cell.includes("dose") || cell.includes("доза") || cell.includes("дозировка")
      );
      dangerColIndex = rowLower.findIndex((cell) =>
        cell.includes("danger") ||
        cell.includes("опасност") ||
        cell.includes("клас") ||
        cell.includes("class")
      );

      if (nameColIndex >= 0 && doseColIndex >= 0 && dangerColIndex >= 0) {
        headerRowIndex = i;
        break;
      }
    }

    if (nameColIndex < 0 || doseColIndex < 0 || dangerColIndex < 0) {
      throw new Error(
        "Could not find required columns (Name, Dose, Danger Type) in Excel file"
      );
    }

    // Parse data rows
    const chemicals: Array<{
      name: string;
      dose: string;
      dangerType: string;
    }> = [];

    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i] as string[];
      const name = String(row[nameColIndex] || "").trim();
      const dose = String(row[doseColIndex] || "").trim();
      const dangerType = String(row[dangerColIndex] || "").trim();

      // Skip empty rows
      if (!name && !dose && !dangerType) {
        continue;
      }

      if (name) {
        chemicals.push({ name, dose, dangerType });
      }
    }

    // Group by name to handle duplicates
    const grouped = new Map<string, Array<{ dose: string; dangerType: string }>>();

    for (const chemical of chemicals) {
      const nameLower = chemical.name.toLowerCase();
      if (!grouped.has(nameLower)) {
        grouped.set(nameLower, []);
      }
      grouped.get(nameLower)!.push({
        dose: chemical.dose,
        dangerType: chemical.dangerType,
      });
    }

    // Insert into database
    const now = Date.now();
    let inserted = 0;
    let duplicates = 0;

    for (const [nameLower, entries] of grouped.entries()) {
      // Get the original name (first occurrence)
      const originalName = chemicals.find(
        (c) => c.name.toLowerCase() === nameLower
      )?.name || nameLower;

      // Collect all unique danger types for this name
      const dangerTypesSet = new Set<string>();
      for (const entry of entries) {
        if (entry.dangerType) {
          dangerTypesSet.add(entry.dangerType);
        }
      }
      const dangerTypes = Array.from(dangerTypesSet);

      // Use the first dose found (or combine if needed)
      const firstDose = entries[0]?.dose || "";

      // Mark first entry as primary
      await ctx.runMutation(api.chemicals.insertChemical, {
        name: originalName,
        dose: firstDose,
        dangerTypes,
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
      });
      inserted++;

      // If there are multiple entries with different danger types, create additional entries
      if (entries.length > 1) {
        for (let i = 1; i < entries.length; i++) {
          const entry = entries[i];
          const entryDangerTypes = entry.dangerType
            ? [entry.dangerType]
            : dangerTypes;

          // Only create additional entry if danger type is different
          if (entry.dangerType && !dangerTypes.includes(entry.dangerType)) {
            await ctx.runMutation(api.chemicals.insertChemical, {
              name: originalName,
              dose: entry.dose || firstDose,
              dangerTypes: entryDangerTypes,
              isPrimary: false,
              createdAt: now,
              updatedAt: now,
            });
            duplicates++;
          }
        }
      }
    }

    return {
      success: true,
      inserted: inserted + duplicates,
      unique: inserted,
      duplicates,
    };
  },
});

/**
 * Add a single chemical (handles duplicate logic automatically)
 */
export const addChemical = mutation({
  args: {
    name: v.string(),
    dose: v.string(),
    dangerTypes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const name = args.name.trim();
    const dose = args.dose.trim();
    const dangerTypes = args.dangerTypes.filter(Boolean);

    if (!name || !dose || dangerTypes.length === 0) {
      throw new Error("Name, dose, and at least one danger type are required");
    }

    // Check if chemical with same name exists
    const existing = await ctx.db
      .query("allowed_chemicals")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();

    if (!existing) {
      // No existing chemical, insert as primary
      return await ctx.db.insert("allowed_chemicals", {
        name,
        dose,
        dangerTypes,
        isPrimary: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Check if danger types are different
    const existingDangerTypesSet = new Set(existing.dangerTypes);
    const newDangerTypesSet = new Set(dangerTypes);
    
    // Check if all new danger types already exist
    const allExist = Array.from(newDangerTypesSet).every((dt) =>
      existingDangerTypesSet.has(dt)
    );
    
    // Check if all existing danger types are in new ones
    const allExistingInNew = Array.from(existingDangerTypesSet).every((dt) =>
      newDangerTypesSet.has(dt)
    );

    if (allExist && allExistingInNew) {
      // Same danger types, skip (duplicate)
      throw new Error(
        `Chemical "${name}" with the same danger types already exists`
      );
    }

    // Different danger types, insert as non-primary
    return await ctx.db.insert("allowed_chemicals", {
      name,
      dose,
      dangerTypes,
      isPrimary: false,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Internal mutation to insert a chemical (used by import action)
 */
export const insertChemical = mutation({
  args: {
    name: v.string(),
    dose: v.string(),
    dangerTypes: v.array(v.string()),
    isPrimary: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("allowed_chemicals", {
      name: args.name,
      dose: args.dose,
      dangerTypes: args.dangerTypes,
      isPrimary: args.isPrimary,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  },
});

/**
 * Insert a batch of chemicals (for client-side batch import)
 */
export const insertBatch = mutation({
  args: {
    chemicals: v.array(
      v.object({
        name: v.string(),
        dose: v.string(),
        dangerTypes: v.array(v.string()),
        isPrimary: v.boolean(),
        createdAt: v.number(),
        updatedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let inserted = 0;
    let skipped = 0;

    for (const chemical of args.chemicals) {
      // Check if chemical with same name already exists
      const existing = await ctx.db
        .query("allowed_chemicals")
        .withIndex("by_name", (q) => q.eq("name", chemical.name))
        .first();

      if (!existing) {
        await ctx.db.insert("allowed_chemicals", {
          name: chemical.name,
          dose: chemical.dose,
          dangerTypes: chemical.dangerTypes,
          isPrimary: chemical.isPrimary,
          createdAt: chemical.createdAt || now,
          updatedAt: chemical.updatedAt || now,
        });
        inserted++;
      } else {
        skipped++;
      }
    }

    return {
      inserted,
      skipped,
      total: args.chemicals.length,
    };
  },
});

