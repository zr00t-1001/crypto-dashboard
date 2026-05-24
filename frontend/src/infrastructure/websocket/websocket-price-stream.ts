import type { PriceStream } from "../../application/ports/price-stream";
import type { Price } from "../../domain/price";
import { WS_URL } from "../config";
import { toPrice, type PriceDto } from "../dto/price-dto";

export class WebSocketPriceStream implements PriceStream {
  subscribe(onPrices: (prices: Price[]) => void): () => void {
    const ws = new WebSocket(WS_URL);

    ws.onmessage = (event) => {
      try {
        const dtos: PriceDto[] = JSON.parse(event.data);
        onPrices(dtos.map(toPrice));
      } catch {
        // Ignore malformed frames.
      }
    };

    // Return an unsubscribe that closes the socket.
    return () => ws.close();
  }
}