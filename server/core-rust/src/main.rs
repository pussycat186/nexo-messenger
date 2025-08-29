use axum::{
    extract::ws::{WebSocket, WebSocketUpgrade},
    extract::{Path, Query, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::sync::RwLock;
use tower_http::cors::CorsLayer;
use tracing::{info, warn};
use tracing_subscriber;

mod cosign;
mod merkle;
mod metrics;
mod routes;
mod storage;
mod ws;

use crate::{
    metrics::metrics_handler,
    routes::{health_handler, register_handler, sth_chain_handler, sth_latest_handler},
    storage::FileStorage,
    ws::websocket_handler,
};

#[derive(Clone)]
pub struct AppState {
    storage: Arc<FileStorage>,
    ws_sessions: Arc<RwLock<HashMap<String, tokio::sync::mpsc::UnboundedSender<String>>>>,
}

fn init_tracing() {
    let _ = tracing_subscriber::fmt().with_target(false).try_init();
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();

    let storage = Arc::new(FileStorage::new("server/_data")?);
    let ws_sessions = Arc::new(RwLock::new(HashMap::new()));

    let state = AppState {
        storage,
        ws_sessions,
    };

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/did/register", post(register_handler))
        .route("/sth/latest", get(sth_latest_handler))
        .route("/sth/chain", get(sth_chain_handler))
        .route("/metrics", get(metrics_handler))
        .route("/ws/:session_id", get(websocket_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port = std::env::var("PORT").unwrap_or_else(|_| "8000".to_string());
    let addr: SocketAddr = format!("0.0.0.0:{}", port).parse()?;

    info!("NEXO core-rust server starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
