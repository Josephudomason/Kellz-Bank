import { NextResponse, type NextRequest } from "next/server";
import { randomInt } from "node:crypto";
import { getPrisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!code) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "?error=invalid_auth_callback";
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "?error=auth_callback_failed";
      return NextResponse.redirect(loginUrl);
    }

    const user = data.user;
    if (!user?.email) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "?error=missing_email";
      return NextResponse.redirect(loginUrl);
    }

    const displayName = typeof user.user_metadata.display_name === "string"
      ? user.user_metadata.display_name
      : user.email.split("@")[0];
    const prisma = getPrisma();
    await prisma.$transaction(async (transaction) => {
      await transaction.profile.upsert({
        where: { id: user.id },
        update: { email: user.email!, displayName },
        create: { id: user.id, email: user.email!, displayName },
      });

      const [checkingLast4, savingsLast4] = [randomInt(1000, 10000), randomInt(1000, 10000)];
      await transaction.account.createMany({
        data: [
          { userId: user.id, name: "Everyday Checking", type: "CHECKING", numberLast4: String(checkingLast4), availableBalance: "8802.77", currentBalance: "8802.77" },
          { userId: user.id, name: "Rainy Day Savings", type: "SAVINGS", numberLast4: String(savingsLast4), availableBalance: "12200.00", currentBalance: "12200.00" },
        ],
        skipDuplicates: true,
      });
    });

    return NextResponse.redirect(new URL(destination, request.url));
  } catch {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "?error=auth_not_configured";
    return NextResponse.redirect(loginUrl);
  }
}