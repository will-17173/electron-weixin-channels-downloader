<template>
  <div id="app-container">
    <!-- Left Panel -->
    <div class="left-panel">
      <VideoMonitor
        :is-monitoring="isMonitoring"
        :server-port="serverPort"
        :captured-videos="capturedVideos"
        @refresh="refreshAll"
        @clear-videos="clearVideoList"
        @download-video="downloadVideo"
        @cancel-download="cancelDownload"
      />
    </div>

    <!-- Right Panel -->
    <div class="right-panel">
      <ActionButtons @start-proxy="startProxy" @stop-proxy="stopProxy" />
      <CertificateManager
        :certificate-status="certificateStatus"
        :is-windows="isWindows"
        :is-mac-o-s="isMacOS"
        @check-certificate="checkCertificate"
        @install-certificate="installCertificate"
        @uninstall-certificate="uninstallCertificate"
        @export-certificate="exportCertificate"
      />
      <ProxyManager :proxy-status="proxyStatus" @set-proxy="setProxy" @check-proxy="checkProxy" />
      <UserGuide :is-first-launch="isFirstLaunch" @guide-closed="handleGuideClosed" />
      <DonationModal />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import VideoMonitor from './components/VideoMonitor.vue'
import CertificateManager from './components/CertificateManager.vue'
import ProxyManager from './components/ProxyManager.vue'
import ActionButtons from './components/ActionButtons.vue'
import UserGuide from './components/UserGuide.vue'
import DonationModal from './components/DonationModal.vue'
import { useAnalytics } from './composables/useAnalytics.js'
import { useFirstLaunch } from './composables/useFirstLaunch.js'

const { trackEvent } = useAnalytics()
const { isFirstLaunch, setLaunched } = useFirstLaunch()

const isMonitoring = ref(false)
const serverPort = ref(null)
const capturedVideos = ref([])
const certificateStatus = ref({
  exists: false,
  installed: false,
  path: '',
  loading: false
})
const proxyStatus = ref({
  enabled: false,
  loading: false
})

const isWindows = computed(() => navigator.platform.includes('Win'))
const isMacOS = computed(() => navigator.platform.includes('Mac'))

// --- Main Actions ---

const startProxy = async () => {
  try {
    await window.api.invoke('start-proxy')
    refreshAll()
    trackEvent('proxy_started')
  } catch (error) {
    console.error('Failed to start proxy:', error)
  }
}

const stopProxy = async () => {
  try {
    await window.api.invoke('stop-proxy')
    refreshAll()
    trackEvent('proxy_stopped')
  } catch (error) {
    console.error('Failed to stop proxy:', error)
  }
}

// --- Certificate Management ---

const checkCertificate = async () => {
  certificateStatus.value.loading = true
  try {
    const result = await window.api.invoke('check-certificate')
    certificateStatus.value = { ...certificateStatus.value, ...result, loading: false }
  } catch (error) {
    console.error('Failed to check certificate:', error)
    certificateStatus.value.loading = false
  }
}

const installCertificate = async () => {
  certificateStatus.value.loading = true
  try {
    await window.api.invoke('install-certificate')
  } catch (error) {
    console.error('Failed to install certificate:', error)
  } finally {
    certificateStatus.value.loading = false
  }
}

const uninstallCertificate = async () => {
  certificateStatus.value.loading = true
  try {
    await window.api.invoke('uninstall-certificate')
  } catch (error) {
    console.error('Failed to uninstall certificate:', error)
  } finally {
    certificateStatus.value.loading = false
  }
}

const exportCertificate = async () => {
  certificateStatus.value.loading = true
  try {
    await window.api.invoke('export-certificate')
  } catch (error) {
    console.error('Failed to export certificate:', error)
  } finally {
    certificateStatus.value.loading = false
  }
}

// --- Proxy Management ---

const checkProxy = async () => {
  proxyStatus.value.loading = true
  try {
    const result = await window.api.invoke('check-proxy')
    proxyStatus.value = { ...result, loading: false }
  } catch (error) {
    console.error('Failed to check proxy:', error)
    proxyStatus.value.loading = false
  }
}

const setProxy = async (enable) => {
  proxyStatus.value.loading = true
  try {
    await window.api.invoke('set-proxy', enable)
  } catch (error) {
    console.error(`Failed to ${enable ? 'set' : 'unset'} proxy:`, error)
  } finally {
    proxyStatus.value.loading = false
  }
}

// --- Video & Monitoring ---

const refreshVideoMonitorStatus = async () => {
  try {
    const status = await window.api.invoke('get-monitoring-status')
    isMonitoring.value = status.isMonitoring
    serverPort.value = status.port
  } catch (error) {
    console.error('Failed to refresh video monitor status:', error)
  }
}

const fetchCapturedVideos = async () => {
  try {
    const videos = await window.api.invoke('get-captured-videos')
    capturedVideos.value = videos
  } catch (error) {
    console.error('Failed to fetch captured videos:', error)
  }
}

const clearVideoList = async () => {
  try {
    await window.api.invoke('clear-captured-videos')
    capturedVideos.value = []
    trackEvent('video_list_cleared', { video_count: capturedVideos.value.length })
  } catch (error) {
    console.error('Failed to clear video list:', error)
  }
}

// --- Download Management ---
const downloadVideo = (video) => {
  window.api.invoke('download-video', video.id)
}

const cancelDownload = (videoId) => {
  window.api.invoke('cancel-download', videoId)
}

// --- Lifecycle & IPC ---

const handleGuideClosed = (dontShowAgain) => {
  if (dontShowAgain) {
    setLaunched()
  }
}

const refreshAll = () => {
  checkCertificate()
  checkProxy()
  refreshVideoMonitorStatus()
  fetchCapturedVideos()
}

onMounted(() => {
  window.api.on('install-certificate-reply', (response) => {
    if (response.success) {
      alert('证书安装成功！')
    } else {
      alert(`证书安装失败: ${response.error}`)
    }
    checkCertificate()
  })

  window.api.on('uninstall-certificate-reply', (response) => {
    if (response.success) {
      alert('证书卸载成功！')
    } else {
      alert(`证书卸载失败: ${response.error}`)
    }
    checkCertificate()
  })

  window.api.on('export-certificate-reply', (response) => {
    if (response.success) {
      alert(`证书已成功导出到: ${response.path}`)
    } else {
      alert(`导出证书失败: ${response.error}`)
    }
    checkCertificate()
  })

  window.api.on('set-proxy-reply', (response) => {
    if (response.success) {
      alert('系统代理设置成功！')
    } else {
      alert(`系统代理设置失败: ${response.error}`)
    }
    checkProxy()
  })

  window.api.on('video-data-captured', (video) => {
    const existingVideo = capturedVideos.value.find((v) => v.id === video.id)
    if (existingVideo) {
      Object.assign(existingVideo, video)
    } else {
      capturedVideos.value.unshift(video)
    }
  })

  window.api.on('download-progress', ({ videoId, percent }) => {
    const video = capturedVideos.value.find((v) => v.id === videoId)
    if (video) {
      video.downloadPercent = percent
      video.status = 'downloading'
    }
  })

  window.api.on('download-completed', ({ videoId, filePath }) => {
    const video = capturedVideos.value.find((v) => v.id === videoId)
    if (video) {
      video.status = 'completed'
      video.filePath = filePath
    }
  })

  window.api.on('download-failed', ({ videoId, error }) => {
    const video = capturedVideos.value.find((v) => v.id === videoId)
    if (video) {
      video.status = 'failed'
      video.error = error
    }
    alert(`视频 [${video.title}] 下载失败: ${error}`)
  })

  refreshAll()
})
</script>

<style>
/* Global styles remain the same */
#app-container {
  display: flex;
  height: 100vh;
  background-color: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
    sans-serif;
}

.left-panel {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  border-right: 1px solid #dcdfe6;
}

.right-panel {
  width: 280px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #ffffff;
}
</style>
