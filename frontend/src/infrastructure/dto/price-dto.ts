import type { Coin, Currency, Period, Price, PriceExtremes, PricePoint } from "../../domain/price";

// These match your Rust DTOs exactly (the JSON the backend sends).
export interface PriceDto {
  coin: string;
  currency: string;
  value: string;
  observed_at: string;
}
export interface ExtremesDto {
  coin: string;
  currency: string;
  period: string;
  highest: string;
  lowest: string;
}
export interface PricePointDto {
  value: string;
  observed_at: string;
}

// Mappers: backend JSON → domain types. One place to fix if the API changes.
export function toPrice(dto: PriceDto): Price {
  return {
    coin: dto.coin as Coin,
    currency: dto.currency as Currency,
    value: dto.value,
    observedAt: new Date(dto.observed_at),
  };
}

export function toExtremes(dto: ExtremesDto): PriceExtremes {
  return {
    coin: dto.coin as Coin,
    currency: dto.currency as Currency,
    period: dto.period as Period,
    highest: dto.highest,
    lowest: dto.lowest,
  };
}

export function toPricePoint(dto: PricePointDto): PricePoint {
  return {
    value: dto.value,
    observedAt: new Date(dto.observed_at),
  };
}