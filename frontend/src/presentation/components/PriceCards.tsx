import { useEffect, useRef, useState } from "react";
import { useLivePrices } from "../hooks/useLivePrices";
import type { Currency, Price } from "../../domain/price";

const COIN_NAMES: Record<string, string> = {
  BTC: "BITCOIN", LTC: "LITECOIN", SOL: "SOLANA", ETH: "ETHEREUM",
};
const CURRENCY_SYMBOL: Record<Currency, string> = { USD: "$", EUR: "€" };

function fmt(value: string, currency: Currency): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return CURRENCY_SYMBOL[currency] + n.toLocaleString("en-US", {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function PriceLine({ price }: { price: Price }) {
  const prev = useRef<string | null>(null);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (prev.current !== null && prev.current !== price.value) {
      const dir = Number(price.value) >= Number(prev.current) ? "up" : "down";
      setFlash(dir);
      const id = setTimeout(() => setFlash(null), 600);
      prev.current = price.value;
      return () => clearTimeout(id);
    }
    prev.current = price.value;
  }, [price.value]);

  const color =
    flash === "up" ? "var(--color-up)" : flash === "down" ? "var(--color-down)" : "var(--text)";

  const change = price.change24h;
  const hasChange = change !== null && change !== undefined && !Number.isNaN(change);
  const changeColor = hasChange && change! >= 0 ? "var(--color-up)" : "var(--color-down)";

  return (
    <div className="flex items-baseline justify-between">
      <span style={{ color: "var(--text-faint)", fontSize: "12px" }}>{price.currency}</span>
      <div className="flex items-baseline gap-2">
        {hasChange && (
          <span className="tabular text-xs font-bold" style={{ color: changeColor }}>
            {change! >= 0 ? "▲" : "▼"} {Math.abs(change!).toFixed(2)}%
          </span>
        )}
        <span className="tabular text-2xl font-bold max-md:text-xl transition-colors duration-300"
          style={{ color }}>
          {fmt(price.value, price.currency)}
        </span>
      </div>
    </div>
  );
}

/** Shimmer skeleton shown while the first snapshot loads. */
function CardSkeleton() {
  return (
    <div className="px-6 py-6" style={{ backgroundColor: "var(--bg-panel)" }}>
      <div className="mb-4 flex items-center justify-between">
        <span className="shimmer h-3 w-20 rounded" />
        <span className="shimmer h-3 w-8 rounded" />
      </div>
      <div className="flex flex-col gap-3">
        <span className="shimmer h-7 w-full rounded" />
        <span className="shimmer h-7 w-full rounded" />
      </div>
    </div>
  );
}

export default function PriceCards() {
  const { prices, loading, error, live } = useLivePrices();

  if (error) {
    return (
      <div className="border px-5 py-4 text-sm"
        style={{ borderColor: "var(--color-down)", color: "var(--color-down)" }}>
        FEED ERROR — backend offline on :8080?
        <span className="mt-1 block" style={{ color: "var(--text-dim)" }}>{error}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="label blink" style={{ color: "var(--text-dim)" }}>○ CONNECTING</span>
        </div>
        <div className="grid grid-cols-4 gap-px max-md:grid-cols-2" style={{ backgroundColor: "var(--grid)" }}>
          {[0, 1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const byCoin = new Map<string, Price[]>();
  for (const p of prices) {
    const list = byCoin.get(p.coin) ?? [];
    list.push(p);
    byCoin.set(p.coin, list);
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="label" style={{ color: live ? "var(--color-up)" : "var(--text-dim)" }}>
          {live ? "● STREAMING" : "○ SNAPSHOT"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-px max-md:grid-cols-2" style={{ backgroundColor: "var(--grid)" }}>
        {Array.from(byCoin.entries()).map(([coin, coinPrices]) => (
          <div key={coin} className="px-6 py-6" style={{ backgroundColor: "var(--bg-panel)" }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="label">{COIN_NAMES[coin] ?? coin}</span>
              <span className="text-sm font-extrabold" style={{ color: "var(--color-accent)" }}>{coin}</span>
            </div>
            <div className="flex flex-col gap-3">
              {coinPrices.sort((a, b) => a.currency.localeCompare(b.currency)).map((p) => (
                <PriceLine key={p.currency} price={p} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
