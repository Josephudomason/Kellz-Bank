import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import Sidebar from "@/app/components/navigation/Sidebar";
import Navbar from "@/app/components/navigation/Navbar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  let user;

  try {
    user = await getAuthenticatedUser();
  } catch {
    user = null;
  }

  if (!user) redirect("/login");

  const email = user.email ?? "";
  const metadataName = user.user_metadata.display_name;
  const name = (typeof metadataName === "string" && metadataName) || email.split("@")[0] || "Account holder";

  return (
    <div className="min-h-screen bg-[#f5f7f4]">
      <Sidebar />
      <div className="min-h-screen lg:pl-[252px]">
        <Navbar name={name} email={email} />
        <main className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-8 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
