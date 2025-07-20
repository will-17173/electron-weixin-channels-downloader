import { contextBridge, ipcRenderer } from 'electron'

// --- Expose a subset of ipcRenderer to the renderer process ---
contextBridge.exposeInMainWorld('api', {
  // --- Invoke (send to main and expect a response) ---
  invoke: (channel, ...args) => {
    // Whitelist of channels allowed to be invoked
    const whiteListedChannels = [
      'check-certificate',
      'install-certificate',
      'uninstall-certificate',
      'export-certificate', // Added for export functionality
      'check-proxy',
      'set-proxy',
      'check-admin-status',
      'get-monitoring-status',
      'get-captured-videos',
      'clear-captured-videos',
      'download-video',
      'cancel-download',
      'open-download-folder',
      'show-downloaded-file',
      'start-proxy',
      'stop-proxy',
      'get-proxy-status',
      'analytics-initialize',
      'analytics-track-event',
      'analytics-track-page',
      'analytics-set-consent',
      'analytics-get-consent'
    ]
    if (whiteListedChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    // Optionally, you can throw an error for security reasons
    // throw new Error(`Channel "${channel}" is not allowed for invoke.`)
  },

  // --- On (listen for events from main) ---
  on: (channel, listener) => {
    // Whitelist of channels allowed to be subscribed to
    const whiteListedChannels = [
      'check-certificate-reply',
      'install-certificate-reply',
      'uninstall-certificate-reply',
      'export-certificate-reply', // Added for export functionality
      'check-proxy-reply',
      'set-proxy-reply',
      'proxy-status-change',
      'monitoring-status-update',
      'video-data-captured',
      'download-progress',
      'download-completed',
      'download-failed',
      'download-cancelled'
    ]
    if (whiteListedChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender`
      ipcRenderer.on(channel, (event, ...args) => listener(...args))
    }
    // Optionally, you can throw an error for security reasons
    // throw new Error(`Channel "${channel}" is not allowed for on.`)
  },

  // --- Once (listen for a single event from main) ---
  once: (channel, listener) => {
    const whiteListedChannels = [] // Define if needed
    if (whiteListedChannels.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => listener(...args))
    }
  },

  // --- Remove Listener ---
  removeListener: (channel, listener) => {
    ipcRenderer.removeListener(channel, listener)
  },

  // --- Remove All Listeners ---
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  }
})
