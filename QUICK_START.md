# 🚀 快速开始指南

欢迎使用爱下 - 微信视频下载器！本指南将帮助您在几分钟内开始使用。

## 📥 安装

### 方式一：下载预编译版本（推荐）

1. 访问 [Releases 页面](https://github.com/will-17173/electron-weixin-channels-downloader/releases)
2. 下载适合您系统的安装包：
   - **Windows**: `wxdown-setup-1.0.0.exe`
   - **macOS**: `wxdown-1.0.0.dmg`
   - **Linux**: `wxdown-1.0.0.AppImage`

### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/will-17173/electron-weixin-channels-downloader.git
cd electron-weixin-channels-downloader

# 安装依赖
npm install

# 启动开发版本
npm run dev
```

## ⚡ 5分钟快速上手

### 第一步：启动应用

以**管理员身份**运行应用（Windows/Linux）或信任开发者（macOS）

### 第二步：安装证书

1. 首次启动时，应用会提示安装证书
2. 点击"安装证书"按钮
3. 按照系统提示将证书添加到信任列表
4. **重要**：重启浏览器使证书生效

### 第三步：启动代理

1. 在应用主界面点击"启动代理"按钮
2. 确认状态显示为"运行中"
3. 代理地址：`127.0.0.1:57392`（自动配置）

### 第四步：开始捕获

1. 在微信中打开视频号页面
2. 浏览视频内容，应用会自动捕获
3. 在应用的视频列表中查看捕获的内容

### 第五步：下载视频

1. 选择要下载的视频
2. 点击下载按钮或批量下载
3. 监控下载进度
4. 完成后打开文件位置

## 🔧 常见问题快速解决

### 证书问题
```bash
# Windows - 以管理员身份运行
右键应用图标 → "以管理员身份运行"

# macOS - 信任开发者
系统偏好设置 → 安全性与隐私 → 允许应用
```

### 代理连接问题
- 检查端口57392是否被占用
- 临时关闭防火墙和其他代理软件
- 重启应用和微信

### 下载失败
- 检查网络连接
- 确认磁盘空间充足
- 尝试重新下载

## 📞 获取帮助

- 📖 [完整文档](README.md)
- ❓ [常见问题](docs/FAQ.md)
- 🐛 [报告问题](https://github.com/will-17173/electron-weixin-channels-downloader/issues)
- 💬 [社区讨论](https://github.com/will-17173/electron-weixin-channels-downloader/discussions)

## 🎯 下一步

- 🎨 自定义下载路径和文件命名
- 📊 查看详细的监控统计
- ⚙️ 调整代理和下载设置
- 📚 阅读完整的用户手册

---

<div align="center">
  <p>🎉 祝您使用愉快！</p>
  <p><sub>如有问题，随时联系我们</sub></p>
</div>
