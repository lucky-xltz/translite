use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    pub api_key: String,
    pub model: String,
    pub base_url: String,
    pub auto_start: bool,
    pub hotkey: String,
}

impl Default for Config {
    fn default() -> Self {
        Config {
            api_key: String::new(),
            model: "gemini-2.5-flash-preview-04-17".to_string(),
            base_url: String::new(),
            auto_start: false,
            hotkey: "CmdOrCtrl+Shift+T".to_string(),
        }
    }
}

fn get_config_path() -> PathBuf {
    let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    let config_dir = home.join(".translite");

    if !config_dir.exists() {
        let _ = fs::create_dir_all(&config_dir);
    }

    config_dir.join("config.json")
}

fn load_config_from_file() -> Config {
    let path = get_config_path();

    if !path.exists() {
        let default_config = Config::default();
        if let Ok(json) = serde_json::to_string_pretty(&default_config) {
            let _ = fs::write(&path, json);
        }
        return default_config;
    }

    if let Ok(content) = fs::read_to_string(&path) {
        if let Ok(config) = serde_json::from_str(&content) {
            return config;
        }
    }

    Config::default()
}

#[tauri::command]
fn load_config() -> Result<Config, String> {
    Ok(load_config_from_file())
}

#[tauri::command]
fn save_config(config: Config) -> Result<(), String> {
    let path = get_config_path();
    let json =
        serde_json::to_string_pretty(&config).map_err(|e| format!("序列化配置失败: {}", e))?;

    fs::write(&path, json).map_err(|e| format!("写入配置文件失败: {}", e))?;

    Ok(())
}

#[tauri::command]
fn get_config_path_string() -> String {
    get_config_path().to_string_lossy().to_string()
}

#[tauri::command]
async fn download_file(url: String, dest_path: String) -> Result<(), String> {
    println!("开始下载: {} -> {}", url, dest_path);

    let response = reqwest::get(&url)
        .await
        .map_err(|e| format!("下载请求失败: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("下载失败: HTTP {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("读取下载内容失败: {}", e))?;

    tokio::fs::write(&dest_path, bytes)
        .await
        .map_err(|e| format!("写入文件失败: {}", e))?;

    println!("下载完成: {}", dest_path);
    Ok(())
}

#[tauri::command]
fn get_download_dir() -> Result<String, String> {
    let cache_dir = dirs::cache_dir()
        .ok_or_else(|| "无法获取缓存目录".to_string())?;
    let download_dir = cache_dir.join("translite-updates");

    if !download_dir.exists() {
        std::fs::create_dir_all(&download_dir)
            .map_err(|e| format!("创建下载目录失败: {}", e))?;
    }

    Ok(download_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn open_file(file_path: String) -> Result<(), String> {
    println!("打开文件: {}", file_path);

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("打开文件失败: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &file_path])
            .spawn()
            .map_err(|e| format!("打开文件失败: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("打开文件失败: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn install_update(file_path: String) -> Result<String, String> {
    println!("安装更新: {}", file_path);

    #[cfg(target_os = "macos")]
    {
        if file_path.ends_with(".dmg") {
            let output = std::process::Command::new("hdiutil")
                .args(["attach", &file_path, "-nobrowse", "-noverify"])
                .output()
                .map_err(|e| format!("挂载 dmg 失败: {}", e))?;

            if !output.status.success() {
                return Err(format!("挂载失败: {}", String::from_utf8_lossy(&output.stderr)));
            }

            let dmg_path = std::str::from_utf8(&output.stdout)
                .map_err(|e| format!("解析挂载路径失败: {}", e))?;

            if let Some(app_path) = dmg_path.lines().find(|l| l.contains("/Volumes/")) {
                if let Some(mp) = app_path.split_whitespace().next() {
                    println!("已挂载到: {}", mp);
                    return Ok(format!("已挂载到: {}", mp));
                }
            }

            return Ok(format!("dmg 已挂载: {}", dmg_path));
        }
    }

    #[cfg(target_os = "windows")]
    {
        if file_path.ends_with(".exe") {
            std::process::Command::new(&file_path)
                .args(["/S", "/silent", "/norestart"])
                .spawn()
                .map_err(|e| format!("启动安装程序失败: {}", e))?;
            return Ok("安装程序已启动".to_string());
        }
    }

    #[cfg(target_os = "linux")]
    {
        if file_path.ends_with(".AppImage") {
            std::process::Command::new("chmod")
                .args(["+x", &file_path])
                .spawn()
                .map_err(|e| format!("设置执行权限失败: {}", e))?;

            std::process::Command::new(&file_path)
                .spawn()
                .map_err(|e| format!("启动 AppImage 失败: {}", e))?;
            return Ok("AppImage 已启动".to_string());
        }
    }

    open_file(file_path)?;
    Ok("安装程序已打开".to_string())
}

fn parse_hotkey(hotkey: &str) -> Option<(Option<Modifiers>, Code)> {
    let mut modifiers = Modifiers::empty();
    let key_part: String;

    if hotkey.contains("CmdOrCtrl+") {
        modifiers |= Modifiers::META | Modifiers::CONTROL;
        key_part = hotkey.replace("CmdOrCtrl+", "").replace("+", "");
    } else if hotkey.contains("Cmd+") {
        modifiers |= Modifiers::META;
        key_part = hotkey.replace("Cmd+", "").replace("+", "");
    } else if hotkey.contains("Ctrl+") {
        modifiers |= Modifiers::CONTROL;
        key_part = hotkey.replace("Ctrl+", "").replace("+", "");
    } else if hotkey.contains("Alt+") {
        modifiers |= Modifiers::ALT;
        key_part = hotkey.replace("Alt+", "").replace("+", "");
    } else if hotkey.contains("Shift+") {
        modifiers |= Modifiers::SHIFT;
        key_part = hotkey.replace("Shift+", "").replace("+", "");
    } else {
        key_part = hotkey.to_string();
    }

    let code = match key_part.trim().to_uppercase().as_str() {
        "T" => Code::KeyT,
        "W" => Code::KeyW,
        "E" => Code::KeyE,
        "R" => Code::KeyR,
        "Q" => Code::KeyQ,
        "A" => Code::KeyA,
        "S" => Code::KeyS,
        "D" => Code::KeyD,
        "F" => Code::KeyF,
        "G" => Code::KeyG,
        "H" => Code::KeyH,
        "J" => Code::KeyJ,
        "K" => Code::KeyK,
        "L" => Code::KeyL,
        "Z" => Code::KeyZ,
        "X" => Code::KeyX,
        "C" => Code::KeyC,
        "V" => Code::KeyV,
        "B" => Code::KeyB,
        "N" => Code::KeyN,
        "M" => Code::KeyM,
        _ => return None,
    };

    Some((Some(modifiers), code))
}

#[tauri::command]
fn register_hotkey(app: tauri::AppHandle, hotkey: String) -> Result<(), String> {
    if let Some((modifiers, code)) = parse_hotkey(&hotkey) {
        let shortcut = Shortcut::new(modifiers, code);
        let app_handle = app.clone();

        let _ = app.global_shortcut().unregister_all();

        if let Err(e) =
            app.global_shortcut()
                .on_shortcut(shortcut, move |_app, _shortcut, _event| {
                    if let Some(window) = app_handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                })
        {
            return Err(format!("注册快捷键失败: {}", e));
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            load_config,
            save_config,
            get_config_path_string,
            register_hotkey,
            download_file,
            get_download_dir,
            open_file,
            install_update,
            get_version
        ])
        .setup(|app| {
            // 加载配置并注册快捷键
            let config = load_config_from_file();
            let hotkey = config.hotkey.clone();

            if let Some((modifiers, code)) = parse_hotkey(&hotkey) {
                let shortcut = Shortcut::new(modifiers, code);
                let app_handle = app.handle().clone();

                let _ =
                    app.global_shortcut()
                        .on_shortcut(shortcut, move |_app, _shortcut, _event| {
                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        });
            }

            // 创建系统托盘
            let show = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "隐藏窗口", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show, &hide, &quit])?;

            let _tray = TrayIconBuilder::with_id("main")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            // 监听窗口关闭事件，隐藏而不是退出
            if let Some(window) = app.get_webview_window("main") {
                let window_clone = window.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = window_clone.hide();
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
