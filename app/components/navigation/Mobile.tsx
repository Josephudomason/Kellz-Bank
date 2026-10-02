"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, CreditCard, LayoutDashboard, Menu, ReceiptText, Settings2, Wallet, X } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative lg:hidden">
      <button type="button" className="grid size-10 place-items-center rounded-lg text-[#344b3f] hover:bg-[#eef3ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2f7257]" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      {open && (
        <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute left-0 top-12 z-50 w-[min(88vw,320px)] rounded-lg border border-[#dfe7df] bg-white p-2 shadow-xl">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={`flex min-h-12 items-center gap-3 rounded-md px-3 text-sm font-medium ${active ? "bg-[#eaf2ec] text-[#174a38]" : "text-[#64736a] hover:bg-[#f4f7f4]"}`}><Icon size={18} aria-hidden="true" />{label}</Link>;
          })}
        </nav>
      )}
    </div>
  );
}