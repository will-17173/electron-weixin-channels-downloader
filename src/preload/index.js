import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // 证书管理API
  installCertificate: () => ipcRenderer.invoke('install-certificate'),
  checkCertificate: () => ipcRenderer.invoke('check-certificate'),
  uninstallCertificate: () => ipcRenderer.invoke('uninstall-certificate'),

  // 管理员权限API (保留检查功能)
  checkAdminStatus: () => ipcRenderer.invoke('check-admin-status'),

  // 监听状态API
  getMonitoringStatus: () => ipcRenderer.invoke('get-monitoring-status'),
  onMonitoringStatusUpdate: (callback) => {
    ipcRenderer.on('monitoring-status-update', (_event, status) => callback(status))
    // 返回取消监听的函数
    return () => ipcRenderer.removeAllListeners('monitoring-status-update')
  },

  // 视频数据API
  getCapturedVideos: () => ipcRenderer.invoke('get-captured-videos'),
  clearCapturedVideos: () => ipcRenderer.invoke('clear-captured-videos'),
  onVideoCaptured: (callback) => {
    ipcRenderer.on('video-data-captured', (_event, videoData) => callback(videoData))
    return () => ipcRenderer.removeAllListeners('video-data-captured')
  },

  // 下载相关API
  downloadVideo: (videoData) => ipcRenderer.invoke('download-video', videoData),
  cancelDownload: (videoId) => ipcRenderer.invoke('cancel-download', videoId),
  openDownloadFolder: () => ipcRenderer.invoke('open-download-folder'),
  showDownloadedFile: (filePath) => ipcRenderer.invoke('show-downloaded-file', filePath),

  // 下载进度监听
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('download-progress')
  },

  onDownloadCompleted: (callback) => {
    ipcRenderer.on('download-completed', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('download-completed')
  },

  onDownloadFailed: (callback) => {
    ipcRenderer.on('download-failed', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('download-failed')
  },

  onDownloadCancelled: (callback) => {
    ipcRenderer.on('download-cancelled', (_event, data) => callback(data))
    return () => ipcRenderer.removeAllListeners('download-cancelled')
  },

  // 代理控制API
  startProxy: () => ipcRenderer.invoke('start-proxy'),
  stopProxy: () => ipcRenderer.invoke('stop-proxy'),
  getProxyStatus: () => ipcRenderer.invoke('get-proxy-status'),

  // Analytics API
  analytics: {
    initialize: (options) => ipcRenderer.invoke('analytics-initialize', options),
    trackEvent: (eventName, parameters) =>
      ipcRenderer.invoke('analytics-track-event', eventName, parameters),
    trackPage: (pageName, customParams) =>
      ipcRenderer.invoke('analytics-track-page', pageName, customParams),
    setConsent: (consent) => ipcRenderer.invoke('analytics-set-consent', consent),
    getConsent: () => ipcRenderer.invoke('analytics-get-consent')
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
