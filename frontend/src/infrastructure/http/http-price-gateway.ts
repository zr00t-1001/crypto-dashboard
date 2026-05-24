import type { PriceGateway } from "../../application/ports/price-gateway";
import type { Coin, Currency, Period, Price, PriceExtremes, PricePoint } from "../../domain/price";
import { API_BASE_URL } from "../config";
import {
  toPrice, toExtremes, toPricePoint,
  type PriceDto, type ExtremesDto, type PricePointDto,
} from "../dto/price-dto";

export class HttpPriceGateway implements PriceGateway {
  async latestPrices(): Promise<Price[]> {
    const res = await fetch(`${API_BASE_URL}/api/prices/latest`);
    if (!res.ok) throw new Error(`latestPrices failed: ${res.status}`);
    const dtos: PriceDto[] = await res.json();
    return dtos.map(toPrice);
  }

  async extremes(coin: Coin, currency: Currency, period: Period): Promise<PriceExtremes | null> {
    const res = await fetch(
      `${API_BASE_URL}/api/prices/extremes?coin=${coin}&currency=${currency}&period=${period}`,
    );
    if (!res.ok) throw new Error(`extremes failed: ${res.status}`);
    const dto: ExtremesDto | null = await res.json();
    return dto ? toExtremes(dto) : null;
  }

  async series(coin: Coin, currency: Currency, period: Period): Promise<PricePoint[]> {
    const res = await fetch(
      `${API_BASE_URL}/api/prices/series?coin=${coin}&currency=${currency}&period=${period}`,
    );
    if (!res.ok) throw new Error(`series failed: ${res.status}`);
    const dtos: PricePointDto[] = await res.json();
    return dtos.map(toPricePoint);
  }

  exportUrl(coin: Coin, currency: Currency, period: Period): string {
    return `${API_BASE_URL}/api/prices/export?coin=${coin}&currency=${currency}&period=${period}`;
  }
}