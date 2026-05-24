use axum::{routing::get, Router};
use tower_http::cors::{Any, CorsLayer};
use crate::presentation::websocket::ws_handler;

// inside build_router, add to the Router chain:
       
use crate::presentation::handlers::{self, AppState};

/// Build the application router with all routes and shared state.
pub fn build_router(state: AppState) -> Router {
    // Permissive CORS for development — tighten for production.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/api/health", get(handlers::health))
        .route("/api/prices/latest", get(handlers::latest_prices))
        .route("/api/prices/extremes", get(handlers::extremes))
        .route("/api/prices/series", get(handlers::series))
        .route("/api/ws", get(ws_handler))
        .route("/api/prices/export", get(handlers::export_csv))
        .layer(cors)
        .with_state(state)
}