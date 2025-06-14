# v1.1.2 Release Report

## 📅 发布日期
2025年6月14日

## 🏷️ 标签信息
- **标签名**: v1.1.2
- **提交**: c4833e25b5b3361957383c2b7b745bbb5f8fdc14
- **标签信息**: "Release v1.1.2 - 添加打开下载文件夹按钮 & 移除CI/CD功能"

## 🚀 主要更新

### 新功能
- ✅ **在视频列表操作区域添加"打开下载文件夹"按钮**
  - 位置：在"清空数据"按钮的右边
  - 图标：📂 文件夹图标
  - 功能：点击后直接打开系统默认的下载文件夹
  - 样式：绿色主题，与现有按钮风格一致

### 架构优化
- ✅ **移除GitHub CI/CD功能**
  - 删除了完整的GitHub Actions工作流
  - 简化了package.json中的构建脚本
  - 移除了electron-builder中的自动发布配置
  - 专注于本地开发和手动发布流程

### 版本更新
- ✅ **版本号升级**: 从 v1.1.1 → v1.1.2

## 🔧 技术细节

### 前端改动
**文件**: `src/renderer/src/components/VideoMonitor.vue`
- 添加了"打开下载文件夹"按钮
- 复用现有的openDownloadFolder方法
- 新增folder-btn CSS样式类

### 配置文件改动
**package.json**:
- 版本号更新到1.1.2
- 移除多平台构建脚本
- 简化npm scripts

**electron-builder.yml**:
- 移除publish配置块

### 文档更新
- 新增：`docs/v1.1.2_DEVELOPMENT_LOG.md`
- 新增：`docs/CICD_REMOVAL_REPORT.md`

## 🎯 用户体验提升
- 用户可以更方便地访问下载的视频文件
- 不需要点击单个视频项来打开文件夹
- 提供了快速访问下载目录的入口

## 🏗️ 发布状态
- ✅ 本地标签创建成功
- ✅ 推送到远程仓库
- ✅ 标签信息完整
- ✅ 版本号与package.json一致

## 📋 后续操作
由于已移除CI/CD功能，需要手动进行发布操作：
1. 使用 `npm run build:win` 构建Windows版本
2. 手动创建GitHub Release
3. 上传构建产物

## 🔗 相关链接
- 标签提交：c4833e2
- 开发日志：docs/v1.1.2_DEVELOPMENT_LOG.md
- CI/CD移除报告：docs/CICD_REMOVAL_REPORT.md

---
**发布负责人**: Huang Zhaojian
**发布时间**: 2025年6月14日 19:17:28 +0800
