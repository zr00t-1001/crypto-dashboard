use std::sync::Arc;
use std::time::Duration;

use tokio::sync::broadcast;
use tokio::time::{interval, MissedTickBehavior};

use crate::application::use_cases::PollPricesUseCase;
use crate::domain::entities::Price;

/// Run the polling loop, broadcasting each saved batch to subscribers.
pub async fn run_polling_loop(
    use_case: Arc<PollPricesUseCase>,
    interval_secs: u64,
    broadcaster: broadcast::Sender<Vec<Price>>,
) {
    let mut ticker = interval(Duration::from_secs(interval_secs));
    ticker.set_missed_tick_behavior(MissedTickBehavior::Skip);

    tracing::info!(interval_secs, "price polling loop started");

    loop {
        tokio::select! {
            _ = ticker.tick() => {
                match use_case.execute().await {
                    Ok(prices) => {
                        let count = prices.len();
                        tracing::info!(count, "poll cycle saved prices");
                        // Broadcast to any connected WS clients. An error here
                        // only means there are zero subscribers — that's fine.
                        let _ = broadcaster.send(prices);
                    }
                    Err(e) => {
                        tracing::warn!(error = %e, "poll cycle failed, continuing");
                    }
                }
            }
            _ = tokio::signal::ctrl_c() => {
                tracing::info!("shutdown signal received, stopping polling loop");
                break;
            }
        }
    }

    tracing::info!("polling loop stopped");
}