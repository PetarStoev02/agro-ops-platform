"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { TEMPLATE_BASE64 } from "./templateBase64Constant";

/**
 * Generate BABH Word document from template
 */
export const generateBABHDocument = action({
  args: {
    clerkOrgId: v.string(),
    seasonId: v.optional(v.id("seasons")),
  },
  handler: async (ctx, args) => {
    // Fetch organization data
    const org = await ctx.runQuery(api.organizations.getByClerkOrgId, {
      clerkOrgId: args.clerkOrgId,
    });

    if (!org) {
      throw new Error("Organization not found");
    }

    // Fetch all fields for the organization
    const fields = await ctx.runQuery(api.fields.getByOrganization, {
      organizationId: org._id,
    });

    // Fetch all activities for the organization
    const activities = await ctx.runQuery(api.activities.getByOrganization, {
      organizationId: org._id,
    });

    // Group activities by field and category
    const activitiesByField = new Map<string, {
      chemicalTreatments: typeof activities;
      inspections: typeof activities;
      fertilizers: typeof activities;
    }>();

    for (const activity of activities) {
      const fieldIdStr = activity.fieldId || "no-field";
      if (!activitiesByField.has(fieldIdStr)) {
        activitiesByField.set(fieldIdStr, {
          chemicalTreatments: [],
          inspections: [],
          fertilizers: [],
        });
      }

      const fieldActivities = activitiesByField.get(fieldIdStr)!;
      if (activity.category === "chemical_treatment") {
        fieldActivities.chemicalTreatments.push(activity);
      } else if (activity.category === "field_inspection") {
        fieldActivities.inspections.push(activity);
      } else if (activity.category === "fertilizer") {
        fieldActivities.fertilizers.push(activity);
      }
    }

    // Prepare data for template
    // Note: docxtemplater uses {variable} syntax in the template
    // For loops, use {#array}...{/array} syntax
    // 
    // Template variables needed on first page (where dots are):
    // - {municipality} - Община
    // - {settlement} - Населено място  
    // - {farm_name} - Земеделски производител
    // - {address} - Адрес
    // - {agriculture_directorate} - Областна дирекция "Земеделие" гр.
    // - {ekatte} - ЕКАТТЕ на регистрация
    // - {odbh} - Областна дирекция по безопасност на храните (ОДБХ) гр.
    const templateData = {
      // Organization data - Page 1 fields (where dots are)
      municipality: org.municipality || "",
      settlement: org.settlement || "",
      farm_name: org.name || "",
      address: org.address || "",
      agriculture_directorate: org.agricultureDirectorate || "",
      ekatte: org.ekatteRegistration || "",
      odbh: org.regionalFoodSafetyDirectorate || "",
      
      // Current date
      current_date: new Date().toLocaleDateString("bg-BG"),

      // Fields data - we'll process each field
      fields: fields.map((field) => {
        const fieldIdStr = field._id;
        const fieldActivities = activitiesByField.get(fieldIdStr) || {
          chemicalTreatments: [],
          inspections: [],
          fertilizers: [],
        };

        return {
          name: field.name || "",
          bzs_number: field.bzsNumber || "",
          populated_place: field.populatedPlace || "",
          land_area: field.landArea || "",
          locality: field.locality || "",
          area: field.area ? field.area.toString() : "0",
          sowing_date: field.sowingDate
            ? new Date(field.sowingDate).toLocaleDateString("bg-BG")
            : "",
          crop_type: field.cropType || "",
          // Placeholders for missing data - these will remain as placeholders in the document
          variety: "",
          predecessor: "",
          warehouse: "",
          cadastral_number: field.bzsNumber || "",
          field_number: field.bzsNumber || field.name || "",

          // Chemical treatments
          chemical_treatments: fieldActivities.chemicalTreatments.length > 0 
            ? fieldActivities.chemicalTreatments.map((act, idx) => ({
                serial_number: idx + 1,
                date: new Date(act.date).toLocaleDateString("bg-BG"),
                pest: act.infestationType || "",
                product_name: act.chemicalName || "",
                dose: act.dose ? act.dose.toString() : "",
                dose_unit: "л/дка", // Default unit
                treated_area: act.treatedArea ? act.treatedArea.toString() : "",
                equipment: act.equipment || "",
                quarantine_period: act.quarantinePeriod ? act.quarantinePeriod.toString() : "0",
                earliest_harvest_date: act.quarantinePeriod && act.date 
                  ? new Date(act.date + act.quarantinePeriod * 24 * 60 * 60 * 1000).toLocaleDateString("bg-BG")
                  : "",
                applicator_name: "",
                applicator_certificate: "",
                agronomist_name: "",
                agronomist_certificate: "",
              }))
            : [],

          // Field inspections
          inspections: fieldActivities.inspections.length > 0
            ? fieldActivities.inspections.map((act, idx) => ({
                serial_number: idx + 1,
                date: new Date(act.date).toLocaleDateString("bg-BG"),
                phenological_phase: act.phenologicalPhase || "",
                bbch_code: "",
                disease: act.damageType || "",
                surveyed_area: act.surveyedArea ? act.surveyedArea.toString() : "",
                attacked_area: act.attackedArea ? act.attackedArea.toString() : "",
                attack_degree: act.attackDensity || "",
                pest: act.damage || "",
                development_stages: "",
                density: act.attackDensity || "",
              }))
            : [],

          // Fertilizers
          fertilizers: fieldActivities.fertilizers.length > 0
            ? fieldActivities.fertilizers.map((act, idx) => ({
                serial_number: idx + 1,
                date: new Date(act.date).toLocaleDateString("bg-BG"),
                product_name: act.fertilizerName || "",
                composition: "",
                quantity: act.quantity || "",
                fertilized_area: act.fertilizedArea ? act.fertilizedArea.toString() : "",
              }))
            : [],
        };
      }),

      // Global placeholders for missing data - leave empty so they can be filled manually
      // These are fields that don't exist in the database yet
      variety: "",
      predecessor: "",
      warehouse: "",
      bbch_code: "",
      applicator_name: "",
      applicator_certificate: "",
      agronomist_name: "",
      agronomist_certificate: "",
      inspector_name: "",
      inspector_position: "",
      laboratory_name: "",
      active_ingredient: "",
      dose_unit: "л/дка",
      earliest_harvest_date: "",
      analysis_result: "",
      findings_recommendations: "",
    };

    // Load Word template from embedded base64
    try {
      // Convert base64 to buffer
      const templateBuffer = Buffer.from(TEMPLATE_BASE64, "base64");
      const zip = new PizZip(templateBuffer);
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      // Set the template data
      doc.setData(templateData);

      // Render the document
      try {
        doc.render();
        
        // Log for debugging (remove in production)
        console.log("Template data keys:", Object.keys(templateData));
        console.log("Fields count:", templateData.fields.length);
        if (templateData.fields.length > 0) {
          console.log("First field data:", JSON.stringify(templateData.fields[0], null, 2));
        }
      } catch (error) {
        // Handle rendering errors
        if (error instanceof Error) {
          const e = error as any;
          if (e.properties && e.properties.errors instanceof Array) {
            const errorMessages = e.properties.errors
              .map((error: any) => {
                return error.properties
                  ? `${error.properties.key} - ${error.properties.message}`
                  : error.message;
              })
              .join(", ");
            throw new Error(`Template rendering error: ${errorMessages}`);
          }
        }
        throw error;
      }

      // Generate the document
      const buf = doc.getZip().generate({
        type: "nodebuffer",
        compression: "DEFLATE",
      });

      // Convert to base64
      const base64 = Buffer.from(buf).toString("base64");

      return {
        document: base64,
        filename: `BABH_${org.name}_${new Date().toISOString().split("T")[0]}.docx`,
      };
    } catch (error) {
      console.error("Error generating BABH document:", error);
      throw new Error(
        `Failed to generate BABH document: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

