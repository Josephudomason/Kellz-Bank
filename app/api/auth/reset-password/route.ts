import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const passwordSchema = z.object({ password: z.string().min(12).max(128) });

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = passwordSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json({ error: "Use a password of at least 12 characters." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return NextResponse.json({ error: "The password reset session is invalid or expired." }, { status: 401 });
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: result.data.password });
    if (updateError) {
      return NextResponse.json({ error: "Unable to update your password." }, { status: 400 });
    }

    return NextResponse.json({ data: { updated: true } });
  } catch {
    return NextResponse.json({ error: "Password reset is not configured." }, { status: 503 });
  }
}