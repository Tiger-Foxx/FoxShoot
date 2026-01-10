use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, Emitter,
};
use std::env;
use std::path::Path;

/// Check if a path looks like a media file (not an executable)
fn is_media_file(path: &str) -> bool {
    let lower = path.to_lowercase();
    // Must have an extension that's a known media type
    let media_extensions = [
        ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif", ".tiff",
        ".mp4", ".mkv", ".avi", ".webm", ".mov", ".wmv", ".flv"
    ];
    media_extensions.iter().any(|ext| lower.ends_with(ext))
}

/// Filter CLI arguments to extract only media file paths
fn extract_media_files(args: Vec<String>) -> Vec<String> {
    args.into_iter()
        .filter(|arg| !arg.starts_with("-") && !arg.starts_with("--"))
        .filter(|arg| is_media_file(arg))
        .filter(|arg| {
            // Must be a valid path (contains path separators or exists)
            arg.contains("\\") || arg.contains("/") || Path::new(arg).exists()
        })
        .collect()
}

/// Change working directory to the exe's folder
/// This ensures the backend engine can be found when launched from context menu
fn set_exe_working_directory() {
    if let Ok(exe_path) = env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            if let Err(e) = env::set_current_dir(exe_dir) {
                eprintln!("Warning: Could not set working directory to {:?}: {}", exe_dir, e);
            } else {
                eprintln!("Working directory set to: {:?}", exe_dir);
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // IMPORTANT: Set working directory to exe location FIRST
    // This fixes "path not found" errors when launching from context menu
    set_exe_working_directory();
    
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // Handle additional instances - send files to main instance
            eprintln!("Single instance triggered with args: {:?}", args);
            
            let files = extract_media_files(args);
            
            if !files.is_empty() {
                eprintln!("Emitting enhance-files event with {} files: {:?}", files.len(), files);
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
            eprintln!("Initial launch args: {:?}", args);
            
            // Skip the first argument (executable path)
            let file_args: Vec<String> = if args.len() > 1 {
                args[1..].to_vec()
            } else {
                Vec::new()
            };
            
            let files = extract_media_files(file_args);
            
            // If files were found, emit event to frontend after window is ready
            if !files.is_empty() {
                let app_handle = app.handle().clone();
                let files_clone = files.clone();
                std::thread::spawn(move || {
                    // Wait a bit for frontend to be ready
                    std::thread::sleep(std::time::Duration::from_millis(1500));
                    eprintln!("Emitting enhance-files event with {} files: {:?}", files_clone.len(), files_clone);
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
