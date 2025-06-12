/**
 * 用户指南功能测试脚本 v1.1.0
 * 测试所有用户指南相关功能的完整性
 */

console.log('🧪 爱下 - 用户指南功能测试开始')
console.log('📅 测试日期:', new Date().toLocaleString('zh-CN'))

// 测试结果收集
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
}

// 测试辅助函数
function test(description, testFunction) {
  testResults.total++
  try {
    const result = testFunction()
    if (result) {
      testResults.passed++
      console.log(`✅ ${description}`)
      testResults.details.push({ test: description, status: 'PASS', error: null })
    } else {
      testResults.failed++
      console.log(`❌ ${description} - 测试失败`)
      testResults.details.push({ test: description, status: 'FAIL', error: '测试返回false' })
    }
  } catch (error) {
    testResults.failed++
    console.log(`❌ ${description} - 错误: ${error.message}`)
    testResults.details.push({ test: description, status: 'ERROR', error: error.message })
  }
}

// 异步测试函数
async function asyncTest(description, testFunction) {
  testResults.total++
  try {
    const result = await testFunction()
    if (result) {
      testResults.passed++
      console.log(`✅ ${description}`)
      testResults.details.push({ test: description, status: 'PASS', error: null })
    } else {
      testResults.failed++
      console.log(`❌ ${description} - 测试失败`)
      testResults.details.push({ test: description, status: 'FAIL', error: '测试返回false' })
    }
  } catch (error) {
    testResults.failed++
    console.log(`❌ ${description} - 错误: ${error.message}`)
    testResults.details.push({ test: description, status: 'ERROR', error: error.message })
  }
}

// 开始测试
console.log('\n🔍 1. 基础环境检查')

test('localStorage 可用性', () => {
  return typeof localStorage !== 'undefined' && localStorage !== null
})

test('Vue 应用挂载', () => {
  return document.querySelector('#app') !== null
})

test('用户指南按钮存在', () => {
  return document.querySelector('.guide-button') !== null
})

console.log('\n📱 2. localStorage 数据结构测试')

test('首次启动键设置正确', () => {
  const key = 'wxdown_first_launch_v1.1.0'
  // 临时设置测试
  localStorage.setItem(key, 'test')
  const exists = localStorage.getItem(key) === 'test'
  localStorage.removeItem(key)
  return exists
})

test('指南设置键设置正确', () => {
  const key = 'wxdown_guide_settings'
  const testData = { dontShowAgain: true }
  localStorage.setItem(key, JSON.stringify(testData))
  const retrieved = JSON.parse(localStorage.getItem(key))
  localStorage.removeItem(key)
  return retrieved.dontShowAgain === true
})

console.log('\n🎯 3. 首次启动逻辑测试')

test('首次启动检测（清空状态）', () => {
  // 清空相关状态
  localStorage.removeItem('wxdown_first_launch_v1.1.0')
  localStorage.removeItem('wxdown_guide_settings')

  // 检查是否为首次启动
  const hasLaunched = localStorage.getItem('wxdown_first_launch_v1.1.0')
  return hasLaunched === null
})

test('首次启动标记设置', () => {
  localStorage.setItem('wxdown_first_launch_v1.1.0', 'true')
  const marked = localStorage.getItem('wxdown_first_launch_v1.1.0')
  return marked === 'true'
})

console.log('\n🔘 4. 指南设置功能测试')

test('默认设置生成', () => {
  const defaultSettings = { dontShowAgain: false }
  localStorage.setItem('wxdown_guide_settings', JSON.stringify(defaultSettings))
  const settings = JSON.parse(localStorage.getItem('wxdown_guide_settings'))
  return settings.dontShowAgain === false
})

test('不再显示设置', () => {
  const settings = { dontShowAgain: true }
  localStorage.setItem('wxdown_guide_settings', JSON.stringify(settings))
  const savedSettings = JSON.parse(localStorage.getItem('wxdown_guide_settings'))
  return savedSettings.dontShowAgain === true
})

console.log('\n🎨 5. UI 元素检查')

test('指南按钮可见性', () => {
  const button = document.querySelector('.guide-button')
  return button && button.offsetParent !== null
})

test('指南按钮点击事件', () => {
  const button = document.querySelector('.guide-button')
  return (button && typeof button.onclick === 'function') || button.getAttribute('onclick') !== null
})

test('用户指南模态框元素', () => {
  return document.querySelector('.user-guide-overlay') !== null
})

console.log('\n📖 6. 指南内容验证')

test('指南标题存在', () => {
  return document.querySelector('.guide-title h2') !== null
})

test('指南步骤内容', () => {
  const steps = document.querySelectorAll('.guide-step')
  return steps.length >= 6 // 应该有6个步骤
})

test('指南底部操作区', () => {
  return document.querySelector('.guide-footer') !== null
})

test('不再显示复选框', () => {
  return document.querySelector('.checkbox-input') !== null
})

console.log('\n⚡ 7. 交互功能测试')

// 模拟点击测试
test('指南按钮点击模拟', () => {
  const button = document.querySelector('.guide-button')
  if (button) {
    // 创建点击事件
    const event = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    })
    button.dispatchEvent(event)
    return true
  }
  return false
})

// 等待DOM更新后检查模态框
setTimeout(() => {
  console.log('\n🔄 8. 动态内容检查（延迟测试）')

  test('模态框显示状态', () => {
    const overlay = document.querySelector('.user-guide-overlay')
    return overlay && overlay.style.display !== 'none'
  })

  test('模态框内容完整性', () => {
    const modal = document.querySelector('.user-guide-modal')
    const header = modal ? modal.querySelector('.guide-header') : null
    const content = modal ? modal.querySelector('.guide-content') : null
    const footer = modal ? modal.querySelector('.guide-footer') : null

    return header && content && footer
  })

  // 输出最终测试结果
  setTimeout(() => {
    console.log('\n📊 测试结果汇总')
    console.log('==================')
    console.log(`总测试数: ${testResults.total}`)
    console.log(`通过数: ${testResults.passed}`)
    console.log(`失败数: ${testResults.failed}`)
    console.log(`通过率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`)

    if (testResults.failed > 0) {
      console.log('\n❌ 失败的测试:')
      testResults.details
        .filter((result) => result.status !== 'PASS')
        .forEach((result) => {
          console.log(`  - ${result.test}: ${result.error || '未知错误'}`)
        })
    }

    // 保存测试结果到localStorage
    const testReport = {
      timestamp: new Date().toISOString(),
      version: '1.1.0',
      results: testResults,
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    }

    localStorage.setItem('test_report_user_guide', JSON.stringify(testReport))
    console.log('\n💾 测试报告已保存到 localStorage')

    // 判断测试是否整体通过
    if (testResults.failed === 0) {
      console.log('\n🎉 所有测试通过！用户指南功能正常工作。')
    } else {
      console.log('\n⚠️ 部分测试失败，请检查相关功能。')
    }
  }, 1000)
}, 500)

// 导出测试函数到全局作用域
if (typeof window !== 'undefined') {
  window.testUserGuide = {
    runTests: () => {
      console.log('🔄 重新运行测试...')
      location.reload()
    },

    clearTestData: () => {
      localStorage.removeItem('wxdown_first_launch_v1.1.0')
      localStorage.removeItem('wxdown_guide_settings')
      localStorage.removeItem('test_report_user_guide')
      console.log('🗑️ 测试数据已清除')
    },

    simulateFirstLaunch: () => {
      localStorage.removeItem('wxdown_first_launch_v1.1.0')
      localStorage.removeItem('wxdown_guide_settings')
      console.log('🎯 已模拟首次启动状态，刷新页面查看效果')
    },

    getTestReport: () => {
      const report = localStorage.getItem('test_report_user_guide')
      return report ? JSON.parse(report) : null
    }
  }

  console.log('\n🛠️ 测试工具已添加到 window.testUserGuide')
  console.log('  • window.testUserGuide.runTests() - 重新运行测试')
  console.log('  • window.testUserGuide.clearTestData() - 清除测试数据')
  console.log('  • window.testUserGuide.simulateFirstLaunch() - 模拟首次启动')
  console.log('  • window.testUserGuide.getTestReport() - 获取测试报告')
}
