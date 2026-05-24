import { useState } from "react";
import { useExtremes } from "../hooks/useExtremes";
import {
  ALL_PERIODS,
  ALL_CURRENCIES,
  type Currency,
  type Period,
} from "../../domain/price";

const CURRENCY_SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€" };

function fmt(value: string, currency: Currency): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return (
    CURRENCY_SYMBOL[currency] +
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

export default function Extremes() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [period, setPeriod] = useState<Period>("day");
  const { extremes, loading, error } = useExtremes(currency, period);

  return (
    <div className="border" style={{ borderColor: "var(--grid-strong)", backgroundColor: "var(--bg-panel)" }}>
      {/* Tab bar */}
      <div
        className="flex items-center justify-between border-b px-4 py-3 max-md:flex-col max-md:items-start max-md:gap-3"
        style={{ borderColor: "var(--grid)" }}
      >
        {/* Period tabs */}
        <div className="flex gap-px" style={{ backgroundColor: "var(--grid)" }}>
          {ALL_PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: period === p ? "var(--color-accent)" : "var(--bg-row)",
                color: period === p ? "#050506" : "var(--text-dim)",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Currency tabs */}
        <div className="flex gap-px" style={{ backgroundColor: "var(--grid)" }}>
          {ALL_CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: currency === c ? "var(--text)" : "var(--bg-row)",
                color: currency === c ? "var(--bg)" : "var(--text-dim)",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
{loading ? (
        <div className="flex flex-col gap-px px-4 py-4" style={{ backgroundColor: "var(--grid)" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 px-1 py-2" style={{ backgroundColor: "var(--bg-panel)" }}>
              <span className="shimmer h-4 w-12 rounded" />
              <span className="shimmer h-4 flex-1 rounded" />
              <span className="shimmer h-4 flex-1 rounded" />
              <span className="shimmer h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p className="px-4 py-6 text-sm" style={{ color: "var(--color-down)" }}>
          RANGE ERROR — {error}
        </p>
      ) : extremes.length === 0 ? (
        <p className="label px-4 py-6">NO DATA IN WINDOW — let the backend poll a while.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ color: "var(--text-faint)" }} className="text-left">
              <th className="label px-4 py-2 font-normal">COIN</th>
              <th className="label px-4 py-2 text-right font-normal">HIGHEST</th>
              <th className="label px-4 py-2 text-right font-normal">LOWEST</th>
              <th className="label px-4 py-2 text-right font-normal">SPREAD</th>
            </tr>
          </thead>
          <tbody>
            {extremes.map((e) => {
              const hi = Number(e.highest);
              const lo = Number(e.lowest);
              const spreadPct = lo > 0 ? ((hi - lo) / lo) * 100 : 0;
              return (
                <tr
                  key={e.coin}
                  style={{ borderTop: "1px solid var(--grid)" }}
                >
                  <td className="px-4 py-3 text-sm font-bold" style={{ color: "var(--color-accent)" }}>
                    {e.coin}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-sm" style={{ color: "var(--color-up)" }}>
                    {fmt(e.highest, currency)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-sm" style={{ color: "var(--color-down)" }}>
                    {fmt(e.lowest, currency)}
                  </td>
                  <td className="tabular px-4 py-3 text-right text-sm" style={{ color: "var(--text-dim)" }}>
                    {spreadPct.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}