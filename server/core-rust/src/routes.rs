use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::Json,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::AppState;

#[derive(Serialize)]
pub struct HealthResponse {
    status: String,
    timestamp: i64,
    users_count: usize,
    sth_count: usize,
}

#[derive(Deserialize)]
pub struct DIDRegistration {
    id: String,
    public_key: String,
    timestamp: i64,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct STH {
    tree_size: usize,
    root: String,
    prev_hash: String,
    policy: Policy,
    timestamp: i64,
    signatures: Vec<Signature>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Policy {
    t: u8,
    n: u8,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Signature {
    cosigner: String,
    sig: String,
}

#[derive(Deserialize)]
pub struct ChainQuery {
    limit: Option<usize>,
}

pub async fn health_handler(State(state): State<AppState>) -> Result<Json<HealthResponse>, StatusCode> {
    let users_count = state.storage.get_user_count().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let sth_count = state.storage.get_sth_count().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    Ok(Json(HealthResponse {
        status: "healthy".to_string(),
        timestamp: chrono::Utc::now().timestamp(),
        users_count,
        sth_count,
    }))
}

pub async fn register_handler(
    State(state): State<AppState>,
    Json(registration): Json<DIDRegistration>,
) -> Result<Json<HashMap<String, String>>, StatusCode> {
    // Implementation would mirror the TypeScript version
    // This is a skeleton for CI compilation
    Ok(Json(HashMap::from([
        ("message".to_string(), "DID registered successfully".to_string())
    ])))
}

pub async fn sth_latest_handler(State(state): State<AppState>) -> Result<Json<STH>, StatusCode> {
    match state.storage.get_latest_sth().await {
        Ok(Some(sth)) => Ok(Json(sth)),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

pub async fn sth_chain_handler(
    State(state): State<AppState>,
    Query(params): Query<ChainQuery>,
) -> Result<Json<Vec<STH>>, StatusCode> {
    let limit = params.limit.unwrap_or(10);
    match state.storage.list_sth(limit).await {
        Ok(chain) => Ok(Json(chain)),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
