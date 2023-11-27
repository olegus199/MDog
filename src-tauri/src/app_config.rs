use std::ffi::OsString;
use std::io::BufWriter;
use std::io::Write;
use std::path::PathBuf;

use serde::Deserialize;
use serde::Serialize;

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AppConfig {
    pub(crate) last_dir: PathBuf,
}

impl AppConfig {
    pub(crate) fn get_config() -> Self {
        // Create config directory in $HOME/.config
        match std::fs::DirBuilder::new().create(Self::get_conf_dir().clone()) {
            Ok(()) => tracing::info!("Config directory created!"),
            Err(e) => tracing::warn!("Error create config directory: {}", e),
        }

        // Initialise our configuration reader
        let config = match config::Config::builder()
            .add_source(config::File::with_name(
                Self::get_conf_file().to_str().unwrap(),
            ))
            .build()
        {
            Ok(config) => config,
            Err(e) => {
                tracing::warn!("Error: {}, creating new config", e);
                Self::write_default()
            }
        };

        config.try_deserialize().unwrap()
    }

    pub(crate) fn write_default() -> config::Config {
        tracing::info!("Write default config");
        let config = serde_yaml::to_string(&AppConfig::init()).unwrap();
        let mut buf = BufWriter::new(std::fs::File::create(Self::get_conf_file()).unwrap());
        buf.write_all(config.as_bytes()).unwrap();
        buf.flush().unwrap();
        config::Config::builder()
            .add_source(config::File::with_name(
                Self::get_conf_file().to_str().unwrap(),
            ))
            .build()
            .unwrap()
    }

    pub(crate) fn write_current(&self) {
        let config = serde_yaml::to_string(self).unwrap();
        tracing::info!("Writing current config to disk: {}", config);
        let mut buf = BufWriter::new(std::fs::File::create(Self::get_conf_file()).unwrap());
        buf.write_all(config.as_bytes()).unwrap();
        buf.flush().unwrap();
    }

    pub(crate) fn init() -> Self {
        AppConfig {
            last_dir: Self::get_home(),
        }
    }

    pub(crate) fn get_home() -> PathBuf {
        std::env::vars_os()
            .find(|(key, _)| OsString::from("HOME").eq(key))
            .expect("Can't get $HOME env variable!")
            .1
            .into()
    }

    pub(crate) fn get_conf_dir() -> PathBuf {
        Self::get_home().join(".config/MDog")
    }

    pub(crate) fn get_conf_file() -> PathBuf {
        Self::get_conf_dir().join("mdog.yaml")
    }
}
