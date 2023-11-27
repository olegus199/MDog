use serde::Serialize;
use tauri::State;

use crate::{md_to_html::parse, storage::Storage};

#[derive(Serialize)]
pub struct Entry {
    // Can be `folder` or `file`
    entry_type: String,
    name: String,
}

#[tauri::command]
pub fn get_current_path(storage: State<Storage>) -> String {
    storage.get_current_dir()
}

#[tauri::command]
pub fn list_current_directory(storage: State<Storage>) -> Result<Vec<Entry>, String> {
    list_dir(&storage.get_current_dir())
}

#[tauri::command]
pub fn list_directory(directory: &str) -> Result<Vec<Entry>, String> {
    list_dir(directory)
}

#[tauri::command]
pub fn change_directory(storage: State<Storage>, to: &str) -> Result<String, String> {
    storage.change_current_dir(to)
}

#[tauri::command]
pub fn get_md_content(file_path: &str) -> Result<String, String> {
    // let content = std::fs::read_to_string(file_path).map_err(|e| e.to_string())?;

    // Ok(parse(&content, crate::state::State::default().syntax_color))
    Ok(parse(
        file_path,
        crate::state::State::default().syntax_color,
    ))
}

pub fn list_dir(directory: &str) -> Result<Vec<Entry>, String> {
    let paths = std::fs::read_dir(directory).map_err(|e| e.to_string())?;
    let mut output = Vec::new();
    for path in paths {
        if let Ok(entry) = path {
            if let Ok(filetype) = entry.file_type() {
                let entry_type = String::from(if filetype.is_dir() { "folder" } else { "file" });
                let name = entry.file_name().to_string_lossy().to_string();
                output.push(Entry { entry_type, name });
            }
        }
    }

    Ok(output)
}
