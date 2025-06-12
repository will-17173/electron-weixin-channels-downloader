<template>
  <div class="app-container">
    <div class="app-layout">
      <!-- 左列：视频监控中心 -->
      <div class="left-column">
        <VideoMonitor
          :video-monitor-status="videoMonitorStatus"
          :display-limit="displayLimit"
          @refresh-status="refreshVideoMonitorStatus"
          @clear-data="clearVideoData"
          @download-video="downloadVideo"
          @cancel-download="cancelDownload"
          @open-folder="openDownloadFolder"
        />
      </div>

      <!-- 右列：证书管理和代理服务器 -->
      <div class="right-column">
        <!-- 按钮组 -->
        <ActionButtons @show-guide="showUserGuide" @show-donation="showDonation" />

        <!-- 证书管理 -->
        <CertificateManager
          :certificate-status="certificateStatus"
          :is-windows="isWindows"
          :is-mac-o-s="isMacOS"
          @check-certificate="checkCertificate"
          @install-certificate="installCertificate"
          @uninstall-certificate="uninstallCertificate"
        />

        <!-- 代理服务器 -->
        <ProxyManager
          :system-proxy-status="systemProxyStatus"
          :video-monitor-status="videoMonitorStatus"
          :proxy-address="proxyAddress"
          @start-proxy="startProxy"
          @stop-proxy="stopProxy"
        />
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
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { useAnalytics, AnalyticsEvents, AnalyticsFeatures } from './composables/useAnalytics.js'
import { useFirstLaunch, useGuideAnalytics } from './composables/useFirstLaunch.js'
import UserGuide from './components/UserGuide.vue'
import DonationModal from './components/DonationModal.vue'
import VideoMonitor from './components/VideoMonitor.vue'
import ActionButtons from './components/ActionButtons.vue'
import CertificateManager from './components/CertificateManager.vue'
import ProxyManager from './components/ProxyManager.vue'

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

// 代理地址
const proxyAddress = ref('127.0.0.1:57392')

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
      // 只有非取消下载的错误才显示弹窗
      if (!result.message.includes('下载已被取消')) {
        alert(`下载失败: ${result.message}`)
      }
    }
  } catch (error) {
    console.error('❌ 下载视频失败:', error)
    console.error('错误堆栈:', error.stack)
    video.downloading = false
    // 只有非取消下载的错误才显示弹窗
    if (!error.message.includes('下载已被取消')) {
      alert(`下载失败: ${error.message}`)
    }
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
  }

  .left-column {
    height: auto;
  }
}

@media (max-width: 768px) {
  .right-column {
    flex-direction: column;
  }

  .app-layout {
    padding: 8px;
    gap: 8px;
  }
}
</style>
