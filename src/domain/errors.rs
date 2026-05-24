/// Errors that arise from domain rules and conversions, independent of
/// any database or network concern.
#[derive(Debug, thiserror::Error)]
pub enum DomainError {
    #[error("unknown coin: {0}")]
    UnknownCoin(String),

    #[error("unknown currency: {0}")]
    UnknownCurrency(String),

    #[error("unknown period: {0}")]
    UnknownPeriod(String),
}

// Parsing helpers — useful when data comes back from the DB or an API
// as strings and must be turned back into our typed enums.
use crate::domain::entities::{Coin, Currency, Period};

impl Coin {
    pub fn from_coingecko_id(s: &str) -> Result<Self, DomainError> {
        match s {
            "bitcoin" => Ok(Coin::Bitcoin),
            "litecoin" => Ok(Coin::Litecoin),
            "solana" => Ok(Coin::Solana),
            "ethereum" => Ok(Coin::Ethereum),
            other => Err(DomainError::UnknownCoin(other.to_string())),
        }
    }

    pub fn from_symbol(s: &str) -> Result<Self, DomainError> {
        match s.to_uppercase().as_str() {
            "BTC" => Ok(Coin::Bitcoin),
            "LTC" => Ok(Coin::Litecoin),
            "SOL" => Ok(Coin::Solana),
            "ETH" => Ok(Coin::Ethereum),
            other => Err(DomainError::UnknownCoin(other.to_string())),
        }
    }
}

impl Currency {
    pub fn from_code(s: &str) -> Result<Self, DomainError> {
        match s.to_lowercase().as_str() {
            "usd" => Ok(Currency::Usd),
            "eur" => Ok(Currency::Eur),
            other => Err(DomainError::UnknownCurrency(other.to_string())),
        }
    }
}

impl Period {
    pub fn from_str_label(s: &str) -> Result<Self, DomainError> {
        match s.to_lowercase().as_str() {
            "day" => Ok(Period::Day),
            "week" => Ok(Period::Week),
            "month" => Ok(Period::Month),
            other => Err(DomainError::UnknownPeriod(other.to_string())),
        }
    }
}