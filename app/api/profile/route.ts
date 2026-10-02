import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({ displayName: z.string().trim().min(1).max(100) });

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = profileSchema.safeParse(payload);
  if (!result.success) return NextResponse.json({ error: "Enter a valid display name." }, { status: 400 });

  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const profile = await getPrisma().profile.update({
      where: { id: user.id },
      data: { displayName: result.data.displayName },
      select: { displayName: true },
    });
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ data: { display_name: result.data.displayName } });
    if (error) return NextResponse.json({ error: "Profile saved, but session details could not be refreshed." }, { status: 503 });

    return NextResponse.json({ data: profile });
  } catch {
    return NextResponse.json({ error: "Profile settings are temporarily unavailable." }, { status: 503 });
  }
}