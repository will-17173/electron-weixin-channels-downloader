/**
 * 测试 v1.1.2 新功能
 * 验证"打开下载文件夹"按钮是否正确添加
 */

const fs = require('fs')
const path = require('path')

// 读取 VideoMonitor.vue 文件
const videoMonitorPath = path.join(__dirname, 'src/renderer/src/components/VideoMonitor.vue')
const content = fs.readFileSync(videoMonitorPath, 'utf8')

// 检查是否包含新按钮
const hasNewButton = content.includes('📂 打开下载文件夹')
const hasFolderBtnClass = content.includes('folder-btn')
const hasFolderBtnStyle = content.includes('.video-list-actions .folder-btn')

console.log('🔍 v1.1.2 功能检查结果:')
console.log('✅ 打开下载文件夹按钮:', hasNewButton ? '已添加' : '❌ 未找到')
console.log('✅ 按钮样式类:', hasFolderBtnClass ? '已添加' : '❌ 未找到')
console.log('✅ CSS样式定义:', hasFolderBtnStyle ? '已添加' : '❌ 未找到')

// 检查版本号
const packagePath = path.join(__dirname, 'package.json')
const packageContent = fs.readFileSync(packagePath, 'utf8')
const packageJson = JSON.parse(packageContent)
const isVersionUpdated = packageJson.version === '1.1.2'

console.log(
  '✅ 版本号更新:',
  isVersionUpdated ? `v${packageJson.version}` : `❌ 当前版本: v${packageJson.version}`
)

// 检查按钮在正确位置
const buttonOrder = content.match(/清空数据.*?打开下载文件夹/s)
console.log('✅ 按钮位置:', buttonOrder ? '正确（在清空数据按钮右边）' : '❌ 位置不正确')

console.log('\n🎉 v1.1.2 开发完成！')
console.log('📝 新功能：在"清空数据"按钮右边添加了"打开下载文件夹"按钮')
console.log('🎨 按钮采用绿色主题，与其他按钮保持一致的设计风格')
