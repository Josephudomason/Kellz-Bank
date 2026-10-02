"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, CreditCard, LayoutDashboard, ReceiptText, Settings2, Wallet } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-[#e1e8e1] bg-white px-5 py-6 lg:flex">
      <Link href="/dashboard" className="flex items-center px-2">
        <BrandLogo className="h-10 w-24" />
      </Link>
      <div className="mt-12 px-3 text-[11px] font-semibold uppercase text-[#87958b]">Banking</div>
      <nav aria-label="Primary navigation" className="mt-3 flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${active ? "bg-[#eaf2ec] text-[#174a38]" : "text-[#64736a] hover:bg-[#f4f7f4] hover:text-[#17372d]"}`}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />{label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-lg border border-[#e1e8e1] bg-[#f6f8f5] p-4">
        <p className="text-sm font-semibold text-[#253d32]">Portfolio environment</p>
        <p className="mt-1 text-xs leading-5 text-[#738077]">Demo data only. No real funds are moved.</p>
      </div>
    </aside>
  );
}