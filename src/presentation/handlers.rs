use axum::body::Body;
use axum::http::header;
use axum::response::Response;
use axum::{
    Json,
    extract::{Query, State},
    http::StatusCode,
};
use serde::Deserialize;
use std::sync::Arc;

use crate::application::ports::PriceRepository;
use crate::domain::entities::Price;
use crate::domain::entities::{Coin, Currency, Period};
use crate::presentation::dto::{ExtremesDto, PriceDto, PricePointDto};
use tokio::sync::broadcast;

/// Shared application state for all handlers.

#[derive(Clone)]
pub struct AppState {
    pub repository: Arc<dyn PriceRepository>,
    pub broadcaster: broadcast::Sender<Vec<Price>>,
}

/// Query params for endpoints that take coin/currency/period.
#[derive(Debug, Deserialize)]
pub struct PriceQuery {
    pub coin: String,
    pub currency: String,
    pub period: String,
}

/// Parse the query strings into domain enums, returning 400 on bad input.
fn parse_query(q: &PriceQuery) -> Result<(Coin, Currency, Period), (StatusCode, String)> {
    let coin = Coin::from_symbol(&q.coin).map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
    let currency =
        Currency::from_code(&q.currency).map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
    let period =
        Period::from_str_label(&q.period).map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))?;
    Ok((coin, currency, period))
}

/// GET /api/health
pub async fn health() -> &'static str {
    "ok"
}

/// GET /api/prices/latest — newest price for every coin/currency pair.
pub async fn latest_prices(
    State(state): State<AppState>,
) -> Result<Json<Vec<PriceDto>>, (StatusCode, String)> {
    let mut out = Vec::new();
    for coin in Coin::ALL {
        for currency in Currency::ALL {
            if let Some(price) = state
                .repository
                .latest_price(coin, currency)
                .await
                .map_err(internal_err)?
            {
                out.push(PriceDto::from(&price));
            }
        }
    }
    Ok(Json(out))
}

/// GET /api/prices/extremes?coin=BTC&currency=USD&period=day
pub async fn extremes(
    State(state): State<AppState>,
    Query(q): Query<PriceQuery>,
) -> Result<Json<Option<ExtremesDto>>, (StatusCode, String)> {
    let (coin, currency, period) = parse_query(&q)?;
    let result = state
        .repository
        .extremes(coin, currency, period)
        .await
        .map_err(internal_err)?;
    Ok(Json(result.as_ref().map(ExtremesDto::from)))
}

/// GET /api/prices/series?coin=BTC&currency=USD&period=day
pub async fn series(
    State(state): State<AppState>,
    Query(q): Query<PriceQuery>,
) -> Result<Json<Vec<PricePointDto>>, (StatusCode, String)> {
    let (coin, currency, period) = parse_query(&q)?;
    let points = state
        .repository
        .series(coin, currency, period)
        .await
        .map_err(internal_err)?;
    Ok(Json(points.iter().map(PricePointDto::from).collect()))
}

fn internal_err<E: std::fmt::Display>(e: E) -> (StatusCode, String) {
    (StatusCode::INTERNAL_SERVER_ERROR, e.to_string())
}
/// GET /api/prices/export?coin=BTC&currency=USD&period=month
/// Returns the price series as a downloadable CSV file.
pub async fn export_csv(
    State(state): State<AppState>,
    Query(q): Query<PriceQuery>,
) -> Result<Response, (StatusCode, String)> {
    let (coin, currency, period) = parse_query(&q)?;

    let points = state
        .repository
        .series(coin, currency, period)
        .await
        .map_err(internal_err)?;

    // Build CSV in memory.
    let mut wtr = csv::Writer::from_writer(Vec::new());

    // Header row.
    wtr.write_record(["coin", "currency", "value", "observed_at"])
        .map_err(internal_err)?;

    // Data rows.
    for p in &points {
        wtr.write_record([
            coin.symbol(),
            &currency.code().to_uppercase(),
            &p.value.to_string(),
            &p.observed_at.to_rfc3339(),
        ])
        .map_err(internal_err)?;
    }

    let data = wtr.into_inner().map_err(internal_err)?;

    // Build a filename like "BTC_USD_month_prices.csv".
    let filename = format!(
        "{}_{}_{}_prices.csv",
        coin.symbol(),
        currency.code().to_uppercase(),
        q.period.to_lowercase()
    );

    let response = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/csv; charset=utf-8")
        .header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", filename),
        )
        .body(Body::from(data))
        .map_err(internal_err)?;

    Ok(response)
}
