// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{AboutMetadata, CustomMenuItem, Manager, Menu, MenuItem, Submenu};
use tauri::{SystemTray, SystemTrayMenu};

use api::*;
use storage::Storage;

mod api;
mod app_config;
mod md_to_html;
mod state;
mod storage;

fn main() {
    init_tracing_subscriber();

    let menu = build_menu();

    let app = tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_current_path,
            list_current_directory,
            list_directory,
            change_directory,
            get_md_content,
        ])
        .menu(menu)
        // .setup(|app| {
        //     let event_handler = app.listen_global("show_file_context_menu", |event| {
        //         if let Some(data) = event.payload() {
        //             let (path, x, y): (&str, f32, f32) = serde_json::from_str(data).unwrap();
        //             println!("Path: {}, x: {}, y: {}", path, x, y);
        //         }
        //     });
        //     Ok(())
        // })
        .manage(storage::Storage::default())
        .build(tauri::generate_context!())
        .expect("error while running tauri application");
    app.run(|_app_hadle, event| match event {
        tauri::RunEvent::ExitRequested { .. } => {
            let storage = _app_hadle.state::<Storage>().inner().clone();
            storage.save_to_disk();
        }
        _ => (),
    });
}

fn build_menu() -> Menu {
    let menu = Menu::new().add_submenu(Submenu::new(
        "MDog",
        Menu::new()
            .add_native_item(MenuItem::About(
                "MDog".to_string(),
                AboutMetadata::default(),
            ))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Services)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Hide)
            .add_native_item(MenuItem::HideOthers)
            .add_native_item(MenuItem::ShowAll)
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit),
    ));

    let menu = menu.add_submenu(Submenu::new(
        "Window",
        Menu::new()
            .add_native_item(MenuItem::EnterFullScreen)
            .add_native_item(MenuItem::CloseWindow),
    ));
    menu
}

fn init_tracing_subscriber() {
    // let app_conf = configuration::AppConfig::load_configuration().unwrap();

    // // Make sure log directory exists
    // if !app_conf.log_dir.exists() {
    //     std::fs::DirBuilder::new()
    //         .create(&app_conf.log_dir)
    //         .expect("Failed to create buzzoperator's log directory!");
    // }

    let subscriber = tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_level(true)
        .finish();
    // .with(
    //     tracing_subscriber::fmt::layer().with_writer(
    //         std::fs::File::options()
    //             .create(true)
    //             .append(true)
    //             .write(true)
    //             .open(app_conf.log_dir.join("buzzoperator.log"))
    //             .expect("Can't open log file!"),
    //     ),
    // );
    tracing::subscriber::set_global_default(subscriber).expect("Failed to set up tracing");
}
