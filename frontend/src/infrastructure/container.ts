import { HttpPriceGateway } from "./http/http-price-gateway";
import { WebSocketPriceStream } from "./websocket/websocket-price-stream";
import { getLatestPrices } from "../application/use-cases/get-latest-prices";
import { getExtremes } from "../application/use-cases/get-extremes";
import { getSeries } from "../application/use-cases/get-series";
import type { Coin, Currency, Period } from "../domain/price";

// Instantiate adapters ONCE.
const gateway = new HttpPriceGateway();
const stream = new WebSocketPriceStream();

// Export use cases pre-bound to the concrete gateway.
// Presentation calls these — it never sees HttpPriceGateway or fetch.
export const api = {
  latestPrices: () => getLatestPrices(gateway),
  extremes: (coin: Coin, currency: Currency, period: Period) =>
    getExtremes(gateway, coin, currency, period),
  series: (coin: Coin, currency: Currency, period: Period) =>
    getSeries(gateway, coin, currency, period),
  exportUrl: (coin: Coin, currency: Currency, period: Period) =>
    gateway.exportUrl(coin, currency, period),
};

// The live stream port, ready for the presentation layer to subscribe.
export const priceStream = stream;