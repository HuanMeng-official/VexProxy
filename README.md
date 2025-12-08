# VexProxy

A lightweight proxy control extension built on the **Chrome Manifest V3** specification.

[English](./README.md) | [中文](./README/README_zh.md)

## ✨ Features

*   **⚡️ Modern Core**: Built entirely on the Chrome MV3 standard for enhanced performance and security.
*   **🎨 Minimalist Aesthetics**:
    *   **Light Mode**: Pure white minimalist style, clean and refreshing.
    *   **Dark Mode**: Perfectly adapts to the system's dark mode.
*   **🛡 Smart Safeguards**:
    *   **Built-in Conflict Detection**: Automatically identifies and alerts if proxy permissions are preempted by other extensions like SwitchyOmega.
    *   **Automatic Local Bypass**: Ignores `localhost`, `127.0.0.1`, and LAN traffic by default to prevent development environment loops.
*   **💾 Auto-Save**: Remembers your last input IP and port, eliminating the need for repetitive configuration.
*   **🔌 Dual Protocol Support**: Perfectly supports both **HTTP** and **SOCKS5** proxy modes.

## 📂 Project Structure

Before using, please ensure your project directory contains the following files:

```text
.
├── manifest.json   # Extension configuration file
├── popup.html      # User Interface (HTML + CSS)
└── popup.js        # Core Logic (JS)
```

## 🛠 Installation Guide

1.  Download the source code and place it in a folder (e.g., named `vex`).
2.  Enter `chrome://extensions/` in your Chrome address bar and press Enter.
3.  Toggle on the **"Developer mode"** switch in the top right corner.
4.  Click **"Load unpacked"** in the top left corner.
5.  Select the folder from Step 1.
6.  Installation successful! It is recommended to click the puzzle icon in the browser's top right corner to **Pin** this extension to the toolbar.

## 📖 Usage

### Using with Clash

1.  Ensure **Clash** (Clash for Windows / ClashX / Clash Verge) is running on your computer.
2.  Click the extension icon in the browser toolbar.
3.  **Configure Parameters**:
    *   **Protocol**: Recommended `SOCKS5` (more accurate resolution, supports UDP).
    *   **Server IP**: Defaults to `127.0.0.1`.
    *   **Port**: Clash usually defaults to `7890` (SOCKS5 is sometimes 7891; check the "Mixed Port" in your Clash settings).
4.  Click **"Connect Now"**.
    *   **Connected**: The icon turns green with a breathing animation.
    *   **Disconnected**: Click the button again to return to direct connection.

## ❓ FAQ

### Q: It says "Permission Controlled by Other Extensions" after clicking connect?
**A:** Chrome limits control of proxy settings to one extension at a time. If you have installed **SwitchyOmega**, **Proxy Switcher**, or other VPN extensions, please **Disable** them in the extension management page first, then refresh this extension.

### Q: Cannot access `localhost`?
**A:** Don't worry. This extension has a built-in whitelist mechanism. Local addresses such as `localhost`, `127.0.0.1`, and `192.168.*` are automatically bypassed (direct connection) and will not affect local development.

## 🔒 Privacy Policy

This extension **does not collect** any user data.
*   `storage` permission: Used only to locally cache the IP and Port you entered in the browser.
*   `proxy` permission: Used only to invoke the Chrome API to set the browser proxy.

## 📄 License

MIT License