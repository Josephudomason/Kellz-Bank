"use client";

import dynamic from "next/dynamic";
import type { MonthlyActivity } from "./SpendingChart";

const SpendingChart = dynamic(() => import("./SpendingChart"), {
  ssr: false,
  loading: () => (
    <section aria-labelledby="cash-flow-heading" className="min-w-0">
      <div className="mb-4">
        <h2 id="cash-flow-heading" className="text-base font-semibold text-[#20392d]">Cash flow</h2>
        <p className="mt-1 text-xs text-[#7a887f]">Completed income and spending, by month</p>
      </div>
      <div className="h-67.5 animate-pulse border-y border-[#e1e8e1] bg-[#f0f4f0]" aria-hidden="true" />
    </section>
  ),
});

export default function SpendingChartLazy({ data }: { data: MonthlyActivity[] }) {
  return <SpendingChart data={data} />;
}