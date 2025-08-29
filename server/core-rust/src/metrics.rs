use axum::{extract::State, response::Response, http::{StatusCode, header}};
use crate::AppState;

pub async fn metrics_handler(State(state): State<AppState>) -> Result<Response, StatusCode> {
    let users_count = state.storage.get_user_count().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let sth_count = state.storage.get_sth_count().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let ws_sessions = state.ws_sessions.read().await.len();

    let latest_sth = state.storage.get_latest_sth().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let last_sth_timestamp = latest_sth.map(|sth| sth.timestamp).unwrap_or(0);

    let metrics = format!(
        "# HELP process_up Whether the process is running\n\
         # TYPE process_up gauge\n\
         process_up 1\n\
         \n\
         # HELP users_count Total number of registered users\n\
         # TYPE users_count gauge\n\
         users_count {}\n\
         \n\
         # HELP sth_count Total number of STH entries\n\
         # TYPE sth_count gauge\n\
         sth_count {}\n\
         \n\
         # HELP ws_sessions Number of active WebSocket sessions\n\
         # TYPE ws_sessions gauge\n\
         ws_sessions {}\n\
         \n\
         # HELP last_sth_timestamp Timestamp of the latest STH\n\
         # TYPE last_sth_timestamp gauge\n\
         last_sth_timestamp {}\n",
        users_count, sth_count, ws_sessions, last_sth_timestamp
    );

    Ok(Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, "text/plain; charset=utf-8")
        .body(metrics.into())
        .unwrap())
}
