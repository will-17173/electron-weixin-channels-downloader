/**
 * 用户指南调试脚本
 * 用于检查为什么指南弹窗没有显示
 */

console.log('🔍 用户指南调试开始')

// 1. 检查DOM元素
console.log('\n📋 DOM元素检查:')
const guideButton = document.querySelector('.guide-button')
const guideOverlay = document.querySelector('.user-guide-overlay')
const guideModal = document.querySelector('.user-guide-modal')

console.log('指南按钮:', guideButton ? '✅ 存在' : '❌ 不存在')
console.log('指南遮罩:', guideOverlay ? '✅ 存在' : '❌ 不存在')
console.log('指南模态框:', guideModal ? '✅ 存在' : '❌ 不存在')

if (guideOverlay) {
  const computedStyle = window.getComputedStyle(guideOverlay)
  console.log('遮罩显示状态:', computedStyle.display)
  console.log('遮罩可见性:', computedStyle.visibility)
  console.log('遮罩透明度:', computedStyle.opacity)
}

// 2. 检查Vue应用状态
console.log('\n🔧 Vue应用状态:')
const app = document.querySelector('#app')
console.log('Vue应用容器:', app ? '✅ 存在' : '❌ 不存在')

if (app && app.__vue__) {
  console.log('Vue实例:', '✅ 已挂载')
} else {
  console.log('Vue实例:', '❌ 未找到')
}

// 3. 检查localStorage状态
console.log('\n💾 localStorage状态:')
const firstLaunchKey = 'wxdown_first_launch_v1.1.0'
const guideSettingsKey = 'wxdown_guide_settings'

const firstLaunchValue = localStorage.getItem(firstLaunchKey)
const guideSettingsValue = localStorage.getItem(guideSettingsKey)

console.log(`首次启动标记 (${firstLaunchKey}):`, firstLaunchValue || '❌ 未设置')
console.log(`指南设置 (${guideSettingsKey}):`, guideSettingsValue || '❌ 未设置')

if (guideSettingsValue) {
  try {
    const settings = JSON.parse(guideSettingsValue)
    console.log('解析后的设置:', settings)
  } catch (e) {
    console.log('❌ 设置解析失败:', e.message)
  }
}

// 4. 检查控制台错误
console.log('\n❌ 控制台错误检查:')
const originalError = console.error
let errorCount = 0

console.error = function (...args) {
  errorCount++
  console.log(`错误 ${errorCount}:`, ...args)
  originalError.apply(console, args)
}

// 5. 模拟首次启动
console.log('\n🎯 模拟首次启动:')
function simulateFirstLaunch() {
  localStorage.removeItem(firstLaunchKey)
  localStorage.removeItem(guideSettingsKey)
  console.log('✅ 已清除首次启动标记和设置')
  console.log('🔄 准备刷新页面...')

  setTimeout(() => {
    location.reload()
  }, 1000)
}

// 6. 手动触发指南
console.log('\n👆 手动触发指南:')
function triggerGuide() {
  if (guideButton) {
    console.log('🔄 点击指南按钮...')
    guideButton.click()

    setTimeout(() => {
      const overlay = document.querySelector('.user-guide-overlay')
      if (overlay && overlay.style.display !== 'none') {
        console.log('✅ 指南已显示')
      } else {
        console.log('❌ 指南未显示')
        console.log('尝试检查Vue组件状态...')

        // 检查Vue组件的数据
        if (window.Vue && window.Vue.version) {
          console.log('Vue版本:', window.Vue.version)
        }
      }
    }, 500)
  } else {
    console.log('❌ 找不到指南按钮')
  }
}

// 7. 检查网络请求
console.log('\n🌐 网络状态检查:')
console.log('在线状态:', navigator.onLine ? '✅ 在线' : '❌ 离线')

// 8. 导出调试函数
window.debugUserGuide = {
  simulateFirstLaunch,
  triggerGuide,
  checkElements: () => {
    console.log('指南按钮:', document.querySelector('.guide-button'))
    console.log('指南遮罩:', document.querySelector('.user-guide-overlay'))
    console.log('指南模态框:', document.querySelector('.user-guide-modal'))
  },
  clearStorage: () => {
    localStorage.removeItem(firstLaunchKey)
    localStorage.removeItem(guideSettingsKey)
    console.log('✅ 存储已清除')
  },
  checkVueApp: () => {
    const app = document.querySelector('#app')
    if (app) {
      console.log('App元素:', app)
      console.log('子元素数量:', app.children.length)
      console.log('类名:', app.className)
    }
  }
}

console.log('\n🛠️ 调试工具已加载:')
console.log('• window.debugUserGuide.simulateFirstLaunch() - 模拟首次启动')
console.log('• window.debugUserGuide.triggerGuide() - 手动触发指南')
console.log('• window.debugUserGuide.checkElements() - 检查DOM元素')
console.log('• window.debugUserGuide.clearStorage() - 清除存储')
console.log('• window.debugUserGuide.checkVueApp() - 检查Vue应用')

// 9. 初始诊断
console.log('\n🏥 初始诊断:')
if (!firstLaunchValue) {
  console.log('🎯 这可能是首次启动，应该自动显示指南')
  if (!guideOverlay || guideOverlay.style.display === 'none') {
    console.log('❌ 但是指南没有显示，可能存在问题')
  }
} else {
  console.log('📋 不是首次启动，需要手动点击按钮打开指南')
}
