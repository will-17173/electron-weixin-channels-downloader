// Analytics Composable for Vue 3
import { ref, onMounted } from 'vue'

export function useAnalytics() {
  const isInitialized = ref(false)
  const hasConsent = ref(false)
  const isLoading = ref(false)

  // 初始化Analytics
  const initializeAnalytics = async (trackingId = 'G-XXXXXXXXXX') => {
    if (!window.api?.analytics) {
      console.warn('Analytics API不可用')
      return false
    }

    try {
      isLoading.value = true

      // 检查用户同意状态
      const consentResult = await window.api.analytics.getConsent()
      hasConsent.value = consentResult.success && consentResult.consent

      if (hasConsent.value) {
        const result = await window.api.analytics.initialize({
          trackingId,
          debug: process.env.NODE_ENV === 'development',
          customConfig: {
            app_name: '爱下',
            app_version: '1.0.0'
          }
        })

        isInitialized.value = result.success
        console.log('📊 Analytics初始化成功')
        return result.success
      } else {
        console.log('📊 用户未同意Analytics，跳过初始化')
        return false
      }
    } catch (error) {
      console.error('Analytics初始化失败:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 请求用户同意
  const requestConsent = async () => {
    return new Promise((resolve) => {
      // 创建同意对话框
      const dialog = document.createElement('div')
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      `

      dialog.innerHTML = `
        <div style="
          background: white;
          padding: 30px;
          border-radius: 12px;
          max-width: 500px;
          margin: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        ">
          <h3 style="margin: 0 0 16px 0; color: #333;">📊 使用情况统计</h3>
          <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
            为了改进产品体验，我们希望收集匿名的使用情况数据。这些数据将帮助我们：
          </p>
          <ul style="margin: 0 0 20px 0; color: #666; line-height: 1.5;">
            <li>了解功能使用情况，优化用户体验</li>
            <li>发现和修复潜在问题</li>
            <li>指导产品功能改进方向</li>
          </ul>
          <p style="margin: 0 0 20px 0; color: #888; font-size: 14px;">
            我们承诺：不收集个人信息，不追踪个人行为，所有数据均匿名处理。
          </p>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <button id="analytics-decline" style="
              padding: 8px 16px;
              border: 1px solid #ddd;
              background: white;
              border-radius: 6px;
              cursor: pointer;
              color: #666;
            ">拒绝</button>
            <button id="analytics-accept" style="
              padding: 8px 16px;
              border: none;
              background: #0066cc;
              color: white;
              border-radius: 6px;
              cursor: pointer;
            ">同意</button>
          </div>
        </div>
      `

      document.body.appendChild(dialog)

      // 绑定事件
      document.getElementById('analytics-accept').onclick = async () => {
        try {
          await window.api.analytics.setConsent(true)
          hasConsent.value = true
          document.body.removeChild(dialog)
          resolve(true)
        } catch (error) {
          console.error('保存同意状态失败:', error)
          resolve(false)
        }
      }

      document.getElementById('analytics-decline').onclick = async () => {
        try {
          await window.api.analytics.setConsent(false)
          hasConsent.value = false
          document.body.removeChild(dialog)
          resolve(false)
        } catch (error) {
          console.error('保存拒绝状态失败:', error)
          resolve(false)
        }
      }
    })
  }

  // 跟踪页面访问
  const trackPage = async (pageName, customParams = {}) => {
    if (!isInitialized.value || !hasConsent.value) return

    try {
      await window.api.analytics.trackPage(pageName, customParams)
    } catch (error) {
      console.error('页面跟踪失败:', error)
    }
  }

  // 跟踪事件
  const trackEvent = async (eventName, parameters = {}) => {
    if (!isInitialized.value || !hasConsent.value) return

    try {
      await window.api.analytics.trackEvent(eventName, parameters)
    } catch (error) {
      console.error('事件跟踪失败:', error)
    }
  }

  // 跟踪功能使用
  const trackFeature = async (featureName, action, value = null) => {
    await trackEvent('feature_usage', {
      feature_name: featureName,
      action: action,
      value: value,
      timestamp: new Date().toISOString()
    })
  }

  // 跟踪用户操作
  const trackUserAction = async (action, details = {}) => {
    await trackEvent('user_action', {
      action: action,
      ...details,
      timestamp: new Date().toISOString()
    })
  }

  // 跟踪应用性能
  const trackPerformance = async (metricName, value, unit = 'ms') => {
    await trackEvent('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      timestamp: new Date().toISOString()
    })
  }

  // 跟踪错误
  const trackError = async (error, context = 'unknown') => {
    await trackEvent('app_error', {
      error_message: error.message || String(error),
      error_context: context,
      timestamp: new Date().toISOString()
    })
  }

  // 组件挂载时检查和初始化
  onMounted(async () => {
    try {
      // 检查是否已有同意状态
      const consentResult = await window.api.analytics.getConsent()

      if (consentResult.success && consentResult.consent !== undefined) {
        hasConsent.value = consentResult.consent
        if (hasConsent.value) {
          await initializeAnalytics()
        }
      } else {
        // 首次使用，请求用户同意
        const userConsent = await requestConsent()
        if (userConsent) {
          await initializeAnalytics()
        }
      }
    } catch (error) {
      console.error('Analytics组合式函数初始化失败:', error)
    }
  })

  return {
    // 状态
    isInitialized,
    hasConsent,
    isLoading,

    // 方法
    initializeAnalytics,
    requestConsent,
    trackPage,
    trackEvent,
    trackFeature,
    trackUserAction,
    trackPerformance,
    trackError
  }
}

// 预定义的事件常量
export const AnalyticsEvents = {
  // 应用生命周期
  APP_START: 'app_start',
  APP_READY: 'app_ready',

  // 用户操作
  BUTTON_CLICK: 'button_click',
  MENU_SELECT: 'menu_select',

  // 功能使用
  PROXY_START: 'proxy_start',
  PROXY_STOP: 'proxy_stop',
  VIDEO_DOWNLOAD: 'video_download',
  CERTIFICATE_INSTALL: 'certificate_install',

  // 页面访问
  PAGE_MAIN: 'main_page',
  PAGE_SETTINGS: 'settings_page',
  PAGE_ABOUT: 'about_page'
}

// 预定义的功能名称
export const AnalyticsFeatures = {
  VIDEO_MONITOR: 'video_monitor',
  VIDEO_DOWNLOAD: 'video_download',
  PROXY_CONTROL: 'proxy_control',
  CERTIFICATE_MANAGEMENT: 'certificate_management'
}
