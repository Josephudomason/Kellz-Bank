import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const passwordSchema = z.object({ password: z.string().min(12).max(128) });

export async function PATCH(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = passwordSchema.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: "Use a password of at least 12 characters." }, { status: 400 });

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password: result.data.password });
    if (error) return NextResponse.json({ error: "Unable to update your password." }, { status: 400 });
    return NextResponse.json({ data: { updated: true } });
  } catch {
    return NextResponse.json({ error: "Password settings are temporarily unavailable." }, { status: 503 });
  }
}