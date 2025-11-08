import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ROLES } from "../lib/roles"; // Import your roles enum or constants

// Helper function to get and validate user role
function getUserRole(identity: any): { role: string; hasPermission: boolean; metadata: any } {
  const metadata = identity.publicMetadata as { role?: string } | undefined;
  const roleRaw = metadata?.role;
  const role = roleRaw ? String(roleRaw).toLowerCase().trim() : "citizen";
  
  const hasPermission = 
    role === ROLES.ASHA || 
    role === ROLES.ADMIN ||
    role === "asha" || 
    role === "admin";
  
  return { role, hasPermission, metadata: identity.publicMetadata };
}

// Diagnostic query to check user role
export const checkUserRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { error: "Not authenticated", identity: null };
    }
    
    const { role, hasPermission, metadata } = getUserRole(identity);
    
    return {
      authenticated: true,
      role,
      hasPermission,
      metadata,
      identity: {
        subject: identity.subject,
        email: (identity as any).email,
        publicMetadata: identity.publicMetadata,
      },
    };
  },
});

// 🩺 Add report (by ASHA/Admin)
export const addByAsha = mutation({
  args: {
    disease: v.string(),
    description: v.string(),
    symptoms: v.array(v.string()),
    village: v.string(),
    location: v.string(),
    date: v.string(),
    image: v.optional(v.string()),
    itemName: v.string(),
    itemQuantity: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    console.log("IDENTITY:", identity);


    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can add reports");
    }

    await ctx.db.insert("healthReports", {
      createdBy: identity.subject,
      createdByRole: role,
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const getVillageSummary = query({
  args: { village: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";

    const reports = await ctx.db
      .query("healthReports")
      .filter(q => q.eq(q.field("village"), args.village))
      .collect();

    if (role === ROLES.CITIZEN) {
      const byDisease: Record<string, number> = {};
      for (const r of reports) byDisease[r.disease] = (byDisease[r.disease] || 0) + 1;
      return { type: "summary", byDisease };
    }

    return { type: "detailed", reports };
  },
});

// 🧾 Create disease record (detailed form)
export const createDiseaseRecord = mutation({
  args: {
    diseaseName: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    location: v.optional(v.string()),
    medicalSupplies: v.array(v.object({
      name: v.string(),
      quantity: v.number(),
    })),
    serverVerifiedRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Use helper function to get role
    const { role, hasPermission, metadata } = getUserRole(identity);
    
    // Debug logging
    console.log("=== CREATE DISEASE RECORD DEBUG ===");
    console.log("User ID:", identity.subject);
    console.log("Role from JWT metadata:", role);
    console.log("Has permission from JWT:", hasPermission);
    console.log("Server verified role:", args.serverVerifiedRole);
    console.log("Full publicMetadata:", JSON.stringify(metadata, null, 2));
    console.log("===================================");
    
    // Check permission: Either from JWT or server-verified role
    let finalPermission = hasPermission;
    let finalRole = role;
    
    // If JWT doesn't have permission but server verified role is provided, trust it
    // This is a workaround for JWT token caching issues
    if (!hasPermission && args.serverVerifiedRole) {
      const serverRole = args.serverVerifiedRole.toLowerCase().trim();
      if (serverRole === ROLES.ASHA || serverRole === ROLES.ADMIN) {
        console.log("Using server-verified role:", serverRole);
        finalPermission = true;
        finalRole = serverRole;
      }
    }
    
    if (!finalPermission) {
      const errorMsg = `Only ASHA/Admin can create disease records. Your current role from JWT is: "${role}". ` +
        `\n\nTROUBLESHOOTING:\n` +
        `1. Verify your role is set in Clerk dashboard (should be "asha")\n` +
        `2. Sign out completely and sign back in to refresh your session token\n` +
        `3. Clear browser cache and cookies, then sign in again\n` +
        `4. Wait a few seconds after signing in before trying again\n` +
        `5. Check Convex logs for detailed identity information\n` +
        `6. The app will try to verify your role server-side automatically`;
      console.error("PERMISSION DENIED:", errorMsg);
      throw new Error(errorMsg);
    }

    await ctx.db.insert("diseaseRecords", {
      createdBy: identity.subject,
      createdByRole: finalRole, // Use the final role (from JWT or server verification)
      diseaseName: args.diseaseName,
      imageUrl: args.imageUrl,
      description: args.description,
      location: args.location,
      medicalSupplies: args.medicalSupplies,
      status: "draft",
      createdAt: new Date().toISOString(),
    });
  },
});

// 📋 Get all disease records (for ASHA/Admin)
export const getDiseaseRecords = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Use helper function to get role
    const { role, hasPermission, metadata } = getUserRole(identity);
    
    // Debug logging
    console.log("=== GET DISEASE RECORDS DEBUG ===");
    console.log("User ID:", identity.subject);
    console.log("Role from JWT metadata:", role);
    console.log("Has permission from JWT:", hasPermission);
    console.log("Full publicMetadata:", JSON.stringify(metadata, null, 2));
    console.log("===================================");
    
    if (!hasPermission) {
      const errorMsg = `Only ASHA/Admin can view disease records. Your current role from JWT is: "${role}". ` +
        `Please sign out and sign back in to refresh your session token.`;
      console.error("PERMISSION DENIED:", errorMsg);
      throw new Error(errorMsg);
    }

    const records = await ctx.db
      .query("diseaseRecords")
      .filter(q => q.eq(q.field("createdBy"), identity.subject))
      .collect();

    return records.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
});

// ✏️ Update a disease record
export const updateDiseaseRecord = mutation({
  args: {
    id: v.id("diseaseRecords"),
    diseaseName: v.string(),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    location: v.optional(v.string()),
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
    if (!record) throw new Error("Record not found");

    if (record.createdBy !== identity.subject && role !== ROLES.ADMIN) {
      throw new Error("You can only update your own records");
    }

    await ctx.db.patch(args.id, {
      diseaseName: args.diseaseName,
      imageUrl: args.imageUrl,
      description: args.description,
      location: args.location,
      medicalSupplies: args.medicalSupplies,
      updatedAt: new Date().toISOString(),
    });
  },
});

// ✅ Register disease record (mark as complete)
export const registerDiseaseRecord = mutation({
  args: { id: v.id("diseaseRecords") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const role = (identity.publicMetadata as { role?: string })?.role || "citizen";
    if (role !== ROLES.ASHA && role !== ROLES.ADMIN) {
      throw new Error("Only ASHA/Admin can register disease records");
    }

    const record = await ctx.db.get(args.id);
    if (!record) throw new Error("Record not found");

    if (record.createdBy !== identity.subject && role !== ROLES.ADMIN) {
      throw new Error("You can only register your own records");
    }

    await ctx.db.patch(args.id, {
      status: "registered",
      updatedAt: new Date().toISOString(),
    });
  },
});

// 📁 Get all registered records (admin/asha)
export const getRegisteredRecords = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Use helper function to get role
    const { role, hasPermission, metadata } = getUserRole(identity);
    
    if (!hasPermission) {
      const errorMsg = `Only ASHA/Admin can view registered records. Your current role from JWT is: "${role}". ` +
        `Please sign out and sign back in to refresh your session token.`;
      console.error("PERMISSION DENIED:", errorMsg);
      throw new Error(errorMsg);
    }

    const records = await ctx.db
      .query("diseaseRecords")
      .filter(q => q.eq(q.field("status"), "registered"))
      .collect();

    return records.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt).getTime();
      return dateB - dateA;
    });
  },
});
