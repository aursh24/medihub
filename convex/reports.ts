import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "../lib/roles"; // You can mirror this string union here too

export const addByAsha = mutation({
  args: {
    disease: v.string(),
    symptoms: v.array(v.string()),
    village: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can add reports");
    }

    await ctx.db.insert("healthReports", {
      createdBy: identity.subject,
      createdByRole: role,
      ...args,
    });
  },
});

export const getVillageSummary = query({
  args: { village: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";

    // Citizens can only see anonymized summary; ASHA/Admin can see more details
    const reports = await ctx.db
      .query("healthReports")
      .filter(q => q.eq(q.field("village"), args.village))
      .collect();

    if (role === ROLES.CITIZEN) {
      // return aggregated summary
      const byDisease: Record<string, number> = {};
      for (const r of reports) byDisease[r.disease] = (byDisease[r.disease] || 0) + 1;
      return { type: "summary", byDisease };
    }

    // ASHA/Admin: return raw (or semi-raw) data
    return { type: "detailed", reports };
  },
});

export const createDiseaseRecord = mutation({
  args: {
    diseaseName: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    medicalSupplies: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can create disease records");
    }

    await ctx.db.insert("diseaseRecords", {
      createdBy: identity.subject,
      createdByRole: role,
      diseaseName: args.diseaseName,
      imageUrl: args.imageUrl,
      description: args.description,
      medicalSupplies: args.medicalSupplies,
      status: "draft",
      createdAt: new Date().toISOString(),
    });
  },
});

export const getDiseaseRecords = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can view disease records");
    }

    const records = await ctx.db
      .query("diseaseRecords")
      .filter(q => q.eq(q.field("createdBy"), identity.subject))
      .collect();

    // Sort by creation date (newest first)
    return records.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});

export const updateDiseaseRecord = mutation({
  args: {
    id: v.id("diseaseRecords"),
    diseaseName: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    medicalSupplies: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can update disease records");
    }

    const record = await ctx.db.get(args.id);
    if (!record) {
      throw new Error("Record not found");
    }

    if (record.createdBy !== identity.subject && role !== ROLES.ADMIN) {
      throw new Error("You can only update your own records");
    }

    await ctx.db.patch(args.id, {
      diseaseName: args.diseaseName,
      imageUrl: args.imageUrl,
      description: args.description,
      medicalSupplies: args.medicalSupplies,
      updatedAt: new Date().toISOString(),
    });
  },
});

export const registerDiseaseRecord = mutation({
  args: {
    id: v.id("diseaseRecords"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can register disease records");
    }

    const record = await ctx.db.get(args.id);
    if (!record) {
      throw new Error("Record not found");
    }

    if (record.createdBy !== identity.subject && role !== ROLES.ADMIN) {
      throw new Error("You can only register your own records");
    }

    await ctx.db.patch(args.id, {
      status: "registered",
      updatedAt: new Date().toISOString(),
    });
  },
});

export const getRegisteredRecords = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can view registered records");
    }

    const records = await ctx.db
      .query("diseaseRecords")
      .filter(q => q.eq(q.field("status"), "registered"))
      .collect();

    // Sort by update/creation date (newest first)
    return records.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  },
});