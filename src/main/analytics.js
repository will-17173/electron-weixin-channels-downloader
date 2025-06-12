// Google Analytics 4 集成模块 - Electron Measurement Protocol版本
import https from 'https'
import { v4 as uuidv4 } from 'uuid'

class AnalyticsManager {
  constructor() {
    this.measurementId = 'G-TTCM0XTED7' // 替换为您的GA4 Measurement ID
    this.apiSecret = 'gIXobkKNRQS8_TJNJ3OiUQ' // 替换为您的GA4 API Secret
    this.isInitialized = false
    this.isEnabled = false
    this.clientId = this.generateClientId()
    this.sessionId = this.generateSessionId()
    this.baseUrl = 'https://www.google-analytics.com/mp/collect'
  }

  /**
   * 初始化Analytics
   * @param {Object} options - 配置选项
   * @param {string} options.measurementId - GA4 Measurement ID
   * @param {string} options.apiSecret - GA4 API Secret
   * @param {boolean} options.debug - 是否启用调试模式
   */
  async initialize(options = {}) {
    try {
      this.measurementId = options.measurementId || this.measurementId
      this.apiSecret = options.apiSecret || this.apiSecret

      // 检查用户是否同意统计（GDPR合规）
      const userConsent = await this.getUserConsent()
      if (!userConsent) {
        console.log('📊 用户未同意数据统计，Analytics已禁用')
        return
      }

      this.isInitialized = true
      this.isEnabled = true

      console.log('📊 Google Analytics 4 初始化成功')

      // 发送初始化事件
      this.trackEvent('app_start', {
        app_version: this.getAppVersion(),
        platform: process.platform,
        electron_version: process.versions.electron
      })
    } catch (error) {
      console.error('❌ Analytics初始化失败:', error)
    }
  }

  /**
   * 使用Measurement Protocol发送事件到GA4
   * @param {Object} payload - 事件数据
   */
  async sendToGA4(payload) {
    if (!this.isEnabled) return

    return new Promise((resolve) => {
      const data = JSON.stringify(payload)
      const url = `${this.baseUrl}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`

      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      }

      const req = https.request(url, options, (res) => {
        let responseData = ''
        res.on('data', (chunk) => {
          responseData += chunk
        })
        res.on('end', () => {
          if (res.statusCode === 204) {
            resolve({ success: true })
          } else {
            console.error('Analytics发送失败:', res.statusCode, responseData)
            resolve({ success: false, error: responseData })
          }
        })
      })

      req.on('error', (error) => {
        console.error('Analytics请求错误:', error)
        resolve({ success: false, error: error.message })
      })

      req.write(data)
      req.end()
    })
  }

  /**
   * 跟踪页面浏览
   * @param {string} pageName - 页面名称
   * @param {Object} customParams - 自定义参数
   */
  async trackPageView(pageName, customParams = {}) {
    if (!this.isEnabled) return

    try {
      const payload = {
        client_id: this.clientId,
        events: [
          {
            name: 'page_view',
            params: {
              page_title: pageName,
              page_location: `app://${pageName}`,
              session_id: this.sessionId,
              app_version: this.getAppVersion(),
              platform: process.platform,
              ...customParams
            }
          }
        ]
      }

      await this.sendToGA4(payload)
      console.log(`📊 页面访问: ${pageName}`)
    } catch (error) {
      console.error('❌ 页面访问跟踪失败:', error)
    }
  }

  /**
   * 跟踪事件
   * @param {string} eventName - 事件名称
   * @param {Object} parameters - 事件参数
   */
  async trackEvent(eventName, parameters = {}) {
    if (!this.isEnabled) return

    try {
      const payload = {
        client_id: this.clientId,
        events: [
          {
            name: eventName,
            params: {
              session_id: this.sessionId,
              app_version: this.getAppVersion(),
              platform: process.platform,
              timestamp_micros: Date.now() * 1000,
              ...parameters
            }
          }
        ]
      }

      await this.sendToGA4(payload)
      console.log(`📊 事件跟踪: ${eventName}`, parameters)
    } catch (error) {
      console.error('❌ 事件跟踪失败:', error)
    }
  }

  /**
   * 跟踪应用功能使用
   */
  trackFeatureUsage(featureName, action, value = null) {
    this.trackEvent('feature_usage', {
      feature_name: featureName,
      action: action,
      value: value,
      event_category: 'app_feature'
    })
  }

  /**
   * 跟踪错误
   * @param {string} errorMessage - 错误信息
   * @param {string} errorLocation - 错误位置
   */
  trackError(errorMessage, errorLocation = 'unknown') {
    this.trackEvent('app_error', {
      error_message: errorMessage,
      error_location: errorLocation,
      event_category: 'error'
    })
  }

  /**
   * 跟踪性能指标
   * @param {string} metricName - 指标名称
   * @param {number} value - 数值
   * @param {string} unit - 单位
   */
  trackPerformance(metricName, value, unit = 'ms') {
    this.trackEvent('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      event_category: 'performance'
    })
  }

  /**
   * 获取用户同意（GDPR合规）
   */
  async getUserConsent() {
    const { app } = require('electron')
    const path = require('path')
    const fs = require('fs').promises

    try {
      const userDataPath = app.getPath('userData')
      const consentFile = path.join(userDataPath, 'analytics-consent.json')

      const consentData = await fs.readFile(consentFile, 'utf8')
      const consent = JSON.parse(consentData)

      return consent.analytics === true
    } catch (error) {
      // 文件不存在或解析失败，返回false（需要用户同意）
      return false
    }
  }

  /**
   * 保存用户同意状态
   * @param {boolean} consent - 是否同意
   */
  async saveUserConsent(consent) {
    const { app } = require('electron')
    const path = require('path')
    const fs = require('fs').promises

    try {
      const userDataPath = app.getPath('userData')
      const consentFile = path.join(userDataPath, 'analytics-consent.json')

      const consentData = {
        analytics: consent,
        timestamp: new Date().toISOString()
      }

      await fs.writeFile(consentFile, JSON.stringify(consentData, null, 2))

      this.isEnabled = consent

      if (consent && !this.isInitialized) {
        await this.initialize()
      }
    } catch (error) {
      console.error('❌ 保存用户同意状态失败:', error)
    }
  }

  /**
   * 生成客户端ID
   */
  generateClientId() {
    return uuidv4()
  }

  /**
   * 生成会话ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 获取应用版本
   */
  getAppVersion() {
    try {
      const packagePath = require('path').join(__dirname, '../../package.json')
      const packageJson = require(packagePath)
      return packageJson.version || '1.0.0'
    } catch (error) {
      return '1.0.0'
    }
  }

  /**
   * 禁用Analytics
   */
  disable() {
    this.isEnabled = false
    console.log('📊 Analytics已禁用')
  }

  /**
   * 启用Analytics
   */
  async enable() {
    if (!this.isInitialized) {
      await this.initialize()
    } else {
      this.isEnabled = true
      console.log('📊 Analytics已启用')
    }
  }
}

// 创建单例实例
const analyticsManager = new AnalyticsManager()

export default analyticsManager
