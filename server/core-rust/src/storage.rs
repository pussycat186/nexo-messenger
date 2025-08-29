use std::{fs::OpenOptions, io::{BufRead, BufReader, Write}, path::PathBuf};
use serde::{Deserialize, Serialize};
use crate::routes::STH;

#[derive(Serialize, Deserialize)]
pub struct UserRegistration {
    pub id: String,
    pub public_key: String,
    pub timestamp: i64,
    pub leaf_hash: String,
}

pub struct FileStorage {
    users_file: PathBuf,
    sth_file: PathBuf,
}

impl FileStorage {
    pub fn new(data_dir: &str) -> anyhow::Result<Self> {
        let data_path = PathBuf::from(data_dir);
        std::fs::create_dir_all(&data_path)?;
        
        Ok(FileStorage {
            users_file: data_path.join("users.jsonl"),
            sth_file: data_path.join("sth.jsonl"),
        })
    }

    pub async fn get_user_count(&self) -> anyhow::Result<usize> {
        let count = tokio::task::spawn_blocking({
            let file_path = self.users_file.clone();
            move || -> anyhow::Result<usize> {
                if !file_path.exists() {
                    return Ok(0);
                }
                let file = std::fs::File::open(file_path)?;
                let reader = BufReader::new(file);
                Ok(reader.lines().count())
            }
        }).await??;
        
        Ok(count)
    }

    pub async fn get_sth_count(&self) -> anyhow::Result<usize> {
        let count = tokio::task::spawn_blocking({
            let file_path = self.sth_file.clone();
            move || -> anyhow::Result<usize> {
                if !file_path.exists() {
                    return Ok(0);
                }
                let file = std::fs::File::open(file_path)?;
                let reader = BufReader::new(file);
                Ok(reader.lines().count())
            }
        }).await??;
        
        Ok(count)
    }

    pub async fn append_user_registration(&self, user: UserRegistration) -> anyhow::Result<()> {
        let json_line = serde_json::to_string(&user)? + "\n";
        
        tokio::task::spawn_blocking({
            let file_path = self.users_file.clone();
            move || -> anyhow::Result<()> {
                let mut file = OpenOptions::new()
                    .create(true)
                    .append(true)
                    .open(file_path)?;
                file.write_all(json_line.as_bytes())?;
                file.sync_all()?;
                Ok(())
            }
        }).await??;
        
        Ok(())
    }

    pub async fn get_latest_sth(&self) -> anyhow::Result<Option<STH>> {
        let sth = tokio::task::spawn_blocking({
            let file_path = self.sth_file.clone();
            move || -> anyhow::Result<Option<STH>> {
                if !file_path.exists() {
                    return Ok(None);
                }
                
                let file = std::fs::File::open(file_path)?;
                let reader = BufReader::new(file);
                let lines: Vec<String> = reader.lines().collect::<Result<Vec<_>, _>>()?;
                
                if let Some(last_line) = lines.last() {
                    let sth: STH = serde_json::from_str(last_line)?;
                    Ok(Some(sth))
                } else {
                    Ok(None)
                }
            }
        }).await??;
        
        Ok(sth)
    }

    pub async fn list_sth(&self, limit: usize) -> anyhow::Result<Vec<STH>> {
        let sth_list = tokio::task::spawn_blocking({
            let file_path = self.sth_file.clone();
            move || -> anyhow::Result<Vec<STH>> {
                if !file_path.exists() {
                    return Ok(vec![]);
                }
                
                let file = std::fs::File::open(file_path)?;
                let reader = BufReader::new(file);
                let lines: Vec<String> = reader.lines().collect::<Result<Vec<_>, _>>()?;
                
                let mut sth_list: Vec<STH> = lines.iter()
                    .map(|line| serde_json::from_str(line))
                    .collect::<Result<Vec<_>, _>>()?;
                
                // Newest first
                sth_list.reverse();
                sth_list.truncate(limit);
                
                Ok(sth_list)
            }
        }).await??;
        
        Ok(sth_list)
    }
}
