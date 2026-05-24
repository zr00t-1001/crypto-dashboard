import { useEffect, useState } from "react";
import { api } from "../../infrastructure/container";
import {
  ALL_COINS,
  type Coin,
  type Currency,
  type Period,
  type PricePoint,
} from "../../domain/price";

export interface CoinSeries {
  coin: Coin;
  points: PricePoint[];
}

interface SeriesState {
  series: CoinSeries[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches the price series for every coin (one currency, one period) in
 * parallel. Flows through the application use case via the container.
 */
export function useAllSeries(currency: Currency, period: Period) {
  const [state, setState] = useState<SeriesState>({
    series: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    Promise.all(
      ALL_COINS.map((coin) =>
        api.series(coin, currency, period).then((points) => ({ coin, points })),
      ),
    )
      .then((series) => {
        if (!cancelled) setState({ series, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ series: [], loading: false, error: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [currency, period]);

  return state;
}