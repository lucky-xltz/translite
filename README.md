# 轻译 - AI 智能翻译工具

基于 Tauri + Vue 3 + TypeScript 构建的跨平台翻译应用。

## 功能特性

- 🤖 **AI 翻译** - 支持 Gemini、OpenAI 等多模型
- ⚡ **全局快捷键** - Cmd/Ctrl+Shift+T 快速呼出
- 🖥️ **系统托盘** - 后台运行，不占用 Dock
- 🔄 **开机自启** - 登录自动启动
- 🌐 **多平台** - 支持 Windows、macOS、Linux

## 技术栈

- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **后端**: Tauri 2.x + Rust
- **AI**: OpenAI SDK (兼容 Gemini、Claude 等)

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run tauri dev

# 构建
npm run tauri build
```

## 构建平台

- Windows (.exe)
- macOS ARM (.dmg) - Apple Silicon
- macOS Intel (.dmg)
- Linux (.AppImage)

## 快捷键

- `Cmd/Ctrl+Shift+T` - 全局呼出翻译窗口
- `Cmd/Ctrl+Enter` - 快捷翻译
