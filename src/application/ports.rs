use async_trait::async_trait;

use crate::domain::entities::{
    Coin, Currency, Period, Price, PriceExtremes, PricePoint,
};

/// Port: fetches current prices from an external source (e.g. CoinGecko).
/// Infrastructure implements this; the application only knows the trait.
#[async_trait]
pub trait PriceProvider: Send + Sync {
    /// Fetch the current price for every coin in every currency.
    /// One round-trip's worth of snapshots.
    async fn fetch_current_prices(&self) -> Result<Vec<Price>, ProviderError>;
}

/// Port: persists and queries price snapshots.
#[async_trait]
pub trait PriceRepository: Send + Sync {
    /// Persist a batch of snapshots (one polling cycle).
    async fn save_prices(&self, prices: &[Price]) -> Result<(), RepositoryError>;

    /// Most recent snapshot for a coin/currency — powers the price cards.
    async fn latest_price(
        &self,
        coin: Coin,
        currency: Currency,
    ) -> Result<Option<Price>, RepositoryError>;

    /// Highest & lowest over a period — powers the Highest/Lowest tabs.
    async fn extremes(
        &self,
        coin: Coin,
        currency: Currency,
        period: Period,
    ) -> Result<Option<PriceExtremes>, RepositoryError>;

    /// Time-series for charts over a period.
    async fn series(
        &self,
        coin: Coin,
        currency: Currency,
        period: Period,
    ) -> Result<Vec<PricePoint>, RepositoryError>;
}

#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("network/transport error: {0}")]
    Transport(String),

    #[error("unexpected response from provider: {0}")]
    UnexpectedResponse(String),
}

#[derive(Debug, thiserror::Error)]
pub enum RepositoryError {
    #[error("database error: {0}")]
    Database(String),
}