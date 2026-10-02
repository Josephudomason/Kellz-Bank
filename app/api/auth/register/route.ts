import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { createClient as createSupabaseAdminClient } from "@supabase/supabase-js";
import { getPrisma } from "@/lib/db";
import { registrationSchema } from "@/lib/registration-schema";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const result = registrationSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: "Provide a name, valid email, and a matching password of at least 12 characters." },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Account creation is not configured on the server." }, { status: 503 });
  }

  const admin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let createdUserId: string | undefined;
  let prisma: ReturnType<typeof getPrisma> | undefined;
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: result.data.email,
      password: result.data.password,
      email_confirm: true,
      user_metadata: {
        display_name: result.data.fullName,
      },
    });

    if (error) {
      if (error.code === "email_exists" || error.status === 422) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
      }
      console.error("Supabase account creation failed", { status: error.status, code: error.code });
      return NextResponse.json({ error: "Unable to create an account with those details." }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: "Supabase did not return the new account." }, { status: 502 });
    }

    createdUserId = data.user.id;
    prisma = getPrisma();
    await prisma.$transaction(async (transaction) => {
      await transaction.profile.create({
        data: {
          id: data.user.id,
          email: result.data.email,
          displayName: result.data.fullName,
        },
      });

      const [checkingLast4, savingsLast4] = [randomInt(1000, 10000), randomInt(1000, 10000)];
      await transaction.account.createMany({
        data: [
          { userId: data.user.id, name: "Everyday Checking", type: "CHECKING", numberLast4: String(checkingLast4), availableBalance: "8802.77", currentBalance: "8802.77" },
          { userId: data.user.id, name: "Rainy Day Savings", type: "SAVINGS", numberLast4: String(savingsLast4), availableBalance: "12200.00", currentBalance: "12200.00" },
        ],
      });
    });

    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: result.data.email,
      password: result.data.password,
    });
    if (signInError) {
      throw new Error("AUTO_SIGN_IN_FAILED");
    }

    createdUserId = undefined;
    return NextResponse.json({ data: { id: data.user.id, email: data.user.email, authenticated: true } }, { status: 201 });
  } catch (error) {
    if (createdUserId) {
      await prisma?.profile.deleteMany({ where: { id: createdUserId } }).catch(() => undefined);
      await admin.auth.admin.deleteUser(createdUserId).catch(() => undefined);
    }
    if (error instanceof Error && error.message === "AUTO_SIGN_IN_FAILED") {
      return NextResponse.json({ error: "Your account could not be signed in automatically. Please try again." }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Your account could not be completed. Please try again." },
      { status: 503 },
    );
  }
}
