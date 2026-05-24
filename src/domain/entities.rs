use chrono::{DateTime, Utc};
use rust_decimal::Decimal;

/// The cryptocurrencies we track. Fixed, known set.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Coin {
    Bitcoin,
    Litecoin,
    Solana,
    Ethereum,
}

impl Coin {
    /// All coins — handy for iterating when polling the provider.
    pub const ALL: [Coin; 4] = [
        Coin::Bitcoin,
        Coin::Litecoin,
        Coin::Solana,
        Coin::Ethereum,
    ];

    /// Short ticker symbol.
    pub fn symbol(&self) -> &'static str {
        match self {
            Coin::Bitcoin => "BTC",
            Coin::Litecoin => "LTC",
            Coin::Solana => "SOL",
            Coin::Ethereum => "ETH",
        }
    }

    /// CoinGecko's API identifier for this coin (used by the provider later).
    pub fn coingecko_id(&self) -> &'static str {
        match self {
            Coin::Bitcoin => "bitcoin",
            Coin::Litecoin => "litecoin",
            Coin::Solana => "solana",
            Coin::Ethereum => "ethereum",
        }
    }
}

/// Fiat currencies we quote prices in.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Currency {
    Usd,
    Eur,
}

impl Currency {
    pub const ALL: [Currency; 2] = [Currency::Usd, Currency::Eur];

    /// Lowercase code as CoinGecko expects it (and as we'll store it).
    pub fn code(&self) -> &'static str {
        match self {
            Currency::Usd => "usd",
            Currency::Eur => "eur",
        }
    }
}

/// A single price snapshot: one coin, in one currency, at one moment.
/// This is the row we store (Option A: raw snapshots).
#[derive(Debug, Clone)]
pub struct Price {
    pub coin: Coin,
    pub currency: Currency,
    pub value: Decimal,
    pub observed_at: DateTime<Utc>,
    pub change_24h: Option<f64>,
}

/// A lighter point for chart series — value over time, coin/currency
/// implied by the query context.
#[derive(Debug, Clone)]
pub struct PricePoint {
    pub value: Decimal,
    pub observed_at: DateTime<Utc>,
}

/// The time windows your UI tabs use for highs/lows and chart ranges.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Period {
    Day,
    Week,
    Month,
}

impl Period {
    /// How far back this period reaches from `now`.
    pub fn duration(&self) -> chrono::Duration {
        match self {
            Period::Day => chrono::Duration::days(1),
            Period::Week => chrono::Duration::weeks(1),
            Period::Month => chrono::Duration::days(30),
        }
    }
}

/// The high and low of a coin/currency over a period — what your
/// Highest/Lowest tabs display.
#[derive(Debug, Clone)]
pub struct PriceExtremes {
    pub coin: Coin,
    pub currency: Currency,
    pub period: Period,
    pub highest: Decimal,
    pub lowest: Decimal,
}