/**
 * 用户指南功能快速测试
 * 在浏览器控制台中运行此脚本
 */

console.log('🚀 开始测试用户指南功能...')

// 1. 检查关键元素是否存在
function checkElements() {
  console.log('\n📋 检查DOM元素:')

  const elements = {
    app: document.querySelector('#app'),
    'guide-button': document.querySelector('.guide-button'),
    'user-guide-overlay': document.querySelector('.user-guide-overlay'),
    'right-column': document.querySelector('.right-column')
  }

  Object.entries(elements).forEach(([name, element]) => {
    console.log(`${element ? '✅' : '❌'} ${name}: ${element ? '存在' : '不存在'}`)
  })

  return elements
}

// 2. 清除存储并模拟首次启动
function simulateFirstLaunch() {
  console.log('\n🎯 模拟首次启动:')
  try {
    localStorage.removeItem('wxdown_first_launch_v1.1.0')
    localStorage.removeItem('wxdown_guide_settings')
    console.log('✅ 已清除localStorage数据')

    console.log('🔄 3秒后刷新页面...')
    setTimeout(() => {
      location.reload()
    }, 3000)

    return true
  } catch (e) {
    console.log('❌ 清除存储失败:', e.message)
    return false
  }
}

// 3. 手动触发指南
function triggerGuide() {
  console.log('\n👆 手动触发指南:')

  const button = document.querySelector('.guide-button')
  if (button) {
    console.log('✅ 找到指南按钮，尝试点击...')
    button.click()

    // 检查指南是否显示
    setTimeout(() => {
      const overlay = document.querySelector('.user-guide-overlay')
      if (overlay) {
        const isVisible = window.getComputedStyle(overlay).display !== 'none'
        console.log(`${isVisible ? '✅' : '❌'} 指南${isVisible ? '已显示' : '未显示'}`)

        if (isVisible) {
          console.log('🎉 用户指南功能正常工作！')
        }
      } else {
        console.log('❌ 找不到指南遮罩元素')
      }
    }, 500)

    return true
  } else {
    console.log('❌ 找不到指南按钮')
    return false
  }
}

// 4. 检查localStorage状态
function checkStorage() {
  console.log('\n💾 检查localStorage:')

  const firstLaunch = localStorage.getItem('wxdown_first_launch_v1.1.0')
  const guideSettings = localStorage.getItem('wxdown_guide_settings')

  console.log('首次启动标记:', firstLaunch || '未设置')
  console.log('指南设置:', guideSettings || '未设置')

  if (!firstLaunch) {
    console.log('💡 这可能是首次启动，指南应该自动显示')
  }
}

// 5. 完整测试流程
function runFullTest() {
  console.log('🧪 运行完整测试流程...\n')

  // 检查元素
  const elements = checkElements()

  // 检查存储
  checkStorage()

  // 如果指南按钮存在，尝试手动触发
  if (elements['guide-button']) {
    triggerGuide()
  }

  console.log('\n📝 测试完成！')
  console.log('💡 如果指南没有显示，请尝试运行 testUserGuide.simulateFirstLaunch()')
}

// 导出测试函数
window.testUserGuide = {
  checkElements,
  simulateFirstLaunch,
  triggerGuide,
  checkStorage,
  runFullTest
}

console.log('\n🛠️ 测试工具已加载到 window.testUserGuide')
console.log('• testUserGuide.runFullTest() - 运行完整测试')
console.log('• testUserGuide.simulateFirstLaunch() - 模拟首次启动')
console.log('• testUserGuide.triggerGuide() - 手动触发指南')

// 自动运行初始测试
setTimeout(() => {
  runFullTest()
}, 1000)
