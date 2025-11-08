import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  messages: defineTable({
    author: v.string(),
    text: v.string(),
  }),
  healthReports: defineTable({
    createdBy: v.string(),
    createdByRole: v.string(),
    disease: v.string(),
    symptoms: v.array(v.string()),
    village: v.string(),
    date: v.string(),
  }),
  diseaseRecords: defineTable({
    createdBy: v.string(),
    createdByRole: v.string(),
    diseaseName: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    medicalSupplies: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
    })),
    status: v.union(v.literal("draft"), v.literal("registered")),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }),
});
