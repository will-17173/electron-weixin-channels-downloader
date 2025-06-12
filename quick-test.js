// 快速检查用户指南功能
console.log('🔍 快速检查开始...')

// 清除首次启动标记来模拟首次启动
localStorage.removeItem('wxdown_first_launch_v1.1.0')
localStorage.removeItem('wxdown_guide_settings')

console.log('✅ 已清除首次启动标记')
console.log('🔄 3秒后刷新页面以测试首次启动体验...')

setTimeout(() => {
  location.reload()
}, 3000)
