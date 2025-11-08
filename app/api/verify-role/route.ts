// app/api/verify-role/route.ts
// Server-side role verification endpoint
import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { ROLES } from "@/lib/roles";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get the latest role from Clerk server-side (always up-to-date)
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const role = (user.publicMetadata?.role as string) || "citizen";
    const normalizedRole = role.toLowerCase().trim();

    const hasPermission = normalizedRole === ROLES.ASHA || normalizedRole === ROLES.ADMIN;

    return NextResponse.json({
      userId,
      role: normalizedRole,
      hasPermission,
      publicMetadata: user.publicMetadata,
      // Include a timestamp to help with debugging
      verifiedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error verifying role:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify role" },
      { status: 500 }
    );
  }
}

