import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useAllSeries, type CoinSeries } from "../hooks/UseAllSeries";
import {
  ALL_PERIODS,
  ALL_CURRENCIES,
  type Coin,
  type Currency,
  type Period,
} from "../../domain/price";

const COIN_NAMES: Record<Coin, string> = {
  BTC: "BITCOIN",
  LTC: "LITECOIN",
  SOL: "SOLANA",
  ETH: "ETHEREUM",
};
const CURRENCY_SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€" };

/** Read a CSS variable's resolved value (Recharts needs real color strings). */
function cssVar(name: string): string {
  if (typeof window === "undefined") return "#ffb000";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function fmtPrice(n: number, currency: Currency): string {
  return (
    CURRENCY_SYMBOL[currency] +
    n.toLocaleString("en-US", { maximumFractionDigits: 2 })
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

interface MiniChartProps {
  series: CoinSeries;
  currency: Currency;
  colors: { accent: string; grid: string; text: string };
}

function MiniChart({ series, currency, colors }: MiniChartProps) {
  // Map domain points to chart data; value is a string → number for plotting only.
  const data = series.points.map((p) => ({
    t: p.observedAt.toISOString(),
    v: Number(p.value),
  }));

  const latest = data.length > 0 ? data[data.length - 1].v : null;

  return (
    <div className="px-5 py-4" style={{ backgroundColor: "var(--bg-panel)" }}>
      <div className="mb-3 flex items-baseline justify-between">
        <span className="label">{COIN_NAMES[series.coin]}</span>
        <div className="flex items-baseline gap-2">
          {latest !== null && (
            <span className="tabular text-lg font-bold">
              {fmtPrice(latest, currency)}
            </span>
          )}
          <span className="text-xs font-extrabold" style={{ color: "var(--color-accent)" }}>
            {series.coin}
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="label py-10 text-center">NO DATA</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="t"
              tickFormatter={fmtTime}
              tick={{ fill: colors.text, fontSize: 10, fontFamily: "JetBrains Mono" }}
              stroke={colors.grid}
              minTickGap={40}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: colors.text, fontSize: 10, fontFamily: "JetBrains Mono" }}
              stroke={colors.grid}
              width={52}
              tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + "k" : String(v))}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-row)",
                border: `1px solid ${colors.grid}`,
                borderRadius: 0,
                fontFamily: "JetBrains Mono",
                fontSize: 12,
              }}
              labelFormatter={(l) => fmtTime(String(l))}
              formatter={(v: number) => [fmtPrice(v, currency), series.coin]}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke={colors.accent}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function PriceCharts() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [period, setPeriod] = useState<Period>("day");
  const { series, loading, error } = useAllSeries(currency, period);

  // Resolve theme colors once mounted, and re-resolve when theme might change.
  const [colors, setColors] = useState({ accent: "#ffb000", grid: "#1c1d21", text: "#6f7177" });
  useEffect(() => {
    const resolve = () =>
      setColors({
        accent: cssVar("--color-accent") || "#ffb000",
        grid: cssVar("--grid") || "#1c1d21",
        text: cssVar("--text-dim") || "#6f7177",
      });
    resolve();
    // Re-resolve if the <html> class (theme) changes.
    const observer = new MutationObserver(resolve);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="border" style={{ borderColor: "var(--grid-strong)", backgroundColor: "var(--bg-panel)" }}>
      {/* Shared controls */}
      <div
        className="flex items-center justify-between border-b px-4 py-3 max-md:flex-col max-md:items-start max-md:gap-3"
        style={{ borderColor: "var(--grid)" }}
      >
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

      {/* Charts */}
{loading ? (
        <div className="grid grid-cols-2 gap-px max-md:grid-cols-1" style={{ backgroundColor: "var(--grid)" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="px-5 py-4" style={{ backgroundColor: "var(--bg-panel)" }}>
              <div className="mb-3 flex justify-between">
                <span className="shimmer h-3 w-20 rounded" />
                <span className="shimmer h-3 w-12 rounded" />
              </div>
              <span className="shimmer block h-[180px] w-full rounded" />
            </div>
          ))}
        </div>
      ) : error ? (
     
        <p className="px-4 py-10 text-sm" style={{ color: "var(--color-down)" }}>
          CHART ERROR — {error}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-px max-md:grid-cols-1" style={{ backgroundColor: "var(--grid)" }}>
          {series.map((s) => (
            <MiniChart key={s.coin} series={s} currency={currency} colors={colors} />
          ))}
        </div>
      )}
    </div>
  );
}