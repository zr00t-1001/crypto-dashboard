import type { Coin, Currency, Period, Price, PriceExtremes, PricePoint } from "../../domain/price";

/** Port: how the app reads prices. Infrastructure implements this. */
export interface PriceGateway {
  latestPrices(): Promise<Price[]>;
  extremes(coin: Coin, currency: Currency, period: Period): Promise<PriceExtremes | null>;
  series(coin: Coin, currency: Currency, period: Period): Promise<PricePoint[]>;
  /** Builds the CSV export URL (#6) — the browser navigates to it for download. */
  exportUrl(coin: Coin, currency: Currency, period: Period): string;
}