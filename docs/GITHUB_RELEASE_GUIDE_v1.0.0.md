# 🚀 GitHub Release 创建指南 - v1.0.0

本文档指导您如何为"爱下"v1.0.0创建GitHub Release。

## 📋 前置条件

### ✅ 确认清单
- [ ] v1.0.0标签已创建并推送到GitHub
- [ ] 构建包已生成（运行 `scripts/build-release-v1.0.0.ps1`）
- [ ] 构建包已测试验证
- [ ] 发布文档已准备完成

## 🎯 步骤一：准备构建包

### 1. 运行构建脚本
```powershell
# 构建Windows版本
.\scripts\build-release-v1.0.0.ps1 -Platform win

# 或构建所有平台版本
.\scripts\build-release-v1.0.0.ps1 -All
```

### 2. 验证构建输出
检查 `dist/` 目录中的文件：
- **Windows**: `爱下-Setup-1.0.0.exe`, `爱下-1.0.0-win.zip`
- **macOS**: `爱下-1.0.0.dmg`, `爱下-1.0.0-mac.zip`
- **Linux**: `爱下-1.0.0.AppImage`, `爱下-1.0.0.tar.gz`

## 🎯 步骤二：创建GitHub Release

### 1. 访问GitHub仓库
https://github.com/will-17173/electron-weixin-channels-downloader

### 2. 进入Releases页面
- 点击 "Releases" 标签
- 点击 "Create a new release"

### 3. 配置Release信息

#### 标签版本 (Tag version)
```
v1.0.0
```

#### 发布标题 (Release title)
```
🎉 爱下 v1.0.0 - 微信视频号下载器正式版
```

#### 发布说明 (Release description)
```markdown
# 🎉 爱下 v1.0.0 正式发布！

这是"爱下"微信视频号下载器的第一个正式版本！经过精心开发和优化，现在为用户提供稳定、安全、易用的视频下载体验。

## ✨ 核心功能

### 📱 微信视频号下载
- **智能识别**: 自动检测微信视频号中的视频内容
- **高质量下载**: 支持原画质视频下载
- **批量处理**: 支持多个视频同时下载
- **进度显示**: 实时显示下载进度和状态

### 🔧 智能代理系统
- **自动配置**: 一键启动，自动设置系统代理
- **端口**: 使用 `57392` 端口，避免常见冲突
- **安全退出**: 应用退出时自动清理系统代理设置
- **跨平台**: 支持 Windows、macOS、Linux

### 🛡️ SSL证书管理
- **自动生成**: 首次运行自动生成CA证书
- **智能安装**: 自动尝试安装到系统信任列表
- **手动指导**: 提供详细的手动安装指南
- **状态检查**: 实时显示证书安装状态

### 📊 用户分析（可选）
- **Google Analytics 4**: 集成GA4进行用户体验分析
- **隐私保护**: 完全符合GDPR规范
- **用户同意**: 明确的用户同意机制
- **数据透明**: 清楚说明收集的数据类型

## 🚀 快速开始

### 系统要求
- **Windows**: Windows 10 及以上
- **macOS**: macOS 10.14 及以上
- **Linux**: Ubuntu 18.04 及以上

### 安装步骤
1. 下载对应平台的安装包
2. 运行安装程序，按提示完成安装
3. 启动应用（首次运行可能需要管理员权限）
4. 按提示安装SSL证书
5. 访问微信视频号开始下载

## 📥 下载说明

### Windows 用户
- **推荐**: 下载 `爱下-Setup-1.0.0.exe` 进行安装
- **便携版**: 下载 `爱下-1.0.0-win.zip` 解压后直接运行

### macOS 用户
- **推荐**: 下载 `爱下-1.0.0.dmg` 进行安装
- **注意**: 首次运行可能需要在系统设置中允许运行

### Linux 用户
- **AppImage**: 下载 `爱下-1.0.0.AppImage`，添加执行权限后运行
- **压缩包**: 下载 `爱下-1.0.0.tar.gz` 解压后运行

## ⚠️ 重要提醒

- 首次运行需要管理员权限
- 需要安装SSL证书才能正常工作
- 下载的视频仅供个人使用，请遵守版权法规
- 使用过程中如遇问题，请查看[FAQ文档](./FAQ.md)

## 🐛 问题反馈

如遇到问题，请通过以下方式反馈：
- **GitHub Issues**: [提交Bug报告](https://github.com/will-17173/electron-weixin-channels-downloader/issues)
- **邮件联系**: support@wxdown.xyz

## 🙏 致谢

感谢所有测试用户的反馈和建议，让"爱下"能够不断改进和完善！

---

**🔗 项目主页**: https://www.wxdown.xyz
**📖 完整文档**: [查看README](./README.md)
**🆘 使用帮助**: [查看FAQ](./FAQ.md)
```

## 🎯 步骤三：上传构建包

### 1. 添加资产文件
在Release页面底部的 "Attach binaries" 区域：

#### Windows 文件
- 拖拽 `dist/爱下-Setup-1.0.0.exe`
- 拖拽 `dist/爱下-1.0.0-win.zip`

#### macOS 文件
- 拖拽 `dist/爱下-1.0.0.dmg`
- 拖拽 `dist/爱下-1.0.0-mac.zip`

#### Linux 文件
- 拖拽 `dist/爱下-1.0.0.AppImage`
- 拖拽 `dist/爱下-1.0.0.tar.gz`

#### 其他文件
- 拖拽 `CHANGELOG.md` (变更日志)
- 拖拽 `README.md` (项目说明)

### 2. 文件描述建议
为每个文件添加简短描述：

```
爱下-Setup-1.0.0.exe - Windows安装包 (推荐)
爱下-1.0.0-win.zip - Windows便携版
爱下-1.0.0.dmg - macOS安装包 (推荐)
爱下-1.0.0-mac.zip - macOS便携版
爱下-1.0.0.AppImage - Linux AppImage (推荐)
爱下-1.0.0.tar.gz - Linux压缩包
CHANGELOG.md - 完整变更日志
README.md - 项目说明文档
```

## 🎯 步骤四：发布设置

### 配置选项
- [ ] **Set as the latest release**: ✅ 选中（这是最新版本）
- [ ] **Set as a pre-release**: ❌ 不选中（这是正式版本）
- [ ] **Create a discussion for this release**: ✅ 选中（便于用户讨论）

### 发布
点击 **"Publish release"** 按钮完成发布。

## ✅ 发布后验证

### 检查清单
- [ ] Release页面显示正常
- [ ] 所有文件都已上传且可下载
- [ ] 下载链接工作正常
- [ ] Release被标记为"Latest"
- [ ] 标签链接正确

### 测试下载
- [ ] 从不同平台测试下载链接
- [ ] 验证文件完整性
- [ ] 测试安装过程

## 🎉 发布完成

恭喜！您已成功发布"爱下"v1.0.0版本。

### 下一步行动
1. **更新项目主页**: 添加下载链接
2. **社区宣传**: 在相关社区发布公告
3. **用户支持**: 准备处理用户反馈
4. **监控**: 关注下载量和用户反馈

---

**📅 发布日期**: 2025年6月12日
**🏷️ 版本标签**: v1.0.0
**🎯 发布状态**: 准备就绪
