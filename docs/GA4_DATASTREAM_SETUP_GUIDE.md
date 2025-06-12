# GA4 数据流设置指南 - Electron 应用专用

## 🎯 核心问题解答

### Q: Electron 应用应该选择哪种数据流类型？
**A: 选择"网站"数据流**

虽然 Electron 应用是桌面应用，但从 Google Analytics 的角度来看，应该选择"网站"数据流，原因如下：

1. **技术实现原理**：我们的 Electron 应用使用 Measurement Protocol API 发送数据，这与网站的工作方式类似
2. **数据格式兼容**：网站数据流支持我们需要的所有事件类型和参数
3. **报告功能完整**：网站数据流提供最完整的分析报告功能

### Q: 域名填写什么？
**A: 使用应用标识符作为域名**

对于 Electron 应用，建议填写：
- `wxdown.electron.app` 或
- `com.yourcompany.wxdown` 或
- `localhost` （简单方案）

## 🔧 详细设置步骤

### 1. 创建 GA4 媒体资源

1. 登录 [Google Analytics](https://analytics.google.com/)
2. 点击"管理" → "创建媒体资源"
3. 填写媒体资源信息：
   - **媒体资源名称**：爱下 WeChat Video Downloader
   - **报告时区**：选择中国时区
   - **币种**：人民币 (CNY)

### 2. 设置数据流

1. 在媒体资源中点击"数据流"
2. 选择"网站"
3. 填写配置：
   ```
   网站网址：https://wxdown.electron.app
   数据流名称：爱下桌面应用
   ```

### 3. 获取配置信息

设置完成后，您将获得：
- **衡量 ID**：格式为 `G-XXXXXXXXXX`
- **API 密钥**：需要在 Google Cloud Console 中创建

### 4. 创建 API 密钥

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 启用 "Google Analytics Reporting API"
3. 创建 API 密钥：
   - 转到"凭据" → "创建凭据" → "API 密钥"
   - 限制密钥只能访问 Analytics 相关 API

## 📋 配置模板

更新您的 `analytics.config.json`：

```json
{
  "measurement_id": "G-YOUR_MEASUREMENT_ID",
  "api_secret": "YOUR_API_SECRET",
  "app_info": {
    "name": "爱下 WeChat Video Downloader",
    "version": "1.0.0",
    "platform": "desktop"
  },
  "tracking_config": {
    "send_page_view": true,
    "send_app_start": true,
    "send_downloads": true,
    "send_errors": true,
    "send_performance": true
  },
  "privacy": {
    "anonymize_ip": true,
    "respect_do_not_track": true,
    "consent_required": true
  }
}
```

## 🎛️ 高级设置选项

### 自定义维度设置

在 GA4 中设置自定义维度以获得更详细的分析：

1. **应用版本**：`app_version`
2. **操作系统**：`os_name`
3. **下载类型**：`download_type`
4. **代理状态**：`proxy_enabled`

### 转化事件设置

将以下事件标记为转化：
- `video_download_completed`
- `app_first_launch`
- `feature_used`

### 受众群体设置

创建有用的受众群体：
- **活跃用户**：7 天内启动应用的用户
- **重度用户**：下载超过 10 个视频的用户
- **错误用户**：遇到错误的用户

## 🔍 数据验证

### 实时测试

1. 启动应用并进行一些操作
2. 在 GA4 中查看"实时"报告
3. 确认事件正常发送

### 调试模式

启用调试模式查看详细日志：

```javascript
// 在 src/main/analytics.js 中启用调试
const DEBUG_MODE = true;

if (DEBUG_MODE) {
    console.log('发送事件:', eventName, parameters);
}
```

## 📊 预期报告

设置完成后，您将在 GA4 中看到：

### 实时报告
- 当前活跃用户数
- 实时事件流
- 当前使用的功能

### 生命周期报告
- 获取新用户报告
- 参与度报告（会话时长、使用频率）
- 留存率报告

### 事件报告
- 自定义事件详情
- 转化漏斗分析
- 用户路径分析

## ⚠️ 注意事项

1. **隐私合规**：确保用户同意数据收集
2. **数据准确性**：定期检查数据质量
3. **存储限制**：GA4 免费版有数据保留限制
4. **本地测试**：开发时使用测试配置，避免污染生产数据

## 🛠️ 故障排除

### 常见问题

**Q: 数据没有出现在 GA4 中**
A: 检查网络连接、API 密钥有效性、事件格式

**Q: 事件参数缺失**
A: 确认自定义维度已在 GA4 中正确设置

**Q: 实时报告为空**
A: 等待几分钟，GA4 实时报告有轻微延迟

### 调试检查清单

- [ ] Measurement ID 格式正确
- [ ] API Secret 有效
- [ ] 网络可以访问 Google Analytics
- [ ] 事件参数符合 GA4 规范
- [ ] 用户已同意数据收集

---

## 📞 技术支持

如果您在设置过程中遇到问题，可以：

1. 查看 [Google Analytics 帮助中心](https://support.google.com/analytics/)
2. 检查我们的 `docs/ANALYTICS_INTEGRATION_GUIDE.html`
3. 在项目中提交 Issue

**记住**：选择"网站"数据流是正确的选择，不要担心这个看似矛盾的设置！
