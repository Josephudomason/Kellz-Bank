import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { createPlaidLinkToken } from "@/lib/plaid";

export const runtime = "nodejs";

export async function POST() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const linkToken = await createPlaidLinkToken(user.id);
    return NextResponse.json({ data: { linkToken } });
  } catch {
    return NextResponse.json({ error: "Bank connection is not configured." }, { status: 503 });
  }
}