type BalanceCardProps = {
  title: string;
  amount: number | null;
  currency: string;
  caption: string;
};

export default function BalanceCard({ title, amount, currency, caption }: BalanceCardProps) {
  const formatted = amount === null
    ? "Multiple currencies"
    : new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);

  return (
    <div className="min-w-0">
      <p className="text-sm font-medium text-white/70">{title}</p>
      <p className="mt-4 break-words text-4xl font-semibold tabular-nums text-white sm:text-5xl">{formatted}</p>
      <p className="mt-3 text-sm text-white/65">{caption}</p>
    </div>
  );
}