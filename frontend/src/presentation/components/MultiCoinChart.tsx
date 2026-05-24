import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { useAllSeries } from "../hooks/UseAllSeries";
import {
  ALL_PERIODS,
  ALL_CURRENCIES,
  type Coin,
  type Currency,
  type Period,
} from "../../domain/price";

// Muted, CRT-style palette — amber leads, others desaturated for legibility.
const COIN_COLORS: Record<Coin, string> = {
  BTC: "#ffb000", // amber (lead)
  ETH: "#5fb3d4", // muted cyan-blue
  SOL: "#7ec96b", // muted green
  LTC: "#d97b6b", // muted terracotta
};

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

export default function MultiCoinChart() {
  const [currency, setCurrency] = useState<Currency>("USD");
  const [period, setPeriod] = useState<Period>("day");
  const { series, loading, error } = useAllSeries(currency, period);

  const [colors, setColors] = useState({ grid: "#1c1d21", text: "#6f7177" });
  useEffect(() => {
    const resolve = () =>
      setColors({
        grid: cssVar("--grid", "#1c1d21"),
        text: cssVar("--text-dim", "#6f7177"),
      });
    resolve();
    const obs = new MutationObserver(resolve);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  // Build a single time-aligned dataset of % change from each coin's first point.
  // Each row: { t: ISO, BTC: %, ETH: %, ... } keyed by timestamp.
  const rowMap = new Map<string, Record<string, number | string>>();
  const latestPct: Partial<Record<Coin, number>> = {};

  for (const s of series) {
    if (s.points.length === 0) continue;
    const base = Number(s.points[0].value);
    if (!(base > 0)) continue;
    for (const p of s.points) {
      const t = p.observedAt.toISOString();
      const pct = ((Number(p.value) - base) / base) * 100;
      const row = rowMap.get(t) ?? { t };
      row[s.coin] = pct;
      rowMap.set(t, row);
      latestPct[s.coin] = pct;
    }
  }

  const data = Array.from(rowMap.values()).sort((a, b) =>
    String(a.t).localeCompare(String(b.t)),
  );

  const coinsWithData = series.filter((s) => s.points.length > 0).map((s) => s.coin);

  return (
    <div className="border" style={{ borderColor: "var(--grid-strong)", backgroundColor: "var(--bg-panel)" }}>
      {/* Controls */}
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

      {/* Legend */}
      {coinsWithData.length > 0 && (
        <div className="flex flex-wrap gap-4 border-b px-4 py-2" style={{ borderColor: "var(--grid)" }}>
          {coinsWithData.map((coin) => {
            const pct = latestPct[coin] ?? 0;
            return (
              <div key={coin} className="flex items-center gap-2">
                <span className="inline-block h-2 w-3" style={{ backgroundColor: COIN_COLORS[coin] }} />
                <span className="text-xs font-bold">{coin}</span>
                <span
                  className="tabular text-xs font-bold"
                  style={{ color: pct >= 0 ? "var(--color-up)" : "var(--color-down)" }}
                >
                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
  {loading ? (
        <div className="px-4 py-4">
          <span className="shimmer block h-[340px] w-full rounded" />
        </div>
      ) : error ? (
        <p className="px-4 py-12 text-sm" style={{ color: "var(--color-down)" }}>OVERLAY ERROR — {error}</p>
      ) : data.length === 0 ? (
        <p className="label px-4 py-12">NO DATA IN WINDOW</p>
      ) : (
        <div className="px-4 py-4">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid stroke={colors.grid} strokeDasharray="2 4" vertical={false} />
              <XAxis
                dataKey="t"
                tickFormatter={fmtTime}
                tick={{ fill: colors.text, fontSize: 10, fontFamily: "JetBrains Mono" }}
                stroke={colors.grid}
                minTickGap={50}
              />
              <YAxis
                tick={{ fill: colors.text, fontSize: 10, fontFamily: "JetBrains Mono" }}
                stroke={colors.grid}
                width={50}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}%`}
              />
              <ReferenceLine y={0} stroke={colors.text} strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-row)",
                  border: `1px solid ${colors.grid}`,
                  borderRadius: 0,
                  fontFamily: "JetBrains Mono",
                  fontSize: 12,
                }}
                labelFormatter={(l) => fmtTime(String(l))}
                formatter={(v: number, name: string) => [`${v >= 0 ? "+" : ""}${v.toFixed(2)}%`, name]}
              />
              {coinsWithData.map((coin) => (
                <Line
                  key={coin}
                  type="monotone"
                  dataKey={coin}
                  stroke={COIN_COLORS[coin]}
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}