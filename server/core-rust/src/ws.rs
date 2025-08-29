use axum::{
    extract::{ws::WebSocketUpgrade, Path, State},
    response::Response,
};
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tracing::{info, warn};

use crate::AppState;

#[derive(Serialize, Deserialize)]
struct WSMessage {
    from: String,
    to: String,
    payload: String,
}

pub async fn websocket_handler(
    ws: WebSocketUpgrade,
    Path(session_id): Path<String>,
    State(state): State<AppState>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, session_id, state))
}

async fn handle_socket(mut socket: axum::extract::ws::WebSocket, session_id: String, state: AppState) {
    info!("WebSocket connected: {}", session_id);

    let (tx, mut rx) = mpsc::unbounded_channel();
    
    // Store session
    {
        let mut sessions = state.ws_sessions.write().await;
        sessions.insert(session_id.clone(), tx);
    }

    // Handle incoming messages
    loop {
        tokio::select! {
            msg = socket.recv() => {
                match msg {
                    Some(Ok(msg)) => {
                        if let Ok(text) = msg.to_text() {
                            // Handle relay message
                            if let Ok(ws_msg) = serde_json::from_str::<WSMessage>(text) {
                                // Relay to target session
                                let sessions = state.ws_sessions.read().await;
                                if let Some(target_tx) = sessions.get(&ws_msg.to) {
                                    let _ = target_tx.send(serde_json::to_string(&ws_msg).unwrap_or_default());
                                }
                            }
                        }
                    }
                    _ => break,
                }
            }
            relay_msg = rx.recv() => {
                match relay_msg {
                    Some(msg) => {
                        if socket.send(axum::extract::ws::Message::Text(msg)).await.is_err() {
                            break;
                        }
                    }
                    None => break,
                }
            }
        }
    }

    // Cleanup
    let mut sessions = state.ws_sessions.write().await;
    sessions.remove(&session_id);
    info!("WebSocket disconnected: {}", session_id);
}
