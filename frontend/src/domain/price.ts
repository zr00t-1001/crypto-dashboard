// Mirrors the Rust domain. Pure types — no framework, no fetch, no React.

export type Coin = "BTC" | "LTC" | "SOL" | "ETH";
export type Currency = "USD" | "EUR";
export type Period = "day" | "week" | "month";

export const ALL_COINS: readonly Coin[] = ["BTC", "LTC", "SOL", "ETH"];
export const ALL_CURRENCIES: readonly Currency[] = ["USD", "EUR"];
export const ALL_PERIODS: readonly Period[] = ["day", "week", "month"];

/** A single price snapshot — one coin, one currency, one moment. */
export interface Price {
  readonly coin: Coin;
  readonly currency: Currency;
  /** Exact decimal value, kept as string to preserve precision (matches backend). */
  readonly value: string;
  readonly observedAt: Date;
}

/** Highest & lowest over a period — powers the Highest/Lowest tabs (#2). */
export interface PriceExtremes {
  readonly coin: Coin;
  readonly currency: Currency;
  readonly period: Period;
  readonly highest: string;
  readonly lowest: string;
}

/** One point in a chart series (#5). */
export interface PricePoint {
  readonly value: string;
  readonly observedAt: Date;
}