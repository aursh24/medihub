import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  healthReports: defineTable({
    createdBy: v.string(),
    createdByRole: v.string(),
    disease: v.string(),
    description: v.string(),
    symptoms: v.array(v.string()),
    village: v.string(),
    location: v.string(),
    date: v.string(),
    image: v.optional(v.string()),
    itemName: v.string(),
    itemQuantity: v.number(),
    createdAt: v.string(),
  }),
  diseaseRecords: defineTable({
    createdBy: v.string(),
    createdByRole: v.string(),
    diseaseName: v.string(),
    description: v.string(),
    imageUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    medicalSupplies: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
    })),
    status: v.string(),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }),
});
