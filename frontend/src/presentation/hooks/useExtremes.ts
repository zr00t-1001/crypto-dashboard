import { useEffect, useState } from "react";
import { api } from "../../infrastructure/container";
import { ALL_COINS, type Currency, type Period, type PriceExtremes } from "../../domain/price";

interface ExtremesState {
  extremes: PriceExtremes[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches highest/lowest for every coin (in one currency) over a period.
 * Flows through the application use case via the container — no direct fetch.
 */
export function useExtremes(currency: Currency, period: Period) {
  const [state, setState] = useState<ExtremesState>({
    extremes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));

    Promise.all(ALL_COINS.map((coin) => api.extremes(coin, currency, period)))
      .then((results) => {
        if (cancelled) return;
        const extremes = results.filter((r): r is PriceExtremes => r !== null);
        setState({ extremes, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ extremes: [], loading: false, error: String(err) });
      });

    return () => {
      cancelled = true;
    };
  }, [currency, period]);

  return state;
}