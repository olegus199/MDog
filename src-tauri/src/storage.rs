use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

use crate::app_config;

#[derive(Debug)]
struct StorageInner {
    config: app_config::AppConfig,
    current_dir: PathBuf,
}

#[derive(Clone)]
pub struct Storage(Arc<Mutex<StorageInner>>);

impl Default for Storage {
    fn default() -> Self {
        let config = app_config::AppConfig::get_config();
        let current_dir = config.last_dir.clone();
        Self(Arc::new(Mutex::new(StorageInner {
            config,
            current_dir,
        })))
    }
}

impl Storage {
    pub fn get_current_dir(&self) -> String {
        self.0
            .lock()
            .unwrap()
            .current_dir
            .to_string_lossy()
            .to_string()
    }

    pub fn change_current_dir(&self, to: &str) -> Result<String, String> {
        let mut lock = self.0.lock().unwrap();
        let path = lock.current_dir.join(to);
        tracing::info!("Changing current directory to {}", path.display());
        if path.exists() {
            tracing::info!("Successful changed dir to {}", path.display());
            lock.current_dir = path.clone();
            Ok(String::from("OK"))
        } else {
            tracing::error!("No path: {}", path.display());
            Err(String::from("ERR"))
        }
    }

    pub fn save_to_disk(&self) {
        let mut lock = self.0.lock().unwrap();
        lock.config.last_dir = lock.current_dir.clone();
        lock.config.write_current();
    }
}
