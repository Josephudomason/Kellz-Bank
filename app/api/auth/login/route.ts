import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/registration-schema";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = loginSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: "Enter a valid email address and password." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(result.data);

    if (error || !data.user) {
      return NextResponse.json(
        { error: "Email or password is incorrect." },
        { status: 401 },
      );
    }

    return NextResponse.json({
      data: { id: data.user.id, email: data.user.email },
    });
  } catch {
    return NextResponse.json(
      { error: "Authentication is not configured." },
      { status: 503 },
    );
  }
}
