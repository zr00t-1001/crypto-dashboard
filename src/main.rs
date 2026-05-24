use std::sync::Arc;
use tokio::sync::broadcast;
use crypto_dashboard::application::ports::PriceRepository;
use crypto_dashboard::application::use_cases::PollPricesUseCase;
use crypto_dashboard::domain::entities::Price;
use crypto_dashboard::infrastructure::config::Config;
use crypto_dashboard::infrastructure::external::coingecko::CoinGeckoProvider;
use crypto_dashboard::infrastructure::persistence::postgres::{self, PgPriceRepository};
use crypto_dashboard::infrastructure::scheduler;
use crypto_dashboard::presentation::{handlers::AppState, router::build_router};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env into the environment.
    dotenvy::dotenv().ok();

    // Initialize logging.
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    // Load typed config.
    let config = Config::from_env()?;
    tracing::info!(ssl_mode = ?config.db_ssl_mode, "configuration loaded");

    // Build the TLS-enabled connection pool.
    let pool = postgres::create_pool(&config).await?;
    tracing::info!("connection pool created");

    // Prove the encrypted connection works.
    postgres::health_check(&pool).await?;
    tracing::info!("database health check passed — encrypted connection is live");

    // --- Build the adapters (concrete implementations of the ports). ---
    let provider = Arc::new(CoinGeckoProvider::new());
    let repository = Arc::new(PgPriceRepository::new(pool.clone()));

    // Wire provider + repository into the polling use case (via the port traits).
    let poll_use_case = Arc::new(PollPricesUseCase::new(provider, repository.clone()));

    // --- Broadcast channel: one sender, shared by the loop and the WS state. ---
    // Each tick the loop sends a Vec<Price>; each WS client subscribes a receiver.
    let (tx, _rx) = broadcast::channel::<Vec<Price>>(16);

    // --- Spawn the polling loop as a background task. ---
    let interval = config.poll_interval_seconds;
    let tx_for_loop = tx.clone();
    let poll_handle = tokio::spawn(async move {
        scheduler::run_polling_loop(poll_use_case, interval, tx_for_loop).await;
    });

    // --- Build the HTTP server, sharing the repository + broadcaster via state. ---
    let repo_dyn: Arc<dyn PriceRepository> = repository.clone();
    let state = AppState {
        repository: repo_dyn,
        broadcaster: tx,
    };
    let app = build_router(state);

    let listener = tokio::net::TcpListener::bind("127.0.0.1:8080").await?;
    tracing::info!("HTTP server listening on http://127.0.0.1:8080");

    // Run the server with graceful shutdown on Ctrl+C.
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            tokio::signal::ctrl_c().await.ok();
            tracing::info!("HTTP server shutting down");
        })
        .await?;

    // Wind down the polling task once the server stops.
    poll_handle.abort();
    tracing::info!("shutdown complete");
    Ok(())
}