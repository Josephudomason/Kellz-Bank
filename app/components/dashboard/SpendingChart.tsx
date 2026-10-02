import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type MonthlyActivity = { month: string; income: number; spending: number };

export default function SpendingChart({ data }: { data: MonthlyActivity[] }) {
  return (
    <section aria-labelledby="cash-flow-heading" className="min-w-0">
      <div className="mb-4">
        <h2 id="cash-flow-heading" className="text-base font-semibold text-[#20392d]">Cash flow</h2>
        <p className="mt-1 text-xs text-[#7a887f]">Completed income and spending, by month</p>
      </div>
      {data.every((month) => month.income === 0 && month.spending === 0) ? (
        <div className="grid min-h-[240px] place-items-center border-y border-[#e1e8e1] text-center"><p className="max-w-xs text-sm leading-6 text-[#758279]">Your income and spending trends will appear here as activity is recorded.</p></div>
      ) : (
        <div className="h-[270px] w-full" role="img" aria-label="Bar chart comparing monthly income and spending">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} accessibilityLayer>
              <CartesianGrid vertical={false} stroke="#e7ece7" strokeDasharray="4 4" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#77867c", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#77867c", fontSize: 11 }} tickFormatter={(value: number) => `$${value}`} />
              <Tooltip formatter={(value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value))} />
              <Legend iconType="circle" />
              <Bar dataKey="income" name="Income" fill="#3f8a62" radius={[4, 4, 0, 0]} maxBarSize={24} />
              <Bar dataKey="spending" name="Spending" fill="#d5845b" radius={[4, 4, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}