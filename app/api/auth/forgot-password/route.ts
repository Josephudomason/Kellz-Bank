import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const recoverySchema = z.object({ email: z.string().trim().email().max(254) });

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = recoverySchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const { error } = await supabase.auth.resetPasswordForEmail(result.data.email, {
      redirectTo: new URL("/auth/callback?next=%2Freset-password", appUrl).toString(),
    });

    if (error) {
      return NextResponse.json({ error: "Unable to send a reset link." }, { status: 503 });
    }

    return NextResponse.json({ data: { requested: true } });
  } catch {
    return NextResponse.json({ error: "Password recovery is not configured." }, { status: 503 });
  }
}