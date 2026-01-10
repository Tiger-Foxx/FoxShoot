use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Emitter,
};
use std::env;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Parse CLI arguments for --enhance flag
    let args: Vec<String> = env::args().collect();
    let mut enhance_file: Option<String> = None;
    
    for i in 0..args.len() {
        if args[i] == "--enhance" && i + 1 < args.len() {
            enhance_file = Some(args[i + 1].clone());
            break;
        }
        // Also handle direct file path as argument (Windows shell integration)
        if i > 0 && !args[i].starts_with("-") && !args[i].starts_with("--") {
            // Check if it looks like a file path
            if args[i].contains("\\") || args[i].contains("/") || args[i].contains(".") {
                enhance_file = Some(args[i].clone());
                break;
            }
        }
    }
    
    let enhance_file_clone = enhance_file.clone();

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(move |app| {
            // Debug logging
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // If --enhance was passed, emit event to frontend after window is ready
            if let Some(file_path) = enhance_file_clone.clone() {
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    // Wait a bit for frontend to be ready
                    std::thread::sleep(std::time::Duration::from_millis(1500));
                    let _ = app_handle.emit("enhance-file", file_path);
                });
            }

            // Create System Tray
            let show_item = MenuItem::with_id(app, "show", "Show FoxShoot", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    // Double-click or left click to show window
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            // Hide to tray instead of closing
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // Prevent the window from actually closing
                api.prevent_close();
                // Hide it instead
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
