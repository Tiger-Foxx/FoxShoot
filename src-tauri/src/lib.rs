use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Emitter,
};
use std::env;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Handle additional instances - send files to main instance
            eprintln!("Single instance triggered with args: {:?}", args);
            
            let files: Vec<String> = args
                .into_iter()
                .filter(|arg| !arg.starts_with("-") && !arg.starts_with("--"))
                .filter(|arg| arg.contains("\\") || arg.contains("/") || arg.contains("."))
                .collect();
            
            if !files.is_empty() {
                eprintln!("Emitting enhance-files event with {} files", files.len());
                let _ = app.emit("enhance-files", files);
            }
            
            // Focus the main window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .setup(move |app| {
            // Debug logging in development
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Parse CLI arguments for --enhance flag or direct file paths
            let args: Vec<String> = env::args().collect();
            let mut files: Vec<String> = Vec::new();
            
            for i in 0..args.len() {
                if args[i] == "--enhance" && i + 1 < args.len() {
                    files.push(args[i + 1].clone());
                } else if i > 0 && !args[i].starts_with("-") && !args[i].starts_with("--") {
                    // Check if it looks like a file path
                    if args[i].contains("\\") || args[i].contains("/") || args[i].contains(".") {
                        files.push(args[i].clone());
                    }
                }
            }
            
            // If files were found, emit event to frontend after window is ready
            if !files.is_empty() {
                let app_handle = app.handle().clone();
                let files_clone = files.clone();
                std::thread::spawn(move || {
                    // Wait a bit for frontend to be ready
                    std::thread::sleep(std::time::Duration::from_millis(1500));
                    eprintln!("Emitting enhance-files event with {} files", files_clone.len());
                    let _ = app_handle.emit("enhance-files", files_clone);
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
