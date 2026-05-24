import { useState } from "react";
import { api } from "../../infrastructure/container";
import {
  ALL_COINS,
  ALL_CURRENCIES,
  ALL_PERIODS,
  type Coin,
  type Currency,
  type Period,
} from "../../domain/price";

export default function DataExport() {
  const [coin, setCoin] = useState<Coin>("BTC");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [period, setPeriod] = useState<Period>("month");
  const [busy, setBusy] = useState(false);

  // CSV: the backend already serves a downloadable file — just navigate to it.
  function downloadCsv() {
    const url = api.exportUrl(coin, currency, period);
    window.open(url, "_blank");
  }

  // JSON: reuse the series use case, serialize client-side, trigger a download.
  async function downloadJson() {
    setBusy(true);
    try {
      const points = await api.series(coin, currency, period);
      const payload = {
        coin,
        currency,
        period,
        exportedAt: new Date().toISOString(),
        points: points.map((p) => ({
          value: p.value,
          observedAt: p.observedAt.toISOString(),
        })),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${coin}_${currency}_${period}_prices.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }

  const selectStyle = {
    backgroundColor: "var(--bg-row)",
    color: "var(--text)",
    border: "1px solid var(--grid)",
  };

  return (
    <div className="border" style={{ borderColor: "var(--grid-strong)", backgroundColor: "var(--bg-panel)" }}>
      <div className="flex flex-wrap items-end gap-4 px-4 py-4">
        {/* Coin */}
        <div className="flex flex-col gap-1">
          <span className="label">COIN</span>
          <select
            value={coin}
            onChange={(e) => setCoin(e.target.value as Coin)}
            className="px-3 py-1.5 text-sm font-bold"
            style={selectStyle}
          >
            {ALL_COINS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Currency */}
        <div className="flex flex-col gap-1">
          <span className="label">CURRENCY</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
            className="px-3 py-1.5 text-sm font-bold"
            style={selectStyle}
          >
            {ALL_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Period */}
        <div className="flex flex-col gap-1">
          <span className="label">PERIOD</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="px-3 py-1.5 text-sm font-bold uppercase"
            style={selectStyle}
          >
            {ALL_PERIODS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Download buttons */}
        <div className="flex gap-2">
          <button
            onClick={downloadCsv}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
            style={{ backgroundColor: "var(--color-accent)", color: "#050506" }}
          >
            ↓ CSV
          </button>
          <button
            onClick={downloadJson}
            disabled={busy}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
            style={{
              backgroundColor: "var(--bg-row)",
              color: "var(--text)",
              border: "1px solid var(--grid-strong)",
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? "…" : "↓ JSON"}
          </button>
        </div>
      </div>

      <p className="border-t px-4 py-2 label" style={{ borderColor: "var(--grid)" }}>
        EXPORTS {coin} / {currency} / {period.toUpperCase()} PRICE SERIES
      </p>
    </div>
  );
}