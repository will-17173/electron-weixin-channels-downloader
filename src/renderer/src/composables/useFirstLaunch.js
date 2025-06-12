import { ref } from 'vue'

// 首次启动管理
const FIRST_LAUNCH_KEY = 'wxdown_first_launch_v1.1.0'
const GUIDE_SETTINGS_KEY = 'wxdown_guide_settings'

export function useFirstLaunch() {
  const isFirstLaunch = ref(false)
  const showGuide = ref(false)

  // 检查是否是首次启动
  const checkFirstLaunch = () => {
    try {
      const hasLaunched = localStorage.getItem(FIRST_LAUNCH_KEY)
      const guideSettings = getGuideSettings()

      if (!hasLaunched) {
        isFirstLaunch.value = true
        showGuide.value = true
        // 标记已启动过
        localStorage.setItem(FIRST_LAUNCH_KEY, 'true')
        console.log('🎉 首次启动检测到，显示使用指南')
      } else if (!guideSettings.dontShowAgain) {
        // 不是首次启动，但用户没有设置"不再显示"
        console.log('📖 非首次启动，用户可手动打开指南')
      } else {
        console.log('✅ 用户已设置不再自动显示指南')
      }
    } catch (error) {
      console.warn('检查首次启动状态失败:', error)
      // 出错时默认显示指南
      isFirstLaunch.value = true
      showGuide.value = true
    }
  }

  // 获取指南设置
  const getGuideSettings = () => {
    try {
      const settings = localStorage.getItem(GUIDE_SETTINGS_KEY)
      return settings ? JSON.parse(settings) : { dontShowAgain: false }
    } catch (error) {
      console.warn('获取指南设置失败:', error)
      return { dontShowAgain: false }
    }
  }

  // 保存指南设置
  const saveGuideSettings = (settings) => {
    try {
      localStorage.setItem(GUIDE_SETTINGS_KEY, JSON.stringify(settings))
      console.log('💾 指南设置已保存:', settings)
    } catch (error) {
      console.error('保存指南设置失败:', error)
    }
  }

  // 设置不再显示指南
  const setDontShowAgain = (dontShow = true) => {
    const settings = getGuideSettings()
    settings.dontShowAgain = dontShow
    saveGuideSettings(settings)
  }

  // 手动显示指南
  const showUserGuide = () => {
    showGuide.value = true
    console.log('📖 手动打开使用指南')
  }

  // 隐藏指南
  const hideUserGuide = () => {
    showGuide.value = false
  }

  // 重置首次启动状态（用于测试）
  const resetFirstLaunch = () => {
    try {
      localStorage.removeItem(FIRST_LAUNCH_KEY)
      localStorage.removeItem(GUIDE_SETTINGS_KEY)
      console.log('🔄 首次启动状态已重置')
    } catch (error) {
      console.error('重置首次启动状态失败:', error)
    }
  }

  // 获取当前设置
  const getCurrentSettings = () => {
    return {
      isFirstLaunch: isFirstLaunch.value,
      showGuide: showGuide.value,
      guideSettings: getGuideSettings()
    }
  }

  // 初始化时检查首次启动
  checkFirstLaunch()

  return {
    // 状态
    isFirstLaunch,
    showGuide,

    // 方法
    checkFirstLaunch,
    getGuideSettings,
    saveGuideSettings,
    setDontShowAgain,
    showUserGuide,
    hideUserGuide,
    resetFirstLaunch,
    getCurrentSettings
  }
}

// 用于分析的事件跟踪
export function useGuideAnalytics() {
  const trackGuideEvent = async (eventName, properties = {}) => {
    try {
      if (window.electronAPI && window.electronAPI.analytics) {
        await window.electronAPI.analytics.trackEvent('user_guide', eventName, {
          timestamp: new Date().toISOString(),
          ...properties
        })
      }
    } catch (error) {
      console.warn('指南事件跟踪失败:', error)
    }
  }

  const trackGuideShown = (isFirstLaunch = false) => {
    trackGuideEvent('guide_shown', {
      is_first_launch: isFirstLaunch,
      trigger: isFirstLaunch ? 'auto' : 'manual'
    })
  }

  const trackGuideClosed = (dontShowAgain = false) => {
    trackGuideEvent('guide_closed', {
      dont_show_again: dontShowAgain
    })
  }

  const trackGuideStepView = (stepIndex, stepTitle) => {
    trackGuideEvent('guide_step_view', {
      step_index: stepIndex,
      step_title: stepTitle
    })
  }

  const trackFAQOpened = () => {
    trackGuideEvent('faq_opened_from_guide')
  }

  return {
    trackGuideEvent,
    trackGuideShown,
    trackGuideClosed,
    trackGuideStepView,
    trackFAQOpened
  }
}
