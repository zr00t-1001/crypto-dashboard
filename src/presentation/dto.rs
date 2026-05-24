use serde::Serialize;

use crate::domain::entities::{Price, PriceExtremes, PricePoint};

/// JSON shape for a single latest price (one card).
#[derive(Debug, Serialize)]
pub struct PriceDto {
    pub coin: String,
    pub currency: String,
    pub value: String, // Decimal as string — preserves exact precision in JSON
    pub observed_at: String, // RFC3339 timestamp
}

impl From<&Price> for PriceDto {
    fn from(p: &Price) -> Self {
        Self {
            coin: p.coin.symbol().to_string(),
            currency: p.currency.code().to_uppercase(),
            value: p.value.to_string(),
            observed_at: p.observed_at.to_rfc3339(),
        }
    }
}

/// JSON shape for highest/lowest over a period.
#[derive(Debug, Serialize)]
pub struct ExtremesDto {
    pub coin: String,
    pub currency: String,
    pub period: String,
    pub highest: String,
    pub lowest: String,
}

impl From<&PriceExtremes> for ExtremesDto {
    fn from(e: &PriceExtremes) -> Self {
        Self {
            coin: e.coin.symbol().to_string(),
            currency: e.currency.code().to_uppercase(),
            period: format!("{:?}", e.period).to_lowercase(),
            highest: e.highest.to_string(),
            lowest: e.lowest.to_string(),
        }
    }
}

/// One point in a chart series.
#[derive(Debug, Serialize)]
pub struct PricePointDto {
    pub value: String,
    pub observed_at: String,
}

impl From<&PricePoint> for PricePointDto {
    fn from(p: &PricePoint) -> Self {
        Self {
            value: p.value.to_string(),
            observed_at: p.observed_at.to_rfc3339(),
        }
    }
}