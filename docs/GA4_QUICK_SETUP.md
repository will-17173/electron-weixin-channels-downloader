# 🚀 GA4 设置快速指南

## 核心答案

### ❓ Electron 应用选择什么数据流？
**✅ 选择"网站"** - 这是正确的选择！

### ❓ 域名填什么？
**✅ 填写：`wxdown.electron.app`** 或者 `localhost`

---

## 📋 3分钟设置步骤

### 1️⃣ 创建 GA4 属性
1. 打开 [Google Analytics](https://analytics.google.com/)
2. 管理 → 创建媒体资源
3. 名称：`爱下 WeChat Video Downloader`

### 2️⃣ 添加数据流
1. 数据流 → 添加流 → **选择"网站"** ✅
2. 网站网址：`https://wxdown.electron.app`
3. 流名称：`爱下桌面应用`

### 3️⃣ 获取配置信息
- **衡量 ID**：`G-XXXXXXXXXX` 格式
- **API 密钥**：到 [Google Cloud Console](https://console.cloud.google.com/) 创建

### 4️⃣ 更新配置
编辑 `analytics.config.json`：
```json
{
  "analytics": {
    "enabled": true,
    "measurementId": "G-您的真实ID",
    "apiSecret": "您的真实密钥"
  }
}
```

---

## ✅ 为什么选择"网站"？

1. **技术兼容**：我们的代码使用 Measurement Protocol，与网站数据流完全兼容
2. **功能完整**：网站流提供最丰富的分析功能
3. **报告全面**：支持我们需要的所有事件和维度

**不用担心**：虽然看起来奇怪，但这是 Electron 应用的标准做法！

---

## 🎯 测试设置

1. 启动应用
2. 在 GA4 查看"实时"报告
3. 应该能看到事件数据

---

**需要详细说明？** 查看 `docs/GA4_DATASTREAM_SETUP_GUIDE.md`
