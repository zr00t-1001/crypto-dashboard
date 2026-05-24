use async_trait::async_trait;
use chrono::Utc;
use rust_decimal::Decimal;
use std::collections::HashMap;
use std::str::FromStr;

use crate::application::ports::{PriceProvider, ProviderError};
use crate::domain::entities::{Coin, Currency, Price};

const BASE_URL: &str = "https://api.coingecko.com/api/v3/simple/price";

/// CoinGecko implementation of the PriceProvider port.
pub struct CoinGeckoProvider {
    client: reqwest::Client,
}

impl CoinGeckoProvider {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .user_agent("crypto-dashboard/0.1")
            .build()
            .expect("failed to build HTTP client");
        Self { client }
    }
}

impl Default for CoinGeckoProvider {
    fn default() -> Self {
        Self::new()
    }
}

// The response now nests change alongside price:
// { "bitcoin": { "usd": 1.23, "usd_24h_change": 2.34, "eur": ... }, ... }
type RawResponse = HashMap<String, HashMap<String, f64>>;

#[async_trait]
impl PriceProvider for CoinGeckoProvider {
    async fn fetch_current_prices(&self) -> Result<Vec<Price>, ProviderError> {
        let ids = Coin::ALL
            .iter()
            .map(|c| c.coingecko_id())
            .collect::<Vec<_>>()
            .join(",");
        let vs = Currency::ALL
            .iter()
            .map(|c| c.code())
            .collect::<Vec<_>>()
            .join(",");

      let resp = self
            .client
            .get(BASE_URL)
            .query(&[
                ("ids", ids.as_str()),
                ("vs_currencies", vs.as_str()),
                ("include_24hr_change", "true"),
            ])
            .send()
            .await
            .map_err(|e| ProviderError::Transport(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(ProviderError::UnexpectedResponse(format!(
                "HTTP {}",
                resp.status()
            )));
        }

        let raw: RawResponse = resp
            .json()
            .await
            .map_err(|e| ProviderError::UnexpectedResponse(e.to_string()))?;

        let observed_at = Utc::now();
        let mut prices = Vec::with_capacity(Coin::ALL.len() * Currency::ALL.len());

        for coin in Coin::ALL {
            let by_currency = raw.get(coin.coingecko_id()).ok_or_else(|| {
                ProviderError::UnexpectedResponse(format!(
                    "missing coin in response: {}",
                    coin.coingecko_id()
                ))
            })?;

for currency in Currency::ALL {
                let raw_value = by_currency.get(currency.code()).ok_or_else(|| {
                    ProviderError::UnexpectedResponse(format!(
                        "missing currency {} for coin {}",
                        currency.code(),
                        coin.coingecko_id()
                    ))
                })?;

                let value = Decimal::from_str(&raw_value.to_string()).map_err(|e| {
                    ProviderError::UnexpectedResponse(format!("decimal parse: {e}"))
                })?;

                // 24h change key looks like "usd_24h_change".
                let change_key = format!("{}_24h_change", currency.code());
                let change_24h = by_currency.get(&change_key).copied();

                prices.push(Price {
                    coin,
                    currency,
                    value,
                    observed_at,
                    change_24h,
                });
            }
        }

        Ok(prices)
    }
}