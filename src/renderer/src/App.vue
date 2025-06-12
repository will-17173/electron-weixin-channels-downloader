<template>
  <div class="app-container">
    <div class="app-layout">
      <!-- 左列：视频监控中心 -->
      <div class="left-column">
        <!-- 视频监控中心 (合并原来的两个模块) -->
        <div class="video-monitor-section">
          <h2>🎥 爱下 - 视频号下载器</h2>

          <!-- 视频列表 -->
          <div class="video-list-container">
            <!-- 视频列表标题和操作按钮 -->
            <div class="video-list-header">
              <h3>📋 视频列表 ({{ videoMonitorStatus.totalCapturedCount }} 个)</h3>
              <div class="video-list-actions">
                <button class="action-btn refresh-btn" @click="refreshVideoMonitorStatus">
                  🔄 刷新状态
                </button>
                <button class="action-btn clear-btn" @click="clearVideoData">🗑️ 清空数据</button>
              </div>
            </div>

            <div v-if="videoMonitorStatus.videos.length === 0" class="no-videos">
              <div class="no-videos-content">
                <div class="no-videos-icon">📱</div>
                <h4>暂无捕获的视频</h4>
                <p>请按照以下步骤开始捕获视频：</p>
                <div class="no-videos-steps">
                  <p>操作步骤：</p>
                  <ol>
                    <li>确保证书已安装并信任</li>
                    <li>启动代理服务器</li>
                    <li>在微信中访问视频号页面</li>
                    <li>开始浏览视频，系统会自动捕获</li>
                  </ol>
                </div>
              </div>
            </div>

            <div v-else class="video-list">
              <div
                v-for="(video, index) in displayedVideos"
                :key="video.id || index"
                class="video-item"
              >
                <div class="video-content">
                  <div class="video-main-info">
                    <div class="video-title">
                      <span class="title-text">
                        {{ video.title || video.description || '未知标题' }}
                      </span>
                      <span class="video-index">#{{ index + 1 }}</span>
                    </div>

                    <div class="video-meta">
                      <div class="meta-row">
                        <div class="meta-item">
                          <span class="meta-icon">👤</span>
                          <span class="meta-label">发布者:</span>
                          <span class="meta-value">{{ video.uploader || '未知' }}</span>
                        </div>
                        <div class="meta-item">
                          <span class="meta-icon">📏</span>
                          <span class="meta-label">大小:</span>
                          <span class="meta-value">{{ formatFileSize(video.size) }}</span>
                        </div>
                      </div>

                      <div class="meta-row">
                        <div class="meta-item">
                          <span class="meta-icon">⏰</span>
                          <span class="meta-label">访问时间:</span>
                          <span class="meta-value">{{ formatTime(video.capturedAt) }}</span>
                        </div>
                        <div class="meta-item">
                          <span class="meta-icon">🎬</span>
                          <span class="meta-label">类型:</span>
                          <span class="meta-value">{{ video.media_type || 'video' }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 下载区域 -->
                  <div class="video-download">
                    <!-- 下载按钮 -->
                    <button
                      v-if="!video.downloading && !video.downloaded"
                      :disabled="!video.url"
                      class="download-btn"
                      @click="downloadVideo(video)"
                    >
                      <span class="download-icon">⬇️</span>
                      <span class="download-text">下载</span>
                    </button>

                    <!-- 下载进度 -->
                    <div v-if="video.downloading" class="download-progress">
                      <div class="progress-info">
                        <span class="progress-text">下载中...</span>
                        <span class="progress-percentage">{{ video.downloadProgress || 0 }}%</span>
                      </div>
                      <div class="progress-bar">
                        <div
                          class="progress-fill"
                          :style="{ width: (video.downloadProgress || 0) + '%' }"
                        ></div>
                      </div>
                      <button class="cancel-btn" @click="cancelDownload(video)">❌</button>
                    </div>

                    <!-- 下载完成 -->
                    <div v-if="video.downloaded" class="download-completed">
                      <span class="completed-icon">✅</span>
                      <span class="completed-text">已下载</span>
                      <button class="open-btn" @click="openDownloadFolder(video)">📂</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 显示更多视频的提示 -->
              <div
                v-if="videoMonitorStatus.videos.length > displayLimit"
                class="more-videos-notice"
              >
                <p>📋 还有 {{ videoMonitorStatus.videos.length - displayLimit }} 个视频未显示</p>
                <p class="tip">💡 点击"导出JSON"查看完整列表</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右列：证书管理和代理服务器 -->
      <div class="right-column">
        <!-- 按钮组 -->
        <div class="action-buttons-container">
          <button class="guide-button" title="查看使用指南" @click="showUserGuide">
            📖 使用指南
          </button>
          <button class="donation-button" title="支持开发者" @click="showDonation">
            💖 赞赏支持
          </button>
        </div>

        <!-- 证书管理 -->
        <div class="section">
          <h3>🔐 证书管理 <span class="platform-badge">HTTPS</span></h3>

          <div class="status-indicators">
            <div class="status-item">
              <span>证书状态:</span>
              <span v-if="certificateStatus.loading" class="status-warning">检查中...</span>
              <span v-else-if="certificateStatus.exists" class="status-success">✅ 已生成</span>
              <span v-else class="status-error">❌ 未生成</span>
            </div>

            <div class="status-item">
              <span>安装状态:</span>
              <span v-if="certificateStatus.loading" class="status-warning">检查中...</span>
              <span v-else-if="certificateStatus.installed" class="status-success">✅ 已安装</span>
              <span v-else class="status-error">❌ 未安装</span>
            </div>
          </div>

          <div class="cert-actions">
            <button
              class="btn-primary"
              :disabled="certificateStatus.loading"
              @click="checkCertificate"
            >
              🔍 检查证书
            </button>

            <button
              class="btn-primary"
              :disabled="certificateStatus.loading || !certificateStatus.exists"
              @click="installCertificate"
            >
              📥 安装证书
            </button>

            <button
              class="btn-secondary"
              :disabled="certificateStatus.loading || !certificateStatus.installed"
              @click="uninstallCertificate"
            >
              🗑️ 卸载证书
            </button>
          </div>

          <div v-if="certificateStatus.path" class="cert-path">
            <strong>证书路径:</strong> {{ certificateStatus.path }}
          </div>

          <div class="platform-guide">
            <h4 v-if="isWindows">Windows 安装指南:</h4>
            <h4 v-else-if="isMacOS">macOS 安装指南:</h4>
            <h4 v-else>安装指南:</h4>

            <!-- Windows 安装指南 -->
            <ol v-if="isWindows">
              <li>点击"安装证书"按钮</li>
              <li>在弹出的证书安装对话框中选择"当前用户"或"本地计算机"</li>
              <li>选择"将所有的证书都放入下列存储"</li>
              <li>点击"浏览"按钮，选择"受信任的根证书颁发机构"</li>
              <li>点击"确定"完成安装</li>
              <li>如需管理员权限，请右键以管理员身份运行应用</li>
              <li>如遇安装失败，请检查Windows安全设置或防病毒软件设置</li>
            </ol>

            <!-- macOS 安装指南 -->
            <ol v-else-if="isMacOS">
              <li>点击"安装证书"按钮</li>
              <li>在弹出的密码框中输入管理员密码</li>
              <li>如果自动安装失败，会自动打开证书文件</li>
              <li>双击证书选择"系统"钥匙串并安装</li>
              <li>双击证书设置信任为"始终信任"</li>
            </ol>

            <!-- 通用安装指南 -->
            <ol v-else>
              <li>点击"安装证书"按钮</li>
              <li>根据系统提示安装证书到受信任的根证书存储</li>
              <li>确保证书被设置为受信任状态</li>
              <li>重启浏览器使证书生效</li>
            </ol>
          </div>
        </div>

        <!-- 代理服务器 -->
        <div class="section">
          <h3>🌐 代理服务器 <span class="platform-badge">mitmproxy</span></h3>

          <div class="status-indicators">
            <div class="status-item">
              <span>服务状态:</span>
              <span v-if="videoMonitorStatus.isProxyRunning" class="status-success">✅ 运行中</span>
              <span v-else class="status-error">❌ 已停止</span>
            </div>
          </div>
          <div class="proxy-actions">
            <button
              class="btn-primary"
              :disabled="systemProxyStatus.enabled || systemProxyStatus.loading"
              @click="startProxy"
            >
              ▶️ 启动代理
            </button>

            <button
              class="btn-danger"
              :disabled="!systemProxyStatus.enabled || systemProxyStatus.loading"
              @click="stopProxy"
            >
              ⏹️ 停止代理
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 使用指南组件 -->
    <UserGuide
      :visible="showGuide"
      @update:visible="updateGuideVisible"
      @dont-show-again="handleDontShowAgain"
    />

    <!-- 赞赏弹窗组件 -->
    <DonationModal :visible="showDonationModal" @update:visible="updateDonationVisible" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAnalytics, AnalyticsEvents, AnalyticsFeatures } from './composables/useAnalytics.js'
import { useFirstLaunch, useGuideAnalytics } from './composables/useFirstLaunch.js'
import UserGuide from './components/UserGuide.vue'
import DonationModal from './components/DonationModal.vue'

// Analytics组合式函数
const analytics = useAnalytics()

// 首次启动和指南相关
const { showGuide, setDontShowAgain } = useFirstLaunch()
const { trackGuideShown, trackGuideClosed } = useGuideAnalytics()

// 赞赏弹窗状态
const showDonationModal = ref(false)

// 操作系统检测
const isWindows = computed(() => {
  return navigator.userAgent.includes('Windows') || navigator.platform.includes('Win')
})

const isMacOS = computed(() => {
  return navigator.userAgent.includes('Mac') || navigator.platform.includes('Mac')
})

// 证书管理相关
// 证书状态
const certificateStatus = ref({
  exists: false,
  installed: false,
  path: '',
  loading: false
})

// 合并后的视频监控状态
const videoMonitorStatus = ref({
  // 代理状态
  isProxyRunning: false,
  totalRequests: 0,
  weixinRequests: 0,
  injectedPages: 0,
  lastActivity: null,
  // 视频数据
  totalCapturedCount: 0,
  videos: []
})

// 系统代理状态
const systemProxyStatus = ref({
  enabled: false,
  loading: false
})

// 显示限制
const displayLimit = 10

// 计算显示的视频列表
const displayedVideos = computed(() => {
  return videoMonitorStatus.value.videos.slice(0, displayLimit)
})

// 监听状态更新
let unsubscribeMonitoring = null
let unsubscribeVideoCapture = null

// 检查证书状态
const checkCertificate = async () => {
  try {
    certificateStatus.value.loading = true
    const result = await window.electron.ipcRenderer.invoke('check-certificate')
    certificateStatus.value = { ...result, loading: false }
  } catch (error) {
    console.error('检查证书失败:', error)
    certificateStatus.value.loading = false
  }
}

// 安装证书
const installCertificate = async () => {
  try {
    certificateStatus.value.loading = true
    const result = await window.electron.ipcRenderer.invoke('install-certificate')
    if (result.success) {
      await checkCertificate()
    } else {
      console.error('安装证书失败:', result.error)
    }
  } catch (error) {
    console.error('安装证书失败:', error)
  }
  certificateStatus.value.loading = false
}

// 卸载证书
const uninstallCertificate = async () => {
  try {
    certificateStatus.value.loading = true
    const result = await window.electron.ipcRenderer.invoke('uninstall-certificate')
    if (result.success) {
      await checkCertificate()
    } else {
      console.error('卸载证书失败:', result.error)
    }
  } catch (error) {
    console.error('卸载证书失败:', error)
  }
  certificateStatus.value.loading = false
}

// 启动代理
const startProxy = async () => {
  try {
    systemProxyStatus.value.loading = true

    // 跟踪代理启动事件
    analytics.trackFeature(AnalyticsFeatures.PROXY_CONTROL, 'start_proxy')

    const result = await window.api.startProxy()
    console.log('启动代理结果:', result)
    if (result.success) {
      console.log('✅ 代理启动成功:', result.message)
      analytics.trackEvent(AnalyticsEvents.PROXY_START, { success: true })
    } else {
      console.error('❌ 代理启动失败:', result.message)
      analytics.trackEvent(AnalyticsEvents.PROXY_START, { success: false, error: result.message })
    }
    await refreshVideoMonitorStatus()
  } catch (error) {
    console.error('启动代理失败:', error)
    analytics.trackError(error, 'proxy_start')
    systemProxyStatus.value.loading = false
  }
}

// 停止代理
const stopProxy = async () => {
  try {
    systemProxyStatus.value.loading = true

    // 跟踪代理停止事件
    analytics.trackFeature(AnalyticsFeatures.PROXY_CONTROL, 'stop_proxy')

    const result = await window.api.stopProxy()
    console.log('停止代理结果:', result)
    if (result.success) {
      console.log('✅ 代理停止成功:', result.message)
      analytics.trackEvent(AnalyticsEvents.PROXY_STOP, { success: true })
    } else {
      console.error('❌ 代理停止失败:', result.message)
    }
    await refreshVideoMonitorStatus()
  } catch (error) {
    console.error('停止代理失败:', error)
    systemProxyStatus.value.loading = false
  }
}

// 刷新视频监控状态 (合并原来的两个函数)
const refreshVideoMonitorStatus = async () => {
  try {
    // 获取监听状态
    const monitoringStatus = await window.api.getMonitoringStatus()
    // 获取视频数据
    const videos = await window.api.getCapturedVideos()

    // 获取系统代理状态
    try {
      const proxyStatusResult = await window.api.getProxyStatus()
      if (proxyStatusResult.success) {
        systemProxyStatus.value = {
          enabled: proxyStatusResult.enabled || false,
          loading: false
        }
      }
    } catch (error) {
      console.error('获取系统代理状态失败:', error)
      systemProxyStatus.value.loading = false
    }

    // 合并状态
    videoMonitorStatus.value = {
      ...monitoringStatus,
      totalCapturedCount: videos.length,
      videos: videos
    }
  } catch (error) {
    console.error('刷新视频监控状态失败:', error)
  }
}

// 清空视频数据
const clearVideoData = async () => {
  try {
    if (confirm('确定要清空所有捕获的视频数据吗？此操作不可撤销。')) {
      await window.api.clearCapturedVideos()
      await refreshVideoMonitorStatus()
    }
  } catch (error) {
    console.error('清空视频数据失败:', error)
  }
}

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '未知'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
  return (bytes / 1073741824).toFixed(1) + ' GB'
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 下载相关功能
const downloadVideo = async (video) => {
  try {
    // 跟踪下载开始事件
    analytics.trackFeature(AnalyticsFeatures.VIDEO_DOWNLOAD, 'download_start')

    // 检查必要的下载参数
    if (!video.url || !video.decode_key) {
      alert('视频信息不完整，无法下载')
      analytics.trackEvent('download_error', { error: 'missing_parameters' })
      return
    }

    // 设置下载状态
    video.downloading = true
    video.downloadProgress = 0
    video.downloaded = false

    // 处理 title 和 description，截取第一个 \n 之前的内容
    const processText = (text) => {
      try {
        if (!text || typeof text !== 'string') return ''
        return String(text).split('\n')[0].trim()
      } catch (error) {
        console.error('❌ processText 错误:', error, 'input:', text)
        return '处理错误'
      }
    }

    const processedTitle = processText(video.title) || processText(video.description) || '未知标题'
    const processedDescription = processText(video.description)

    // 调用主进程的下载方法 - 只传递必要的序列化数据
    const videoData = {
      id: String(video.id || 'unknown'),
      title: String(processedTitle || 'unknown'),
      description: String(processedDescription || ''),
      url: String(video.url || ''),
      decode_key: String(video.decode_key || ''),
      size: Number(video.size) || 0,
      uploader: String(video.uploader || ''),
      media_type: String(video.media_type || 'video'),
      timestamp: Number(video.timestamp) || Date.now(),
      capturedAt: Number(video.capturedAt) || Date.now()
    }

    const result = await window.api.downloadVideo(videoData)

    if (result.success) {
      video.downloading = false
      video.downloaded = true
      video.downloadPath = result.filePath
      video.downloadSize = result.fileSize
    } else {
      console.error('下载失败:', result.message)
      video.downloading = false
      alert(`下载失败: ${result.message}`)
    }
  } catch (error) {
    console.error('❌ 下载视频失败:', error)
    console.error('错误堆栈:', error.stack)
    video.downloading = false
    alert(`下载失败: ${error.message}`)
  }
}

const cancelDownload = async (video) => {
  try {
    console.log('🚫 取消下载:', video.title)

    // 调用后端取消下载API
    const result = await window.api.cancelDownload(video.id)

    if (result.success) {
      console.log('✅ 下载取消成功:', result.message)
      // UI状态会通过下载取消事件自动更新
    } else {
      console.error('❌ 取消下载失败:', result.message)
      // 手动重置状态作为备选
      video.downloading = false
      video.downloadProgress = 0
    }
  } catch (error) {
    console.error('取消下载失败:', error)
    // 手动重置状态作为备选
    video.downloading = false
    video.downloadProgress = 0
  }
}

const openDownloadFolder = async (video) => {
  try {
    if (video.downloadPath) {
      // 打开到具体文件
      await window.api.showDownloadedFile(video.downloadPath)
    } else {
      // 打开下载文件夹
      await window.api.openDownloadFolder()
    }
  } catch (error) {
    console.error('打开文件夹失败:', error)
    alert(`打开文件夹失败: ${error.message}`)
  }
}

// 监听状态更新
const setupStatusListeners = () => {
  // 监听代理状态和网络活动
  if (window.api && window.api.onMonitoringStatusUpdate) {
    unsubscribeMonitoring = window.api.onMonitoringStatusUpdate((status) => {
      // 更新代理相关状态
      videoMonitorStatus.value.isProxyRunning = status.isProxyRunning
      videoMonitorStatus.value.totalRequests = status.totalRequests
      videoMonitorStatus.value.weixinRequests = status.weixinRequests
      videoMonitorStatus.value.injectedPages = status.injectedPages
      videoMonitorStatus.value.lastActivity = status.lastActivity
    })
  }

  // 监听视频捕获更新
  if (window.api && window.api.onVideoCaptured) {
    unsubscribeVideoCapture = window.api.onVideoCaptured((newVideo) => {
      // 添加新视频到列表开头
      videoMonitorStatus.value.videos.unshift(newVideo)
      videoMonitorStatus.value.totalCapturedCount = videoMonitorStatus.value.videos.length
    })
  }

  // 监听下载进度更新
  if (window.api && window.api.onDownloadProgress) {
    window.api.onDownloadProgress((data) => {
      const video = videoMonitorStatus.value.videos.find((v) => v.id === data.videoId)
      if (video) {
        video.downloadProgress = data.progress
      }
    })
  }

  // 监听下载完成
  if (window.api && window.api.onDownloadCompleted) {
    window.api.onDownloadCompleted((data) => {
      const video = videoMonitorStatus.value.videos.find((v) => v.id === data.videoId)
      if (video) {
        video.downloading = false
        video.downloaded = true
        video.downloadPath = data.filePath
        video.downloadSize = data.fileSize
      }
    })
  }

  // 监听下载失败
  if (window.api && window.api.onDownloadFailed) {
    window.api.onDownloadFailed((data) => {
      const video = videoMonitorStatus.value.videos.find((v) => v.id === data.videoId)
      if (video) {
        video.downloading = false
        video.downloadProgress = 0
      }
      // alert(`下载失败: ${data.error}`)
    })
  }

  // 监听下载取消
  if (window.api && window.api.onDownloadCancelled) {
    window.api.onDownloadCancelled((data) => {
      const video = videoMonitorStatus.value.videos.find((v) => v.id === data.videoId)
      if (video) {
        video.downloading = false
        video.downloadProgress = 0
        console.log('📋 UI状态已重置，下载已取消:', video.title)
      }
    })
  }
}

// 使用指南相关方法
const showUserGuide = () => {
  showGuide.value = true
  trackGuideShown(false) // 手动打开
}

// 赞赏相关方法
const showDonation = () => {
  showDonationModal.value = true
  // 跟踪赞赏弹窗显示事件
  analytics.trackFeature(AnalyticsFeatures.USER_ENGAGEMENT, 'donation_modal_shown')
}

const updateDonationVisible = (visible) => {
  showDonationModal.value = visible
  if (!visible) {
    // 跟踪赞赏弹窗关闭事件
    analytics.trackFeature(AnalyticsFeatures.USER_ENGAGEMENT, 'donation_modal_closed')
  }
}

const updateGuideVisible = (visible) => {
  showGuide.value = visible
}

const handleDontShowAgain = (dontShow) => {
  setDontShowAgain(dontShow)
  trackGuideClosed(dontShow)
}

// 清理监听器
const cleanup = () => {
  if (unsubscribeMonitoring) {
    unsubscribeMonitoring()
    unsubscribeMonitoring = null
  }
  if (unsubscribeVideoCapture) {
    unsubscribeVideoCapture()
    unsubscribeVideoCapture = null
  }
}

// 组件挂载
onMounted(async () => {
  await checkCertificate()
  await refreshVideoMonitorStatus()
  setupStatusListeners()

  // 检查是否是首次启动，如果是则显示指南
  // useFirstLaunch composable会自动处理首次启动检测
  if (showGuide.value) {
    trackGuideShown(true) // 首次启动自动显示
  }
})

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  cleanup()
})
</script>

<style scoped>
/* 全屏布局 - 现代简洁设计 */
.app-container {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', 'SF Pro Display', sans-serif;
  height: 100vh;
  overflow: hidden;
  background: #f8fafc;
  position: relative;
}

/* 左右布局 - 简洁设计 */
.app-layout {
  display: flex;
  height: 100vh;
  gap: 16px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

/* 左列：视频监控中心 */
.left-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

/* 右列：证书管理和代理服务器 */
.right-column {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow: auto;
}

/* 按钮组样式 */
.action-buttons-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.guide-button,
.donation-button {
  flex: 1;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.guide-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
}

.guide-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.donation-button {
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.2);
}

.donation-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(255, 107, 107, 0.3);
}

.guide-button:active,
.donation-button:active {
  transform: translateY(0);
}

/* 右列中的section样式 - 简洁设计 */
.right-column .section {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.right-column .section:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.right-column .section h3 {
  margin: 0 0 16px 0;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
}

.platform-badge {
  background: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 状态指示器 - 简洁设计 */
.status-indicators {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  transition: all 0.2s ease;
}

.status-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.status-success {
  color: #10b981;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-success::before {
  content: '●';
  font-size: 12px;
  animation: pulse 2s infinite;
}

.status-warning {
  color: #f59e0b;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-warning::before {
  content: '●';
  font-size: 12px;
  animation: pulse 2s infinite;
}

.status-error {
  color: #ef4444;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-error::before {
  content: '●';
  font-size: 12px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* 现代简洁按钮样式 */
.btn-primary,
.btn-secondary,
.btn-danger {
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  margin: 4px 0;
  transition: all 0.2s ease;
  width: 100%;
  position: relative;
  overflow: hidden;
  text-transform: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-primary:disabled,
.btn-secondary:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 证书管理特定样式 - 简洁设计 */
.platform-guide {
  margin: 12px 0;
  padding: 12px 16px;
  background: #fef3c7;
  border: 1px solid #fbbf24;
  border-radius: 8px;
  position: relative;
}

.platform-guide h4 {
  margin: 0 0 8px 0;
  color: #92400e;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.platform-guide ol {
  margin: 0;
  padding-left: 16px;
  color: #92400e;
}

.platform-guide li {
  margin-bottom: 4px;
  line-height: 1.4;
  font-size: 11px;
  font-weight: 400;
}

.cert-actions {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cert-path {
  font-size: 11px;
  color: #64748b;
  margin: 10px 0;
  word-break: break-all;
  padding: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.admin-actions {
  margin-top: 15px;
}

.admin-actions .tip {
  margin-top: 8px;
  font-style: italic;
  font-size: 11px;
  color: #64748b;
  padding: 6px 8px;
  background: #f1f5f9;
  border-radius: 6px;
  border-left: 3px solid #3b82f6;
}

.target-page {
  margin-top: 12px;
  padding: 12px 16px;
  background: #ecfdf5;
  border-radius: 8px;
  border: 1px solid #10b981;
  position: relative;
}

.target-page h4 {
  margin: 0 0 8px 0;
  color: #065f46;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.target-page p {
  margin: 0 0 6px 0;
  font-size: 11px;
  color: #065f46;
  font-weight: 400;
  line-height: 1.4;
}

.target-page a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;
}

.target-page a:hover {
  color: #2563eb;
}

/* 代理操作按钮样式 */
.proxy-actions {
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 视频监控中心 - 现代简洁设计 */
.video-monitor-section {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.video-monitor-section h2 {
  margin: 0 0 24px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
}

/* 状态概览 - 简洁设计 */
.status-overview {
  margin-bottom: 20px;
}

.status-row {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px 20px;
  position: relative;
  transition: all 0.2s ease;
}

.status-row:hover {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-actions {
  display: flex;
  gap: 10px;
}

.status-actions .action-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 90px;
}

.status-actions .refresh-btn {
  background: #06b6d4;
  color: white;
}

.status-actions .refresh-btn:hover {
  background: #0891b2;
}

.status-actions .clear-btn {
  background: #ef4444;
  color: white;
}

.status-actions .clear-btn:hover {
  background: #dc2626;
}

.status-actions .action-btn:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}

/* 视频列表 - 简洁设计 */
.video-list-container {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
  overflow: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 视频列表标题和操作按钮布局 */
.video-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.video-list-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  text-align: left;
  flex-shrink: 0;
}

.video-list-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.video-list-actions .action-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.video-list-actions .refresh-btn {
  background: #06b6d4;
  color: white;
}

.video-list-actions .refresh-btn:hover {
  background: #0891b2;
}

.video-list-actions .clear-btn {
  background: #ef4444;
  color: white;
}

.video-list-actions .clear-btn:hover {
  background: #dc2626;
}

.video-list-actions .action-btn:active {
  transform: scale(0.98);
  transition: transform 0.1s;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.video-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.video-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.video-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.video-main-info {
  flex: 1;
  min-width: 0;
}

.video-title {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 10px;
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
  line-height: 1.4;
}

.video-index {
  background: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.video-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  min-width: 0;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.meta-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.meta-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 16px;
  text-align: center;
}

.meta-label {
  color: #64748b;
  font-weight: 600;
  flex-shrink: 0;
}

.meta-value {
  color: #1e293b;
  font-weight: 500;
  word-break: break-all;
}

/* 下载相关样式 - 简洁设计 */
.video-download {
  flex-shrink: 0;
  width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 下载按钮 - 简洁设计 */
.download-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: #10b981;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  font-weight: 500;
  width: 100%;
  min-height: 60px;
}

.download-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

.download-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.download-icon {
  font-size: 18px;
}

.download-text {
  font-size: 11px;
  font-weight: 600;
}

/* 下载进度 - 简洁设计 */
.download-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 12px;
  background: #eff6ff;
  border: 1px solid #3b82f6;
  border-radius: 8px;
}

.progress-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
}

.progress-text {
  font-size: 11px;
  color: #1e40af;
  font-weight: 600;
}

.progress-percentage {
  font-size: 12px;
  font-weight: 700;
  color: #1e40af;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.cancel-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: #ef4444;
  color: white;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  background: #dc2626;
}

/* 下载完成 - 简洁设计 */
.download-completed {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 12px;
  background: #ecfdf5;
  border: 1px solid #10b981;
  border-radius: 8px;
}

.completed-icon {
  font-size: 20px;
}

.completed-text {
  font-size: 11px;
  color: #065f46;
  font-weight: 600;
}

.open-btn {
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: #06b6d4;
  color: white;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.open-btn:hover {
  background: #0891b2;
}

/* 无视频状态 - 简洁设计 */
.no-videos {
  text-align: center;
  padding: 40px 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  margin: 20px 0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.no-videos:hover {
  border-color: #94a3b8;
}

.no-videos-content {
  max-width: 400px;
  margin: 0 auto;
}

.no-videos-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
}

.no-videos h4 {
  color: #374151;
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
}

.no-videos p {
  color: #6b7280;
  margin: 0 0 20px 0;
  line-height: 1.5;
  font-size: 14px;
}

.no-videos-steps {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.no-videos-steps p {
  margin: 0 0 12px 0;
  font-weight: 600;
  color: #374151;
  font-size: 16px;
  text-align: center;
}

.no-videos-steps ol {
  margin: 0;
  padding-left: 20px;
  color: #374151;
}

.no-videos-steps li {
  margin-bottom: 8px;
  line-height: 1.5;
  font-size: 13px;
  font-weight: 400;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .app-layout {
    flex-direction: column;
    height: auto;
  }

  .right-column {
    width: 100%;
    flex-direction: row;
    gap: 15px;
    border-left: none;
    border-top: 1px solid #e9ecef;
  }

  .left-column {
    height: auto;
  }

  .video-monitor-section {
    height: auto;
  }

  .video-list-container {
    max-height: 400px;
  }
}

@media (max-width: 768px) {
  .right-column {
    flex-direction: column;
  }

  .status-row {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .status-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .status-actions .action-btn {
    flex: 1;
    min-width: 120px;
  }

  .meta-row {
    flex-direction: column;
    gap: 6px;
  }

  .video-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .video-download {
    width: 100%;
    flex-direction: row;
    justify-content: center;
  }

  .download-btn {
    width: auto;
    min-width: 80px;
    padding: 8px 16px;
    flex-direction: row;
    gap: 6px;
    min-height: auto;
  }

  .download-progress {
    flex: 1;
    max-width: 200px;
  }
}
</style>
