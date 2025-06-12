/**
 * 测试脚本：重置首次启动状态
 * 这个脚本可以帮助开发者测试首次启动功能
 */

console.log('🧪 用户指南功能测试脚本')

// 清除localStorage中的首次启动标记
if (typeof localStorage !== 'undefined') {
  const keys = Object.keys(localStorage)
  const appKeys = keys.filter((key) => key.startsWith('app_first_launch_') || key.includes('guide'))

  console.log('📋 发现的相关localStorage键:', appKeys)

  appKeys.forEach((key) => {
    localStorage.removeItem(key)
    console.log(`🗑️ 已清除: ${key}`)
  })

  console.log('✅ 首次启动状态已重置')
  console.log('🔄 刷新页面以测试首次启动体验')
} else {
  console.log('❌ localStorage不可用（可能在Node.js环境中运行）')
}

// 测试用的localStorage检查函数
function checkFirstLaunchStatus() {
  if (typeof localStorage === 'undefined') {
    console.log('❌ localStorage不可用')
    return
  }

  const version = '1.1.0'
  const key = `app_first_launch_${version}`
  const guideSetting = localStorage.getItem('user_guide_settings')

  console.log('📊 当前状态:')
  console.log(`   首次启动标记 (${key}):`, localStorage.getItem(key))
  console.log('   指南设置:', guideSetting)

  if (guideSetting) {
    try {
      const settings = JSON.parse(guideSetting)
      console.log('   解析后的设置:', settings)
    } catch (e) {
      console.log('   设置解析失败:', e.message)
    }
  }
}

// 导出测试函数
if (typeof window !== 'undefined') {
  window.testFirstLaunch = {
    reset: () => {
      const keys = Object.keys(localStorage)
      const appKeys = keys.filter(
        (key) => key.startsWith('app_first_launch_') || key.includes('guide')
      )
      appKeys.forEach((key) => localStorage.removeItem(key))
      console.log('✅ 状态已重置，请刷新页面')
    },
    check: checkFirstLaunchStatus
  }
  console.log('🔧 测试函数已添加到 window.testFirstLaunch')
  console.log('   使用 window.testFirstLaunch.reset() 重置状态')
  console.log('   使用 window.testFirstLaunch.check() 检查状态')
}
