/**
 * Vue组件状态调试器
 * 帮助诊断用户指南组件的状态问题
 */

console.log('🔍 Vue组件状态调试器启动')

function debugVueComponents() {
  console.log('\n📋 检查Vue组件状态:')

  // 检查是否有Vue DevTools
  if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('✅ Vue DevTools已安装')
  } else {
    console.log('⚠️ Vue DevTools未安装')
  }

  // 检查DOM中的Vue组件
  const app = document.querySelector('#app')
  if (app) {
    console.log('✅ #app容器找到')

    // 尝试获取Vue实例
    if (app.__vue_app__) {
      console.log('✅ Vue 3应用实例找到')
    } else if (app._vnode) {
      console.log('✅ Vue组件节点找到')
    } else {
      console.log('❌ Vue实例未找到')
    }
  }

  // 检查具体的DOM元素
  const elements = {
    'guide-button': document.querySelector('.guide-button'),
    'user-guide-overlay': document.querySelector('.user-guide-overlay'),
    'user-guide-modal': document.querySelector('.user-guide-modal'),
    'guide-header': document.querySelector('.guide-header'),
    'guide-content': document.querySelector('.guide-content'),
    'guide-footer': document.querySelector('.guide-footer')
  }

  console.log('\n🎯 DOM元素检查:')
  Object.entries(elements).forEach(([name, element]) => {
    if (element) {
      console.log(`✅ ${name}:`, element)
      if (name === 'user-guide-overlay') {
        const style = window.getComputedStyle(element)
        console.log(`   显示状态: ${style.display}`)
        console.log(`   可见性: ${style.visibility}`)
        console.log(`   透明度: ${style.opacity}`)
        console.log(`   z-index: ${style.zIndex}`)
      }
    } else {
      console.log(`❌ ${name}: 未找到`)
    }
  })

  // 检查localStorage
  console.log('\n💾 localStorage状态:')
  const firstLaunch = localStorage.getItem('wxdown_first_launch_v1.1.0')
  const guideSettings = localStorage.getItem('wxdown_guide_settings')

  console.log('首次启动:', firstLaunch || '未设置')
  console.log('指南设置:', guideSettings || '未设置')

  if (guideSettings) {
    try {
      const parsed = JSON.parse(guideSettings)
      console.log('解析后的设置:', parsed)
    } catch (e) {
      console.log('❌ 设置解析失败:', e.message)
    }
  }
}

// 手动触发显示指南
function forceShowGuide() {
  console.log('\n🔧 强制显示指南...')

  const overlay = document.querySelector('.user-guide-overlay')
  if (overlay) {
    overlay.style.display = 'flex'
    overlay.style.visibility = 'visible'
    overlay.style.opacity = '1'
    console.log('✅ 已强制显示指南遮罩')
  } else {
    console.log('❌ 找不到指南遮罩元素')
  }
}

// 检查事件监听器
function checkEventHandlers() {
  console.log('\n🎧 检查事件处理器:')

  const button = document.querySelector('.guide-button')
  if (button) {
    console.log('✅ 指南按钮找到')

    // 尝试触发点击事件
    const clickEvent = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    })

    console.log('🔄 模拟点击指南按钮...')
    button.dispatchEvent(clickEvent)

    setTimeout(() => {
      const overlay = document.querySelector('.user-guide-overlay')
      if (overlay && window.getComputedStyle(overlay).display !== 'none') {
        console.log('✅ 点击后指南已显示')
      } else {
        console.log('❌ 点击后指南未显示')
      }
    }, 100)
  } else {
    console.log('❌ 指南按钮未找到')
  }
}

// 重置并测试首次启动
function testFirstLaunch() {
  console.log('\n🎯 测试首次启动流程:')

  // 清除存储
  localStorage.removeItem('wxdown_first_launch_v1.1.0')
  localStorage.removeItem('wxdown_guide_settings')
  console.log('✅ 已清除localStorage')

  // 延迟刷新页面
  console.log('🔄 3秒后刷新页面以测试首次启动...')
  setTimeout(() => {
    location.reload()
  }, 3000)
}

// 导出全局调试函数
window.vueDebugger = {
  debugVueComponents,
  forceShowGuide,
  checkEventHandlers,
  testFirstLaunch,

  // 快速检查
  quickCheck: () => {
    debugVueComponents()
    checkEventHandlers()
  }
}

console.log('\n🛠️ Vue调试器已加载:')
console.log('• window.vueDebugger.debugVueComponents() - 检查Vue组件状态')
console.log('• window.vueDebugger.forceShowGuide() - 强制显示指南')
console.log('• window.vueDebugger.checkEventHandlers() - 检查事件处理')
console.log('• window.vueDebugger.testFirstLaunch() - 测试首次启动')
console.log('• window.vueDebugger.quickCheck() - 快速检查')

// 自动运行初始检查
setTimeout(() => {
  console.log('\n🔄 运行初始检查...')
  debugVueComponents()
}, 1000)
