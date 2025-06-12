import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { Proxy } from 'http-mitm-proxy'
import path from 'path'
import { spawn } from 'child_process'
import CertificateManager from './certificate/index.js'
import { INJECT_SCRIPT } from './inject-script.js'
import { downloadFile, CancelToken } from './pre.js'
import analyticsManager from './analytics.js'
import os from 'os'
import fs from 'fs'

// 全局未捕获异常处理器 - 特别处理HTTP头部错误
process.on('uncaughtException', (error) => {
  if (error.code === 'ERR_HTTP_HEADERS_SENT') {
    // 静默处理HTTP头部重复发送错误
    console.log('⚠️ HTTP头部重复发送错误已被全局捕获并静默处理')
    return // 不让应用崩溃
  }

  // 其他错误的处理
  console.error('🚨 未捕获的异常:', error.message)
  console.error('堆栈跟踪:', error.stack)

  // 对于非HTTP头部错误，仍然可能需要退出
  if (!error.message.includes('headers') && !error.message.includes('EPIPE')) {
    process.exit(1)
  }
})

// 过滤控制台输出，只显示微信相关的日志
const originalConsoleLog = console.log
const originalConsoleError = console.error

console.log = function (...args) {
  const message = args.join(' ')

  // 过滤掉非微信域名的服务器启动日志
  if (message.includes('starting server for') || message.includes('https server started for')) {
    if (!message.includes('weixin.qq.com') && !message.includes('channels.weixin.qq.com')) {
      return // 静默处理
    }
  }

  // 过滤掉其他域名的日志
  if (message.includes('.com') || message.includes('.net') || message.includes('.org')) {
    if (!message.includes('weixin.qq.com') && !message.includes('channels.weixin.qq.com')) {
      return // 静默处理
    }
  }

  originalConsoleLog.apply(console, args)
}

console.error = function (...args) {
  const message = args.join(' ')

  // 过滤掉HTTPS_CLIENT_ERROR相关的非微信域名错误
  if (
    message.includes('HTTPS_CLIENT_ERROR') ||
    message.includes('Error: socket hang up') ||
    message.includes('ECONNRESET') ||
    message.includes('PROXY_TO_SERVER_REQUEST_ERROR') ||
    message.includes('ETIMEDOUT') ||
    message.includes('AggregateError')
  ) {
    // 检查错误堆栈中是否包含微信域名
    const fullMessage = args.join(' ')
    if (!fullMessage.includes('weixin.qq.com') && !fullMessage.includes('channels.weixin.qq.com')) {
      return // 静默处理
    }
  }

  originalConsoleError.apply(console, args)
}

const proxy = new Proxy()
const sslCaDir = path.join(__dirname, '../../.http-mitm-proxy')
const certManager = new CertificateManager(sslCaDir)

// 监听状态管理
let monitoringStatus = {
  isProxyRunning: false,
  currentTargets: [],
  lastActivity: null,
  totalRequests: 0,
  weixinRequests: 0,
  injectedPages: 0
}

// 视频数据存储
let capturedVideos = []

// 下载任务管理
const downloadTasks = new Map() // videoId -> { cancelToken, promise }

// 更新监听状态
function updateMonitoringStatus(update) {
  monitoringStatus = { ...monitoringStatus, ...update }
  // 向所有窗口广播状态更新
  BrowserWindow.getAllWindows().forEach((window) => {
    window.webContents.send('monitoring-status-update', monitoringStatus)
  })
}

// 移除危险的proxy对象输出，避免EPIPE错误
// console.log(proxy) - 已移除

proxy.onError(function (ctx, err, errorKind) {
  // 静默处理常见的网络连接错误，避免控制台噪音
  if (err.code === 'EPIPE' || err.code === 'ECONNRESET' || err.code === 'ENOTFOUND') {
    // 这些错误通常是由于客户端断开连接或网络问题引起的，属于正常现象
    // 完全静默处理，不输出任何日志
    return
  }

  // 获取请求的域名信息
  const url = ctx?.clientToProxyRequest?.url || ''
  const host = ctx?.clientToProxyRequest?.headers?.host || ''

  // 只处理微信相关域名的错误，其他域名完全静默
  const isWeixinDomain =
    url.includes('weixin.qq.com') ||
    url.includes('channels.weixin.qq.com') ||
    host.includes('weixin.qq.com') ||
    host.includes('channels.weixin.qq.com')

  if (!isWeixinDomain) {
    // 对于非微信域名，完全静默处理所有错误
    return
  }

  // 特别处理HTTP头部重复发送错误
  if (err.code === 'ERR_HTTP_HEADERS_SENT') {
    // 已被全局处理器捕获，这里静默
    return
  }

  // 只对微信域名的重要错误输出日志
  if (errorKind === 'HTTPS_CLIENT_ERROR') {
    console.error('🔒 微信HTTPS证书错误 - 请确保已安装并信任CA证书')
    console.error('证书位置:', path.join(__dirname, '../../.http-mitm-proxy/certs/ca.pem'))
  } else {
    // 只对微信相关的错误输出日志
    console.error(`微信服务错误 [${errorKind}]:`, err.message)
  }
})

// 处理HTTPS连接 - 改进的HTTPS支持
proxy.onConnect(function (req, socket, head, callback) {
  // 只对微信相关域名输出CONNECT日志
  if (req.url.includes('weixin.qq.com') || req.url.includes('channels.weixin.qq.com')) {
    console.log('HTTPS CONNECT:', req.url)
  }

  // 添加socket错误处理
  socket.on('error', (err) => {
    if (err.code === 'EPIPE' || err.code === 'ECONNRESET') {
      // 静默处理常见的连接错误，不输出日志
      // console.log(`🔌 CONNECT socket错误 (${err.code}): ${req.url}`)
    } else {
      console.error('CONNECT socket错误:', err.message)
    }
  })

  // 允许HTTPS连接通过，让代理处理SSL
  return callback()
}) // 存储POST请求数据
const requestData = new Map()

// 监听请求数据
proxy.onRequestData(function (ctx, chunk, callback) {
  const url = ctx.clientToProxyRequest.url
  const method = ctx.clientToProxyRequest.method

  // 收集POST请求数据（包括视频数据和页面信息）
  if (method === 'POST' && (url === '/wvds-video-data' || url === '/wvds-page-info')) {
    const reqId = ctx.clientToProxyRequest.headers['x-request-id'] || Date.now()
    if (!requestData.has(reqId)) {
      requestData.set(reqId, Buffer.alloc(0))
    }
    requestData.set(reqId, Buffer.concat([requestData.get(reqId), chunk]))
    // 为不同类型的请求输出简化日志
    if (url === '/wvds-page-info') {
      console.log(`📄 收集页面信息请求`)
    } else if (url === '/wvds-video-data') {
      console.log(`🎥 收集视频数据请求`)
    }
  }

  callback(null, chunk)
})

// 监听请求结束，处理POST数据
proxy.onRequestEnd(function (ctx, callback) {
  const url = ctx.clientToProxyRequest.url
  const method = ctx.clientToProxyRequest.method

  // 处理页面信息上报
  if (url === '/wvds-page-info' && method === 'POST') {
    const reqId = ctx.clientToProxyRequest.headers['x-request-id'] || Date.now()
    const data = requestData.get(reqId)

    console.log('📄 处理页面信息请求')

    if (data && data.length > 0) {
      try {
        const body = data.toString('utf8')
        const pageInfo = JSON.parse(body)
        console.log('📄 页面标题:', pageInfo.title)

        // 更新currentTargets中对应URL的标题
        const targets = monitoringStatus.currentTargets

        // 尝试多种方式匹配URL
        let existingIndex = targets.findIndex((target) => target.url === pageInfo.url)

        // 如果完全匹配失败，尝试去掉查询参数和hash的匹配
        if (existingIndex === -1) {
          const cleanPageUrl = pageInfo.url.split('?')[0].split('#')[0]
          existingIndex = targets.findIndex((target) => {
            const cleanTargetUrl = target.url.split('?')[0].split('#')[0]
            return cleanTargetUrl === cleanPageUrl
          })
        }

        if (existingIndex !== -1) {
          targets[existingIndex].title = pageInfo.title
          targets[existingIndex].timestamp = pageInfo.timestamp

          updateMonitoringStatus({
            currentTargets: targets
          })

          console.log('✅ 页面标题已更新:', pageInfo.title)
        } else {
          // 如果找不到匹配的记录，直接创建一个新的
          targets.push({
            url: pageInfo.url,
            title: pageInfo.title,
            timestamp: pageInfo.timestamp
          })

          // 保持最近10个目标
          if (targets.length > 10) targets.shift()

          updateMonitoringStatus({
            currentTargets: targets
          })

          console.log('✅ 创建新的页面记录:', pageInfo.title)
        }

        // 清理数据
        requestData.delete(reqId)
      } catch (error) {
        console.error('❌ 解析页面信息失败:', error.message)
      }
    } else {
      console.error('❌ 未找到页面信息请求数据')
    }

    // 检查响应是否已经发送，避免重复写入头部
    try {
      if (!ctx.proxyToClientResponse.headersSent && !ctx.proxyToClientResponse.finished) {
        ctx.proxyToClientResponse.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-WVDS-PageInfo'
        })
        ctx.proxyToClientResponse.end(
          JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Page info received successfully'
          })
        )
      }
    } catch (error) {
      if (error.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('❌ 发送页面信息响应失败:', error.message)
      }
    }
    return
  }

  // 处理视频数据上报
  if (url === '/wvds-video-data' && method === 'POST') {
    const reqId = ctx.clientToProxyRequest.headers['x-request-id'] || Date.now()
    const data = requestData.get(reqId)

    console.log('🎥 处理视频数据请求')

    if (data && data.length > 0) {
      try {
        const body = data.toString('utf8')
        const videoData = JSON.parse(body)

        // 存储视频数据 - 字段映射和数据标准化
        const videoWithMeta = {
          ...videoData,
          title: videoData.description || videoData.title || '未知标题', // 将description映射为title
          capturedAt: new Date().toISOString(),
          id: Date.now() + Math.random().toString(36).substr(2, 9)
        }

        capturedVideos.push(videoWithMeta)

        // 广播到渲染进程
        BrowserWindow.getAllWindows().forEach((window) => {
          window.webContents.send('video-data-captured', videoWithMeta)
        })

        console.log(
          `🎥 捕获视频: ${videoWithMeta.title || '无标题'} (总计: ${capturedVideos.length}个)`
        )

        // 更新监听状态
        updateMonitoringStatus({
          lastActivity: new Date().toISOString(),
          weixinRequests: monitoringStatus.weixinRequests + 1
        })

        // 清理数据
        requestData.delete(reqId)
      } catch (error) {
        console.error('❌ 解析视频数据失败:', error.message)
      }
    } else {
      console.error('❌ 未找到视频数据请求数据')
    }

    // 检查响应是否已经发送，避免重复写入头部
    try {
      if (!ctx.proxyToClientResponse.headersSent && !ctx.proxyToClientResponse.finished) {
        ctx.proxyToClientResponse.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-WVDS-Data'
        })
        ctx.proxyToClientResponse.end(
          JSON.stringify({
            success: true,
            timestamp: new Date().toISOString(),
            message: 'Video data received successfully'
          })
        )
      }
    } catch (error) {
      if (error.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('❌ 发送视频数据响应失败:', error.message)
      }
    }
    return
  }

  callback()
})

// 监听所有请求以便调试
proxy.onRequest(function (ctx, callback) {
  const url = ctx.clientToProxyRequest.url
  const host = ctx.clientToProxyRequest.headers.host
  const method = ctx.clientToProxyRequest.method

  // 处理OPTIONS预检请求
  if (url === '/wvds-video-data' && method === 'OPTIONS') {
    try {
      if (!ctx.proxyToClientResponse.headersSent && !ctx.proxyToClientResponse.finished) {
        ctx.proxyToClientResponse.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-WVDS-Data'
        })
        ctx.proxyToClientResponse.end()
      }
    } catch (error) {
      if (error.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('❌ 发送视频数据OPTIONS响应失败:', error.message)
      }
    }
    return
  }

  // 处理页面信息OPTIONS预检请求
  if (url === '/wvds-page-info' && method === 'OPTIONS') {
    try {
      if (!ctx.proxyToClientResponse.headersSent && !ctx.proxyToClientResponse.finished) {
        ctx.proxyToClientResponse.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-WVDS-PageInfo'
        })
        ctx.proxyToClientResponse.end()
      }
    } catch (error) {
      if (error.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('❌ 发送页面信息OPTIONS响应失败:', error.message)
      }
    }
    return
  }

  // 处理页面信息请求 - 标记但不在这里响应
  if (url === '/wvds-page-info' && method === 'POST') {
    ctx.isPageInfoRequest = true
    // 不要在这里返回，让请求继续到 onRequestEnd
  }

  // 处理视频数据请求 - 标记但不在这里响应
  if (url === '/wvds-video-data' && method === 'POST') {
    ctx.isVideoDataRequest = true
    // 不要在这里返回，让请求继续到 onRequestEnd
  }

  // 更新请求统计（只输出微信相关请求）
  updateMonitoringStatus({
    totalRequests: monitoringStatus.totalRequests + 1,
    lastActivity: new Date().toISOString()
  })

  // 只处理微信视频号页面
  if (host && host.includes('channels.weixin.qq.com')) {
    console.log('🎯 检测到微信视频号:', host)

    // 更新微信请求统计和当前目标
    const currentTarget = {
      url: `https://${host}${url}`, // 添加协议以匹配注入脚本发送的完整URL
      title: '加载中...', // 初始标题，稍后会通过注入脚本更新
      timestamp: new Date().toISOString()
    }

    const targets = monitoringStatus.currentTargets
    // 检查是否已存在相同URL的记录
    const existingIndex = targets.findIndex((target) => target.url === currentTarget.url)
    if (existingIndex === -1) {
      targets.push(currentTarget)
      if (targets.length > 10) targets.shift() // 保持最近10个目标
    } else {
      // 更新时间戳
      targets[existingIndex].timestamp = currentTarget.timestamp
    }

    updateMonitoringStatus({
      weixinRequests: monitoringStatus.weixinRequests + 1,
      currentTargets: targets
    })

    // 检查是否是目标页面 - 修改匹配逻辑以忽略查询参数
    const urlPath = url.split('?')[0] // 去除查询参数

    // 更宽松的匹配逻辑
    const isTargetPage =
      urlPath === '/web/pages/feed' ||
      urlPath.startsWith('/web/pages/feed/') ||
      urlPath.includes('/web/pages/feed')

    if (isTargetPage) {
      console.log('📺 检测到视频号Feed页面，准备注入脚本')
      ctx.use(Proxy.gunzip)

      ctx.onResponseData(function (ctx, chunk, callback) {
        try {
          const chunkStr = chunk.toString()

          // 只处理HTML响应
          if (chunkStr.includes('<html') || chunkStr.includes('<!DOCTYPE')) {
            console.log('✅ 检测到HTML响应，开始注入脚本')

            // 使用嵌入的注入脚本，避免文件路径问题
            const injectScript = INJECT_SCRIPT

            // 将注入的JavaScript代码添加到页面中
            const jsToInject = `
              <script>
                console.log('🎬 爱下脚本已注入 - ${new Date().toISOString()}');
                ${injectScript}
              </script>
            `

            let modifiedChunk = chunkStr
            let injected = false

            // 尝试在</head>标签前注入（优先）
            if (modifiedChunk.includes('</head>')) {
              modifiedChunk = modifiedChunk.replace('</head>', `${jsToInject}</head>`)
              injected = true
            }
            // 如果没有</head>，则在</body>标签前注入
            else if (modifiedChunk.includes('</body>')) {
              modifiedChunk = modifiedChunk.replace('</body>', `${jsToInject}</body>`)
              injected = true
            }
            // 如果都没有，则在HTML末尾添加
            else if (modifiedChunk.includes('</html>')) {
              modifiedChunk = modifiedChunk.replace('</html>', `${jsToInject}</html>`)
              injected = true
            }

            if (injected) {
              console.log('🎉 脚本注入成功！')
              // 更新注入统计
              const newInjectedCount = monitoringStatus.injectedPages + 1
              updateMonitoringStatus({
                injectedPages: newInjectedCount
              })
            }

            chunk = Buffer.from(modifiedChunk)
          }
        } catch (error) {
          console.error('❌ 脚本注入失败:', error.message)
        }

        return callback(null, chunk)
      })
    }
  }

  return callback()
})

console.log('begin listening on 57392')
proxy.listen(
  {
    port: 57392,
    host: '127.0.0.1',
    // 添加SSL配置
    sslCaDir: path.join(__dirname, '../../.http-mitm-proxy'),
    keepAlive: true,
    timeout: 30000, // 增加超时时间到30秒
    // 增强连接管理
    maxSockets: 100,
    maxFreeSockets: 10,
    // 错误恢复
    forceSNI: false,
    // 更好的错误处理
    silent: false
  },
  async (err) => {
    if (err) {
      console.error('代理启动失败:', err)
      updateMonitoringStatus({
        isProxyRunning: false,
        lastActivity: new Date().toISOString()
      })
    } else {
      console.log('🚀 HTTP代理服务器已启动: 127.0.0.1:57392')

      // 更新代理状态
      updateMonitoringStatus({
        isProxyRunning: true,
        lastActivity: new Date().toISOString()
      })

      // 等待一段时间让证书生成
      setTimeout(async () => {
        if (certManager.certificateExists()) {
          const success = await certManager.autoManageCertificate()
          if (success) {
            console.log('✅ SSL证书自动管理完成')
          } else {
            console.log('⚠️ 自动安装失败，可能需要手动安装证书')
            // 在生产环境中，可以显示用户界面提示
            if (!is.dev) {
              await certManager.showManualInstallGuide()
            }
          }
        } else {
          console.log('⏳ 证书尚未生成，请访问HTTPS网站触发证书生成')
        }
      }, 2000)
    }
  }
)

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1680,
    height: 1200,
    show: false,
    autoHideMenuBar: true,
    icon: icon, // 为所有平台设置图标
    title: '爱下 - 视频号下载器', // 设置窗口标题
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()

    // 跟踪应用启动
    analyticsManager.trackEvent('app_window_ready', {
      platform: process.platform,
      electron_version: process.versions.electron,
      app_version: app.getVersion()
    })
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// 跨平台检查是否以管理员身份运行
function isRunningAsAdmin() {
  try {
    const { execSync } = require('child_process')

    if (process.platform === 'win32') {
      // Windows: 尝试执行只有管理员权限才能执行的命令
      execSync('net session', { stdio: 'ignore' })
      return true
    } else if (process.platform === 'darwin') {
      // macOS: 检查用户是否在 admin 组
      const output = execSync('groups', { encoding: 'utf8' })
      return output.includes('admin')
    } else {
      // Linux/其他: 检查是否为 root 用户
      return process.getuid && process.getuid() === 0
    }
  } catch {
    return false
  }
}

// 跨平台以管理员身份重新启动应用
function restartAsAdmin() {
  try {
    console.log(`🔐 重新以管理员身份启动应用 (${process.platform})...`)

    const electronPath = process.execPath
    const args = process.argv.slice(1)

    if (process.platform === 'win32') {
      // Windows: 使用PowerShell启动应用并请求管理员权限
      const psCommand = `Start-Process -FilePath "${electronPath}" -ArgumentList "${args.join('", "')}" -Verb RunAs`

      spawn('powershell', ['-Command', psCommand], {
        detached: true,
        stdio: 'ignore'
      })
    } else if (process.platform === 'darwin') {
      // macOS: 使用AppleScript请求管理员权限
      const script = `do shell script "open '${electronPath}' --args ${args.join(' ')}" with administrator privileges`

      spawn('osascript', ['-e', script], {
        detached: true,
        stdio: 'ignore'
      })
    } else {
      // Linux/其他: 尝试使用 sudo
      spawn('sudo', [electronPath, ...args], {
        detached: true,
        stdio: 'ignore'
      })
    }

    // 退出当前进程
    app.quit()
  } catch (error) {
    console.error('❌ 以管理员身份重启失败:', error.message)
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // 检查管理员权限
  if (!isRunningAsAdmin()) {
    console.log('⚠️ 应用未以管理员身份运行')

    // 在开发模式下不自动重启，只显示警告
    if (is.dev) {
      console.log('🔧 开发模式 - 跳过自动重启')
    } else {
      // 在生产模式下自动重启
      restartAsAdmin()
      return
    }
  } else {
    console.log('✅ 应用已以管理员身份运行')
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.aixia.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Analytics IPC处理
  ipcMain.handle('analytics-initialize', async (event, options) => {
    try {
      await analyticsManager.initialize(options)
      return { success: true }
    } catch (error) {
      console.error('Analytics初始化失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('analytics-track-event', async (event, eventName, parameters) => {
    try {
      analyticsManager.trackEvent(eventName, parameters)
      return { success: true }
    } catch (error) {
      console.error('事件跟踪失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('analytics-track-page', async (event, pageName, customParams) => {
    try {
      analyticsManager.trackPageView(pageName, customParams)
      return { success: true }
    } catch (error) {
      console.error('页面跟踪失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('analytics-set-consent', async (event, consent) => {
    try {
      await analyticsManager.saveUserConsent(consent)
      return { success: true }
    } catch (error) {
      console.error('保存用户同意状态失败:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('analytics-get-consent', async () => {
    try {
      const consent = await analyticsManager.getUserConsent()
      return { success: true, consent }
    } catch (error) {
      console.error('获取用户同意状态失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 证书管理IPC处理
  ipcMain.handle('install-certificate', async () => {
    try {
      const success = await certManager.autoManageCertificate()
      return { success, message: success ? '证书安装成功' : '证书安装失败' }
    } catch (error) {
      console.error('证书安装错误:', error)
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('check-certificate', async () => {
    try {
      const exists = certManager.certificateExists()
      const installed = exists ? await certManager.isCertificateInstalled() : false
      return {
        exists,
        installed,
        path: certManager.caCertPath
      }
    } catch (error) {
      console.error('检查证书状态错误:', error)
      return { exists: false, installed: false, error: error.message }
    }
  })

  // 管理员权限相关IPC处理
  ipcMain.handle('check-admin-status', async () => {
    try {
      const isAdmin = isRunningAsAdmin()
      return { isAdmin }
    } catch (error) {
      console.error('检查管理员权限错误:', error)
      return { isAdmin: false, error: error.message }
    }
  })

  // 检查管理员权限
  if (!isRunningAsAdmin()) {
    console.log('⚠️ 应用未以管理员身份运行，某些功能可能无法正常工作')

    // 可选：自动以管理员身份重启应用
    // restartAsAdmin()
  }

  // 监听状态相关IPC处理
  ipcMain.handle('get-monitoring-status', async () => {
    return monitoringStatus
  })

  // 视频数据相关IPC处理
  ipcMain.handle('get-captured-videos', async () => {
    return capturedVideos
  })

  ipcMain.handle('clear-captured-videos', async () => {
    const count = capturedVideos.length
    capturedVideos = []
    return { success: true, cleared: count }
  })

  ipcMain.handle('uninstall-certificate', async () => {
    try {
      const success = await certManager.uninstallCertificate()
      return { success, message: success ? '证书卸载成功' : '证书卸载失败' }
    } catch (error) {
      console.error('证书卸载错误:', error)
      return { success: false, message: error.message }
    }
  })

  // 显示证书文件夹
  ipcMain.handle('show-certificate-folder', async () => {
    try {
      if (certManager.certificateExists()) {
        shell.showItemInFolder(certManager.caCertPath)
        return { success: true, message: '已打开证书文件夹' }
      } else {
        return { success: false, message: '证书文件不存在' }
      }
    } catch (error) {
      console.error('打开证书文件夹失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 更新页面标题信息
  ipcMain.handle('update-page-title', async (event, pageInfo) => {
    try {
      const targets = monitoringStatus.currentTargets
      const existingIndex = targets.findIndex((target) => target.url === pageInfo.url)

      if (existingIndex !== -1) {
        // 更新现有记录的标题
        targets[existingIndex].title = pageInfo.title
        targets[existingIndex].timestamp = pageInfo.timestamp

        updateMonitoringStatus({
          currentTargets: targets
        })

        console.log('✅ 页面标题已更新:', pageInfo.title)
        return { success: true, message: '页面标题更新成功' }
      } else {
        console.log('⚠️ 未找到对应的URL记录:', pageInfo.url)
        return { success: false, message: '未找到对应的URL记录' }
      }
    } catch (error) {
      console.error('更新页面标题失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 下载相关IPC处理
  ipcMain.handle('download-video', async (event, videoData) => {
    try {
      console.log('🎬 开始下载视频:', videoData.title)

      // 记录下载开始时间用于Analytics
      const downloadStartTime = Date.now()

      // 跟踪下载开始事件
      analyticsManager.trackFeatureUsage('video_download', 'download_start', 1)

      // 检查是否已有下载任务
      if (downloadTasks.has(videoData.id)) {
        return { success: false, message: '该视频正在下载中' }
      }

      // 获取系统下载文件夹路径
      const downloadDir = path.join(os.homedir(), 'Downloads', 'WechatVideos')

      // 确保下载文件夹存在
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true })
      }

      // 生成文件名 (使用时间戳避免重名)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

      // 安全地处理标题，确保是字符串类型
      const safeTitle = String(videoData.title || '未知标题')
      const sanitizedTitle = safeTitle
        .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // 保留中文、英文、数字、空格、短横线
        .replace(/\s+/g, '_') // 将空格替换为下划线
        .substring(0, 50)
      const fileName = `${sanitizedTitle}_${timestamp}.mp4`
      const fullFilePath = path.join(downloadDir, fileName)

      console.log('📁 下载路径:', fullFilePath)

      // 创建取消令牌
      const cancelToken = CancelToken.create()

      // 使用 downloadFile 函数下载
      const downloadPromise = downloadFile(
        String(videoData.url),
        String(videoData.decode_key),
        String(fullFilePath),
        (progress) => {
          // 发送进度更新到渲染进程
          const percentage = Math.round(Number(progress) * 100) || 0
          console.log(`📊 下载进度: ${percentage}%`)

          // 广播进度更新
          BrowserWindow.getAllWindows().forEach((window) => {
            window.webContents.send('download-progress', {
              videoId: String(videoData.id),
              progress: percentage
            })
          })
        },
        cancelToken // 传递取消令牌
      )

      // 存储下载任务
      downloadTasks.set(videoData.id, {
        cancelToken,
        promise: downloadPromise
      })

      const result = await downloadPromise

      // 清理下载任务
      downloadTasks.delete(videoData.id)

      console.log('✅ 下载完成:', result.fullFileName)

      // 跟踪下载完成事件
      analyticsManager.trackFeatureUsage('video_download', 'download_complete', 1)
      analyticsManager.trackEvent('download_success', {
        file_size: videoData.size || 0,
        duration_ms: Date.now() - downloadStartTime
      })

      // 广播下载完成
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('download-completed', {
          videoId: String(videoData.id),
          filePath: String(result.fullFileName),
          fileSize: Number(result.totalLen) || 0
        })
      })

      return {
        success: true,
        filePath: result.fullFileName,
        fileSize: result.totalLen,
        message: '下载完成'
      }
    } catch (error) {
      // 清理下载任务
      downloadTasks.delete(videoData.id)

      console.error('❌ 下载失败:', error)

      // 跟踪下载失败事件
      analyticsManager.trackError(`Download failed: ${error.message}`, 'video_download')
      analyticsManager.trackFeatureUsage('video_download', 'download_failed', 1)

      // 广播下载失败
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('download-failed', {
          videoId: String(videoData.id),
          error: String(error.message)
        })
      })

      return {
        success: false,
        message: error.message
      }
    }
  })

  // 打开下载文件夹
  ipcMain.handle('open-download-folder', async () => {
    try {
      const downloadDir = path.join(os.homedir(), 'Downloads', 'WechatVideos')

      // 确保文件夹存在
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true })
      }

      shell.openPath(downloadDir)
      return { success: true, message: '已打开下载文件夹' }
    } catch (error) {
      console.error('打开下载文件夹失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 显示下载的文件
  ipcMain.handle('show-downloaded-file', async (event, filePath) => {
    try {
      shell.showItemInFolder(filePath)
      return { success: true, message: '已定位文件' }
    } catch (error) {
      console.error('定位文件失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 取消下载
  ipcMain.handle('cancel-download', async (event, videoId) => {
    try {
      console.log('🚫 请求取消下载:', videoId)

      // 查找下载任务
      const task = downloadTasks.get(videoId)
      if (!task) {
        return { success: false, message: '未找到下载任务' }
      }

      // 取消下载
      if (task.cancelToken) {
        task.cancelToken.cancel()
        console.log('✅ 已发送取消信号')
      }

      // 清理下载任务
      downloadTasks.delete(videoId)

      // 广播下载取消事件
      BrowserWindow.getAllWindows().forEach((window) => {
        window.webContents.send('download-cancelled', {
          videoId: String(videoId)
        })
      })

      return { success: true, message: '下载已取消' }
    } catch (error) {
      console.error('取消下载失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 代理控制相关IPC处理
  ipcMain.handle('start-proxy', async () => {
    try {
      // 如果代理已经在运行，直接返回成功
      if (monitoringStatus.isProxyRunning) {
        // 设置系统代理
        const proxyManager = new (await import('./proxy-manager.js')).default()
        const success = await proxyManager.setSystemProxy('127.0.0.1', 57392)
        return {
          success: true,
          message: success ? '代理已启动，系统代理已设置' : '代理已启动，但系统代理设置失败'
        }
      }

      // 如果代理未运行，这里可以重新启动代理
      // 但由于当前架构中代理是在应用启动时启动的，我们这里主要处理系统代理设置
      const proxyManager = new (await import('./proxy-manager.js')).default()
      const success = await proxyManager.setSystemProxy('127.0.0.1', 57392)

      if (success) {
        console.log('✅ 系统代理已设置为 127.0.0.1:57392')
        return { success: true, message: '代理启动成功，系统代理已设置' }
      } else {
        return { success: false, message: '代理启动失败，无法设置系统代理' }
      }
    } catch (error) {
      console.error('启动代理失败:', error)
      return { success: false, message: error.message }
    }
  })

  ipcMain.handle('stop-proxy', async () => {
    try {
      const proxyManager = new (await import('./proxy-manager.js')).default()
      const success = await proxyManager.clearSystemProxy()

      if (success) {
        console.log('✅ 系统代理已清除')
        return { success: true, message: '代理已停止，系统代理已清除' }
      } else {
        return { success: false, message: '清除系统代理失败' }
      }
    } catch (error) {
      console.error('停止代理失败:', error)
      return { success: false, message: error.message }
    }
  })

  // 获取代理状态
  ipcMain.handle('get-proxy-status', async () => {
    try {
      const proxyManager = new (await import('./proxy-manager.js')).default()
      const status = await proxyManager.getProxyStatus()
      return {
        success: true,
        ...status,
        serverRunning: monitoringStatus.isProxyRunning
      }
    } catch (error) {
      console.error('获取代理状态失败:', error)
      return { success: false, error: error.message }
    }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 应用退出前清理系统代理
app.on('before-quit', async (event) => {
  console.log('🔄 应用即将退出，开始清理系统代理...')

  try {
    // 阻止应用立即退出，等待清理完成
    event.preventDefault()

    // 创建代理管理器实例
    const proxyManager = new (await import('./proxy-manager.js')).default()

    // 清除系统代理
    const success = await proxyManager.clearSystemProxy()

    if (success) {
      console.log('✅ 系统代理已清除')

      // 发送分析事件
      if (analyticsManager) {
        await analyticsManager.trackEvent('app_lifecycle', 'app_quit_with_proxy_cleanup', {
          cleanup_success: true
        })
      }
    } else {
      console.log('⚠️ 系统代理清除失败，但应用仍将退出')

      // 发送分析事件
      if (analyticsManager) {
        await analyticsManager.trackEvent('app_lifecycle', 'app_quit_with_proxy_cleanup', {
          cleanup_success: false
        })
      }
    }
  } catch (error) {
    console.error('❌ 清理系统代理时出错:', error.message)

    // 发送错误事件
    if (analyticsManager) {
      await analyticsManager.trackEvent('errors', 'proxy_cleanup_error', {
        error_message: error.message
      })
    }
  }

  // 清理完成后，真正退出应用
  app.exit(0)
})

// 处理应用被强制关闭的情况 (Ctrl+C, 任务管理器等)
process.on('SIGINT', async () => {
  console.log('🛑 接收到 SIGINT 信号，开始清理...')
  await cleanupBeforeExit()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('🛑 接收到 SIGTERM 信号，开始清理...')
  await cleanupBeforeExit()
  process.exit(0)
})

// Windows 系统的特殊处理
if (process.platform === 'win32') {
  process.on('SIGBREAK', async () => {
    console.log('🛑 接收到 SIGBREAK 信号，开始清理...')
    await cleanupBeforeExit()
    process.exit(0)
  })
}

// 清理函数
async function cleanupBeforeExit() {
  try {
    console.log('🧹 执行退出前清理...')

    // 清除系统代理
    const proxyManager = new (await import('./proxy-manager.js')).default()
    const success = await proxyManager.clearSystemProxy()

    if (success) {
      console.log('✅ 系统代理已清除')
    } else {
      console.log('⚠️ 系统代理清除失败')
    }

    // 发送最终分析事件
    if (analyticsManager) {
      await analyticsManager.trackEvent('app_lifecycle', 'app_force_quit_cleanup', {
        cleanup_success: success
      })
    }
  } catch (error) {
    console.error('❌ 清理过程中出错:', error.message)
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
